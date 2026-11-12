import { normalize, unwrap, resolvePath, serializeFields, appendForm } from '../utils/contracts.mjs';
import schemas from '../types/schemas.json';
import type {Endpoint,Row} from '../types';
export const API_BASE=(import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5056/api' : '')).replace(/\/$/,'');
if (!API_BASE || (import.meta.env.PROD && !/^https:\/\//i.test(API_BASE))) throw new Error('نشانی HTTPS سرور باید برای انتشار پنل تنظیم شود.');
let token=sessionStorage.getItem('ag-admin-token')||'';
let refresh=sessionStorage.getItem('ag-admin-refresh')||'';
let refreshing:Promise<void>|null=null;
export function setTokens(access:string,refreshToken='') {token=access.replace(/^Bearer\s+/i,'');refresh=refreshToken;sessionStorage.setItem('ag-admin-token',token);sessionStorage.setItem('ag-admin-refresh',refresh);}
export function clearTokens(){token='';refresh='';sessionStorage.removeItem('ag-admin-token');sessionStorage.removeItem('ag-admin-refresh');window.dispatchEvent(new Event('auth-expired'));}
export function hasToken(){return !!token;}
export class ApiError extends Error {constructor(message:string,public status:number,public details?:unknown){super(message);}}
async function renew() {
 const response=await fetch(API_BASE+'/Auth/RefreshToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(refresh)});
 const payload=await response.json();if(!response.ok)throw new Error('نشست منقضی شده است');const d=unwrap(payload);setTokens(d.token,d.refreshToken);
}
export async function request(path:string,method='GET',body?:unknown,query:Row={},signal?:AbortSignal,retry=true):Promise<any> {
 const url=new URL(API_BASE+path);Object.entries(query).forEach(([k,v])=>{if(v!==''&&v!==undefined&&v!==null){if(Array.isArray(v))v.forEach(a=>url.searchParams.append(k,String(a)));else url.searchParams.set(k,String(v));}});
 const headers:Record<string,string>={};if(token)headers.Authorization='Bearer '+token;
 const form=body instanceof FormData;if(body!==undefined&&!form)headers['Content-Type']='application/json';
 const response=await fetch(url,{method,headers,body:body===undefined?undefined:form?body as FormData:JSON.stringify(body),signal});
 if(response.status===401 && retry && refresh) {
  try {if(!refreshing)refreshing=renew().finally(()=>refreshing=null);await refreshing;return request(path,method,body,query,signal,false);}catch(e){clearTokens();throw new ApiError('نشست منقضی شده است. دوباره وارد شوید.',401);}
 }
 const raw=await response.text();let payload:any;try{payload=raw?JSON.parse(raw):null;}catch{payload={message:'پاسخ سرور قابل پردازش نیست'};}
 if(!response.ok){if(response.status===401)clearTokens();const d=normalize(payload);throw new ApiError(d?.message||d?.title||'خطا در ارتباط با سرور ('+response.status+')',response.status,d?.errors);}
 const data=unwrap(payload);if(data===false)throw new ApiError('سرور انجام عملیات را تأیید نکرد.',400);return data;
}
export function execute(endpoint:Endpoint,values:Row,signal?:AbortSignal) {
 const path=resolvePath(endpoint.path,values);const query=serializeFields(endpoint.query,values);let body:any;
 if(endpoint.body.length){const data:Row=serializeFields(endpoint.body,values,schemas);
  if(endpoint.encoding==='form'){body=new FormData();Object.entries(data).forEach(([k,v])=>appendForm(body,k,v));}
  else body=endpoint.bodyType==='string'?data[endpoint.body[0].name]:data;
 }
 return request(path,endpoint.method,body,query,signal);
}

export async function downloadPrivate(path:string,retry=true):Promise<Blob> {
 const response=await fetch(API_BASE+path,{headers:{Authorization:'Bearer '+token}});
 if(response.status===401&&retry&&refresh){if(!refreshing)refreshing=renew().finally(()=>refreshing=null);await refreshing;return downloadPrivate(path,false);}
 if(!response.ok){let message='دریافت مدرک انجام نشد';try{message=(await response.json()).message||message;}catch{}throw new ApiError(message,response.status);}
 return response.blob();
}
