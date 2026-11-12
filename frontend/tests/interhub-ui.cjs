// Real checkout components, isolated API fixtures, and a local headless Chrome instance.
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const esbuild = require('../../admin-panel/node_modules/esbuild');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, '.tmp/interhub-ui');
const pause = ms => new Promise(r => setTimeout(r, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function main() {
  await fs.mkdir(output, { recursive: true });
  const mock = `
    const points = [
      {code:'A', countyCode:'tehran', name:'میدان تهران', address:'تهران، نشانی میدان', hours:'۸ تا ۱۶', collectionTerms:'دریافت با هماهنگی'},
      {code:'B', countyCode:'mashhad', name:'میدان مشهد', address:'مشهد، نشانی میدان', hours:'۸ تا ۱۶', collectionTerms:'دریافت با هماهنگی'}
    ];
    const bookings = {}; window.__bookings = bookings;
    export const deliveryApi = {
      points: async () => points, destinations: async () => window.__onlyLocal ? [points[0]] : window.__extraPoint ? [...points,{...points[0],code:"C",name:"میدان دوم تهران"}] : points,
      get: async code => structuredClone(bookings[code]),
      quote: async data => {
        window.__quoteInput = data; data = { ...data, pointCode: data.pointCode || 'B' };
        const legs = [];
        if(data.pointCode === 'B') legs.push({code:'transfer',kind:'InterHub',route:'تهران ← مشهد',fee:window.__unknown?null:120,transitDays:2,status:'Waiting'});
        if(data.method === 'Direct') legs.push({code:'local',kind:'Local',route:'میدان ← نشانی',fee:data.pointCode === 'A'?20:30,transitDays:0,status:'Waiting'});
        const fee = legs.some(l=>l.fee == null)?null:legs.reduce((s,l)=>s+l.fee,0);
        const code = String(Object.keys(bookings).length+1);
        const b = {code, method:data.method, destinationCode:data.pointCode,point:points.find(p=>p.code===data.pointCode).name,fee,legs,quoteExpiresAt:new Date(Date.now()+86400000).toISOString()};
        bookings[code]=b; window.__lastCode=code; return structuredClone(b);
      }
    };
  `;
  await esbuild.build({
    stdin: { contents: `
      import React, {useState} from 'react'; import {createRoot} from 'react-dom/client';
      import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
      import DeliveryChoice from './src/design-system/organisms/platform/DeliveryChoice';
      import MarketFilter from './src/design-system/organisms/platform/MarketFilter';
      import {calendarInput,calendarValue} from './src/shared/utils/persian-calendar';
      import {productFilterParams} from './src/shared/utils/product-filters';
      const client=new QueryClient({defaultOptions:{queries:{retry:false}}});window.__query=client;
      window.__future=calendarInput(calendarValue('',new Date(Date.now()+2*86400000)));
      const selected=v=>window.__selection=v??null;
      function App(){const [county,setCounty]=useState(undefined);window.__setCounty=setCounty;const [market,setMarket]=useState({pointCode:'',localOnly:true});return <QueryClientProvider client={client}>
        <main dir="rtl"><div id="checkout"><DeliveryChoice key={county} countyCode={county} cartId="cart" addressCode="address" fingerprint="cart-v1" onSelect={selected}/></div>
        <div id="market"><MarketFilter {...market} onChange={(pointCode,localOnly)=>{setMarket({pointCode,localOnly});window.__market=productFilterParams({pointCode,localOnly,minPrice:'',maxPrice:'',category:'',sort:'',stockOnly:false,discountedOnly:false})}}/></div></main>
      </QueryClientProvider>};createRoot(document.getElementById('root')).render(<App/>);
    `, resolveDir: path.join(root, 'frontend'), loader: 'tsx' },
    outfile: path.join(output, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic',
    alias: { '@': path.join(root, 'frontend/src') },
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'api-fixtures', setup(build) {
      build.onResolve({ filter: /lib\/actions\/delivery$/ }, () => ({ path: 'delivery-api', namespace: 'fixture' }));
      build.onResolve({ filter: /lib\/actions\/platform$/ }, () => ({ path: 'errors', namespace: 'fixture' }));
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'delivery-api' ? mock : 'export const errorMessage=e=>e?.message??"خطا";', loader: 'js' }));
    }}]
  });
  const css = `body{margin:0;background:#f8fafc;color:#1e293b;font:16px Tahoma,Arial}main{max-width:700px;margin:24px auto;padding:12px}section,#market{background:white;border:1px solid #d1fae5;border-radius:20px;margin-bottom:20px;padding:20px}p{line-height:1.9}label{display:block;margin:12px 0}select,input{font:inherit;padding:10px;border:1px solid #cbd5e1;border-radius:9px;max-width:100%;box-sizing:border-box}select{width:100%}button{font:inherit;padding:12px;border:1px solid #a7f3d0;border-radius:9px;cursor:pointer}button:disabled{opacity:.4}input[type=checkbox]{margin-left:10px}summary{cursor:pointer}h2{font-size:20px}`;
  const html = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`;
  const server = http.createServer(async (req, res) => { res.setHeader('Content-Type', req.url === '/bundle.js' ? 'text/javascript' : 'text/html; charset=utf-8'); res.end(req.url === '/bundle.js' ? await fs.readFile(path.join(output,'bundle.js')) : html); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const profile = path.join(output, 'profile-' + Date.now());
  const browser = spawn(chrome, ['--headless=new','--disable-gpu','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'], { windowsHide:true, stdio:['ignore','ignore','pipe'] });
  let socket;
  try {
    const devtools = await new Promise((resolve,reject)=>{let stderr='';const timer=setTimeout(()=>reject(new Error('Chrome did not start')),20000);browser.stderr.on('data',c=>{stderr+=c;const found=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(found){clearTimeout(timer);resolve(found[1]);}});browser.on('error',reject);});
    const port = new URL(devtools).port;
    const page = (await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(p=>p.type==='page');
    socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
    let sequence=0;const pending=new Map();const errors=[];
    socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const item=pending.get(data.id);if(item){pending.delete(data.id);data.error?item.reject(new Error(JSON.stringify(data.error))):item.resolve(data.result);}}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);});
    const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
    const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
    const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate('Boolean('+expression+')'))return;await pause(100);}throw new Error('Timed out: '+expression+'; '+await evaluate('document.body.innerText'));};
    const set=async(selector,value,tag='HTMLSelectElement')=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${tag}.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(${tag==='HTMLSelectElement'?"'change'":"'input'"},{bubbles:true}));})()`);await pause(120);};
    const click=async text=>{await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes(${JSON.stringify(text)})).click()`);};
    await call('Runtime.enable');await call('Page.enable');
    await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port});
    await waitFor('document.querySelectorAll("#checkout select")[1]?.options.length===3');
    await set('#checkout select','Direct');
    assert(await evaluate('document.querySelectorAll("#checkout select").length===1'),'Home delivery still requires a manual hub');
    await set('#checkout input',await evaluate('window.__future'),'HTMLInputElement');
    await click('بررسی هزینه دریافت');await waitFor('window.__lastCode && document.querySelector("input[type=checkbox]")');
    assert(await evaluate('window.__quoteInput.pointCode===undefined && window.__quoteInput.method==="Direct"'),'Selected destination not sent');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.fee===150');
    await evaluate(`window.__bookings[window.__lastCode].fee=155;window.__bookings[window.__lastCode].legs[0].fee=125;window.__query.invalidateQueries({queryKey:['delivery-quote']})`);
    await waitFor('window.__selection===null && !document.querySelector("input[type=checkbox]").checked');
    await set('#checkout select','Pickup');
    await evaluate(`(()=>{const e=document.querySelectorAll('#checkout select')[1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'A');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await pause(150);await click('بررسی هزینه دریافت');await waitFor('document.querySelector("input[type=checkbox]") && window.__bookings[window.__lastCode]?.fee===0');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.fee===0');
    await evaluate('window.__unknown=true');
    await evaluate(`(()=>{const e=document.querySelectorAll('#checkout select')[1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'B');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await pause(150);await click('بررسی هزینه دریافت');await waitFor('window.__bookings[window.__lastCode]?.fee===null && document.body.innerText.includes("در انتظار اعلام هزینه")');
    assert(await evaluate('window.__selection===null && document.querySelector("input[type=checkbox]").disabled'),'Unknown fee was accepted without a cap');
    await set('#checkout input[inputmode=numeric]','200','HTMLInputElement');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.deferredFeeLimit===200 && window.__selection?.fee===0');
    await set('#checkout input[inputmode=numeric]','250','HTMLInputElement');
    await waitFor('window.__selection===null && !document.querySelector("input[type=checkbox]").checked');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.deferredFeeLimit===250');
    await evaluate(`window.__bookings[window.__lastCode].fee=120;window.__bookings[window.__lastCode].legs[0].fee=120;window.__query.invalidateQueries({queryKey:['delivery-quote']})`);
    await waitFor('window.__selection===null && !document.querySelector("input[type=checkbox]").checked');
    await evaluate(`document.querySelector('#market button').click()`);await waitFor('document.querySelector("#market input")');await set('#market input','مشهد','HTMLInputElement');await evaluate(`Array.from(document.querySelectorAll('#market button')).find(b=>b.textContent.includes('میدان مشهد')).click()`);await waitFor('document.querySelectorAll("#market select").length===1');
    await evaluate(`(()=>{const e=document.querySelector('#market select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'all');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await waitFor('window.__market?.DestinationPointCode==="B" && window.__market?.DeliveryPointCode===undefined');
    await evaluate('window.__unknown=false;window.__setCounty("mashhad")');
    await waitFor('document.querySelectorAll("#checkout select").length===1 && document.querySelector("#checkout").innerText.includes("میدان دریافت در شهرستان")');
    await set('#checkout input[placeholder]',await evaluate('window.__future'),'HTMLInputElement');
    await click('بررسی هزینه دریافت');await waitFor('window.__quoteInput.pointCode==="B" && document.querySelector("input[type=checkbox]")');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.fee===120');
    await click('دریافت از میدان دیگر');
    await waitFor('window.__selection===null && document.querySelectorAll("#checkout select").length===2');
    assert(await evaluate('document.querySelectorAll("#checkout select")[1].value===""'),'Other field selector silently reused local field');
    await evaluate(`(()=>{const e=document.querySelectorAll('#checkout select')[1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'A');e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await pause(150);await click('بررسی هزینه دریافت');
    await waitFor('window.__quoteInput.pointCode==="A" && window.__bookings[window.__lastCode]?.fee===0 && document.querySelector("input[type=checkbox]")');
    assert(await evaluate('window.__selection===null'),'Changing field reused prior cost consent');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.fee===0');
    await click('بازگشت به میدان‌های شهرستان من');
    await waitFor('window.__selection===null && document.querySelectorAll("#checkout select").length===1');
    await click('بررسی هزینه دریافت');
    await waitFor('window.__quoteInput.pointCode==="B" && window.__bookings[window.__lastCode]?.fee===120');
    await evaluate('window.__setCounty("tehran")');
    await waitFor('window.__selection===null && !document.querySelector("input[type=checkbox]") && document.querySelectorAll("#checkout select").length===1');
    await evaluate('window.__extraPoint=true;window.__query.invalidateQueries({queryKey:["delivery-destinations"]})');
    await waitFor('document.querySelectorAll("#checkout select").length===2');
    assert(await evaluate('Array.from(document.querySelectorAll("#checkout select")[1].options).map(o=>o.value).join(",")===",A,C"'),'Multiple local fields included another county or auto-selected a field');
    await evaluate('window.__setCounty("unserved")');
    await waitFor('document.querySelector("#checkout").innerText.includes("شهرستان دیگری")');
    assert(await evaluate('document.querySelectorAll("#checkout select")[1].value===""'),'No local field silently chose an out-of-county destination');
    await evaluate('window.__onlyLocal=true;window.__setCounty("tehran");window.__query.invalidateQueries({queryKey:["delivery-destinations"]})');
    await waitFor('document.querySelectorAll("#checkout select").length===1 && Array.from(document.querySelectorAll("#checkout button")).some(b=>b.textContent.includes("دریافت از میدان دیگر"))');
    await set('#checkout input[placeholder]',await evaluate('window.__future'),'HTMLInputElement');
    await click('بررسی هزینه دریافت');await waitFor('window.__quoteInput.pointCode==="A" && window.__bookings[window.__lastCode]?.fee===0 && document.querySelector("input[type=checkbox]")');
    await evaluate('document.querySelector("input[type=checkbox]").click()');await waitFor('window.__selection?.fee===0');
    await click('دریافت از میدان دیگر');
    await waitFor('document.querySelector("#checkout").innerText.includes("فعلاً میدان دیگری با مسیر فعال")');
    assert(await evaluate('document.querySelectorAll("#checkout select").length===1 && window.__selection?.fee===0 && document.querySelector("input[type=checkbox]").checked'),'Opening unavailable alternatives lost automatic field or existing consent');
    console.log('PASS: other-field link stays visible with a single eligible field and shows why no alternatives are available without clearing the selected field.');
    console.log('PASS: one local field selected automatically, multiple local fields require choice, address change clears consent, unavailable county offers explicit fallback.');
    for(const [label,width] of [['desktop',1200],['mobile',390]]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:width<500});
      assert(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Horizontal overflow at '+label);
      const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(output,label+'.png'),Buffer.from(shot.data,'base64'));
    }
    assert(errors.length===0,'Browser errors: '+errors.join(', '));
    console.log('PASS: destination/method submission, stale-price consent reset, zero vs unknown fee, explicit shipping cap and cap/price changes, market filter, desktop/mobile overflow and browser errors.');
  } finally {socket?.close();browser.kill();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
