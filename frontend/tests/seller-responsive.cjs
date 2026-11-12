// Real checkout components, isolated API fixtures, and a local headless Chrome instance.
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const esbuild = require('../../admin-panel/node_modules/esbuild');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, '.tmp/seller-responsive');
const pause = ms => new Promise(r => setTimeout(r, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function main() {
  await fs.mkdir(output, { recursive: true });
  await esbuild.build({
    stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import Seller from './src/design-system/organisms/platform/SellerSalesWorkspace';createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><div className="dashboard-safe-shell flex h-dvh gap-5"><aside className="hidden md:block w-[210px] shrink-0"/><div className="flex flex-1 min-w-0 flex-col"><header className="h-16 shrink-0">سربرگ</header><main className="overflow-y-auto min-w-0 min-h-0 p-4 flex-1"><Seller/></main></div></div><div className="safe-notification-panel fixed" id="notification">اعلان‌ها</div></QueryClientProvider>);`,resolveDir:path.join(root,'frontend'),loader:'tsx'},
    outfile:path.join(output,'bundle.js'),bundle:true,platform:'browser',format:'iife',jsx:'automatic',alias:{'@':path.join(root,'frontend/src')},define:{'process.env.NODE_ENV':'"development"'},
    plugins:[{name:'fixtures',setup(build){
      const modules={
        'next/link':"import React from 'react';export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}",
        '@/shared/hooks/useSellerAccess':"export const useSellerAccess=()=>({allowed:true,loading:false});",
        '@/lib/actions/platform':`export const errorMessage=e=>e?.message;export async function request(path){if(path.endsWith('/Summary'))return new Proxy({},{get:()=>0});if(path.includes('/Customers'))return {items:[{code:'C1',name:'Buyer1Buyer1',orderCount:2,purchasedAmount:0,lastOrderAt:new Date().toISOString()},{code:'C2',name:'تقی انبارچی',orderCount:5,purchasedAmount:1975000,lastOrderAt:new Date().toISOString()}],totalCount:2};return {items:[],totalCount:0};}`,
        '@/design-system/molecules/platform/ChatRoomLink':"import React from 'react';export default function Chat({children,className}){return <a className={className}>{children}</a>}",
        './SellerDiscountDialog':"export const salesMoney=v=>String(v??0)+' تومان';export const salesDate=v=>'۱۵ آبان ۱۴۰۵';export default function Dialog(){return null;}"
      };
      build.onResolve({filter:/.*/},args=>modules[args.path]?{path:args.path,namespace:'fixture'}:undefined);
      build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:modules[args.path],loader:'tsx',resolveDir:path.join(root,'frontend')}));
    }}]
  });
  const postcss=require('../node_modules/postcss');const tailwind=require('../node_modules/tailwindcss');
  const globals=await fs.readFile(path.join(root,'frontend/src/shared/styles/globals.css'),'utf8');
  const compiled=await postcss([tailwind({content:[path.join(root,'frontend/src/**/*.tsx'),{raw:'w-[210px] h-dvh h-16 flex flex-1 min-w-0 min-h-0 p-4 gap-5 overflow-y-auto hidden md:block fixed shrink-0'}]})]).process('@tailwind base;@tailwind components;@tailwind utilities;'+globals.slice(globals.indexOf('/* The available content')),{from:undefined});
  const css = compiled.css+'body{margin:0;font-family:Arial}#notification{background:white;visibility:hidden}';
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
    await waitFor('document.querySelectorAll(".sales-customers-grid article").length===2');
    for(const width of [320,390,430,768,820,1024,1440]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:width<500});await pause(120);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Page overflow '+width);
      assert(await evaluate('Array.from(document.querySelectorAll(".sales-customers-grid h3")).every(e=>e.getBoundingClientRect().width>=130)'),'Customer name compressed '+width);
      assert(await evaluate('Array.from(document.querySelectorAll(".sales-customers-grid article")).every(e=>e.scrollWidth<=e.clientWidth)'),'Card overflow '+width);
      await evaluate('document.querySelector(".sales-customers-grid").scrollIntoView({block:"start"})');const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(output,width+'.png'),Buffer.from(shot.data,'base64'));
    }
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    const protocol=await (await fetch('http://127.0.0.1:'+port+'/json/protocol')).json();const safeCommand=protocol.domains.find(d=>d.domain==='Emulation').commands.find(c=>/setSafeAreaInsets/i.test(c.name));assert(safeCommand,'Browser has no safe-area emulation');await call('Emulation.'+safeCommand.name,{insets:{top:59,bottom:34,left:0,right:0}});
    assert(await evaluate('parseFloat(getComputedStyle(document.querySelector(".dashboard-safe-shell")).paddingTop)>=59'),'Header under notch');
    assert(await evaluate('parseFloat(getComputedStyle(document.querySelector("#notification")).top)>=131'),'Notification under notch');
    assert(errors.length===0,'Browser errors: '+errors.join(', '));
    console.log('PASS: actual seller component at 320–1440px, readable names, no card/page overflow and simulated iPhone safe-area offsets.');
  } finally {socket?.close();browser.kill();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
