const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const local = createRequire(path.resolve(__dirname, '../package.json'));
const ts = local('typescript');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '../.tmp/mobile-map');
const pause = ms => new Promise(r => setTimeout(r, ms));
const assert = (v, message) => { if (!v) throw new Error(message); };
async function load(file) {
  const exports = {}, module = { exports };
  const aliases = {};
  const source = await fs.readFile(file, 'utf8');
  for (const m of source.matchAll(/import\s+\{[^}]+\}\s+from\s+"([.][^"]+)"/g)) aliases[m[1]] = await load(path.resolve(path.dirname(file), m[1] + '.ts'));
  new Function('exports','module','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,module,name=>aliases[name]??local(name));
  return module.exports;
}
async function main() {
  await fs.mkdir(output,{recursive:true});
  const { createMapHtml } = await load(path.join(root,'src/shared/utils/mapHtml.ts'));
  const html = createMapHtml({latitude:35.6998616,longitude:51.3488777},true,'native',{tileUrl:'https://tiles.example.test/{z}/{x}/{y}.png',maxZoom:19,attribution:'Fixture street',searchEnabled:false});
  const server = http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+path.join(output,'profile-'+Date.now()),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let socket;
  try {
    const devtools = await new Promise((resolve,reject)=>{let data='';const timer=setTimeout(()=>reject(new Error('Chrome timeout')),20000);browser.stderr.on('data',c=>{data+=c;const found=data.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(found){clearTimeout(timer);resolve(found[1]);}});browser.on('error',reject);});
    const page=(await(await fetch('http://127.0.0.1:'+new URL(devtools).port+'/json')).json()).find(p=>p.type==='page');
    socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
    let seq=0,mode='normal';const pending=new Map(),requests=[],errors=[];
    const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
    socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const entry=pending.get(data.id);if(entry){pending.delete(data.id);data.error?entry.reject(new Error(JSON.stringify(data.error))):entry.resolve(data.result);}}else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);else if(data.method==='Fetch.requestPaused'){
      const e=data.params;requests.push(e.request);
      const blocked=e.request.url.includes('arcgisonline.com')&&(mode==='blocked'||mode==='fallback'&&new URL(e.request.url).hostname==='server.arcgisonline.com');
      void call(blocked?'Fetch.failRequest':'Fetch.fulfillRequest',blocked?{requestId:e.requestId,errorReason:'Failed'}:{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/png'}],body:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='}).catch(err=>errors.push(String(err)));
    }});
    const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
    const wait=async expression=>{for(let n=0;n<100;n++){if(await evaluate('Boolean('+expression+')'))return;await pause(100);}throw new Error('Timed out: '+expression);};
    await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
    await call('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 13; Mobile; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Aloogiyah-App/1.0'});
    await call('Fetch.enable',{patterns:[{urlPattern:'https://*.arcgisonline.com/*'},{urlPattern:'https://tiles.example.test/*'}]});
    await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.ReactNativeWebView={postMessage:value=>{(window.__messages??=[]).push(value)}};'});
    const navigate=async()=>{await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?t='+Date.now()});await wait('window.__messages?.includes("ready")');};
    await navigate();await wait('document.querySelector("img.leaflet-tile-loaded")');
    assert(await evaluate('map.hasLayer(satellite) && document.querySelector(".map-tile-status").hidden'),'Satellite is not the healthy default');
    mode='fallback';await navigate();await wait('Array.from(document.querySelectorAll("img.leaflet-tile-loaded")).some(i=>i.src.includes("services.arcgisonline.com"))');
    assert(await evaluate('map.hasLayer(satellite) && document.querySelector(".map-tile-status").hidden'),'Fallback silently switched to street or retained error');
    assert(requests.filter(r=>r.url.includes('arcgisonline.com')).every(r=>!Object.keys(r.headers).some(h=>h.toLowerCase()==='referer')),'Imagery leaked WebView origin as referrer');
    mode='blocked';await navigate();await wait('!document.querySelector(".map-tile-status").hidden');
    assert(await evaluate('document.querySelector(".map-tile-status").innerText.includes("ماهواره‌ای")'),'Blocked imagery has no clear explanation');
    mode='normal';await evaluate('document.querySelector(".map-tile-status button").click()');await wait('document.querySelector(".map-tile-status").hidden && document.querySelector("img.leaflet-tile-loaded")');
    await evaluate('document.querySelectorAll(".leaflet-control-layers-base input")[1].click()');await wait('map.hasLayer(street) && Array.from(document.querySelectorAll("img.leaflet-tile-loaded")).some(i=>i.src.includes("tiles.example.test"))');
    assert(await evaluate('marker.getLatLng().lat===35.6998616 && marker.getLatLng().lng===51.3488777'),'Layer retry changed saved location');
    await evaluate('map.fire("click",{latlng:L.latLng(35.7,51.4)});true');assert(await evaluate('JSON.parse(window.__messages.at(-1)).latitude===35.7'),'Map picking bridge broke');
    assert(errors.length===0,errors.join('\n'));
    console.log('PASS: actual bundled Leaflet HTML, Android-style user agent, imagery first source/fallback, no-referrer policy, blocked-image explanation, retry, street switching, saved marker and native coordinate bridge.');
  } finally {socket?.close();browser.kill();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
