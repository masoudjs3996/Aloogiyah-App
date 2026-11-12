// Real checkout components, isolated API fixtures, and a local headless Chrome instance.
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const esbuild = require('../../admin-panel/node_modules/esbuild');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, '.tmp/product-units');
const pause = ms => new Promise(r => setTimeout(r, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function main() {
  await fs.mkdir(output, { recursive: true });
  await esbuild.build({
    stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import Seller from './src/design-system/organisms/public/ProductDetail';createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><div className="dashboard-safe-shell flex h-dvh gap-5"><aside className="hidden md:block w-[210px] shrink-0"/><div className="flex flex-1 min-w-0 flex-col"><header className="h-16 shrink-0">سربرگ</header><main className="overflow-y-auto min-w-0 min-h-0 p-4 flex-1"><Seller productId="WHEAT00001"/></main></div></div><div className="safe-notification-panel fixed" id="notification">اعلان‌ها</div></QueryClientProvider>);`,resolveDir:path.join(root,'frontend'),loader:'tsx'},
    outfile:path.join(output,'bundle.js'),bundle:true,platform:'browser',format:'iife',jsx:'automatic',alias:{'@':path.join(root,'frontend/src')},define:{'process.env.NODE_ENV':'"development"'},
    plugins:[{name:'fixtures',setup(build){
      const modules={
        'next/link':"import React from 'react';export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}",
        'next/image':"import React from 'react';export default function Image({src,alt}){return <img src={src} alt={alt}/>}",
        '@/hooks/mutations/useCart':"export default ()=>({addCart:{isPending:false,mutate:(data)=>{window.__cartInput=data;}}});",
        '@/hooks/queries/useCommercePricing':"export const useCommercePricing=()=>({wholesale:false,showBoth:false});",
        '@/shared/hooks/useProductOffer':"export default ()=>false;",
        '@/lib/actions/platform':`export const errorMessage=e=>e?.message;export const paged=async()=>({items:[],totalCount:0});export async function request(path){if(path.includes('/AgriculturalProduct/'))return {code:'WHEAT00001',name:'گندم',description:'گندم کیلویی',saleUnit:'Kilogram',stock:2000,retailPrice:100,farmCode:'FARM000001',imageUrls:[]};if(path.includes('/Farm/'))return {code:'FARM000001',name:'مزرعه',ownerCode:'OWNER00001'};if(path.includes('Summary'))return {averageRating:0,ratingCount:0};return [];}`,
        '../platform/ProductDeliveryInfo':"export default ()=>null;",
        '@/design-system/molecules/public/SaveProductButton':"export default ()=>null;",
        '@/design-system/molecules/platform/ChatRoomLink':"import React from 'react';export default function Chat({children,className}){return <a className={className}>{children}</a>}",
        '../Home/AddCommentForm':"export default ()=>null;",
        '../platform/ProductsWorkspace':"export const StoreProductCard=()=>null;"
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
    await waitFor('document.querySelector("[data-product-purchase] input")');
    await set('input[aria-label="مقدار خرید"]','۱۰۰۰','HTMLInputElement');
    await click('افزودن به سبد');await waitFor('window.__cartInput?.quantity===1000');
    assert(await evaluate('document.body.innerText.includes("کیلوگرم")'),'Product unit not displayed');
    await set('input[aria-label="مقدار خرید"]','2001','HTMLInputElement');
    assert(await evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("افزودن به سبد")).disabled'),'Over-stock quantity accepted');
    await set('input[aria-label="مقدار خرید"]','','HTMLInputElement');
    assert(await evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("افزودن به سبد")).disabled'),'Empty quantity accepted');
    assert(errors.length===0,'Browser errors: '+errors.join(', '));
    console.log('PASS: real product detail accepts 1000 kg in Persian digits, sends integer quantity, displays unit and blocks empty/over-stock purchases.');
  } finally {socket?.close();browser.kill();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
