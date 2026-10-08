import {useEffect,useState} from 'react';import {useMutation,useQueryClient} from '@tanstack/react-query';import toast from 'react-hot-toast';import type {Endpoint,Resource,Row} from '../../shared/types';import {execute,request} from '../../shared/api/client';import {actionTitle} from '../../features/resources';import FormField from '../molecules/FormField';import Modal from '../molecules/Modal';import ErrorState from '../molecules/ErrorState';import Button from '../atoms/Button';
export default function ActionForm({endpoint:e,resource,record,onClose}:{endpoint:Endpoint;resource:Resource;record?:Row;onClose:()=>void}){
 const fields=[...e.params,...e.query,...e.body].filter((f,i,a)=>a.findIndex(x=>x.name===f.name)===i).filter(f=>!(resource.id==='ServiceRequest'&&e.action==='Update'&&['price','discountAmount','discountCode','addressCode'].includes(f.name)));
 const [values,setValues]=useState<Row>(()=>Object.fromEntries(fields.map(f=>[f.name,record?.[f.name]??(record&&(['userCode','fileCode','notificationCode'].includes(f.name)||f.name===({Category:'categoryCode',Article:'articleCode',Product:'productCode'} as Row)[resource.id])?record.code:undefined)??(!record&&f.name!=='statusCode'?f.default:undefined)??(f.type==='boolean'&&!record?false:'')])));
 if(record?.address?.code && values.address && !values.address.addressCode) values.address={...values.address,addressCode:record.address.code};
 const [dirty,setDirty]=useState<Set<string>>(new Set());const [confirmed,setConfirmed]=useState(false);const client=useQueryClient();const isUpdate=e.method==='PUT'&&e.body.some(f=>f.name==='code');
 const [rolesLoading,setRolesLoading]=useState(e.action.includes('/Roles'));const [rolesError,setRolesError]=useState<Error|null>(null);
 useEffect(()=>{if(e.action.includes('/Roles'))request('/Admin/Users/'+encodeURIComponent(record?.code)+'/Roles').then(d=>setValues(v=>({...v,roleCodes:d.roleCodes}))).catch(err=>setRolesError(err)).finally(()=>setRolesLoading(false));},[]);
 const mutation=useMutation({mutationFn:async()=>{
  const bodyValues=isUpdate&&resource.id==='ServiceRequest'?Object.fromEntries(Object.entries(values).filter(([k])=>k==='code'||dirty.has(k)||fields.find(f=>f.name===k)?.required||e.params.some(f=>f.name===k)||e.query.some(f=>f.name===k))):values;
  if(e.action.includes('/Roles'))bodyValues.roleCodes=values.roleCodes||[];
  if(record && fields.some(f=>f.name==='code'))bodyValues.code=record.code;
  return execute(e,bodyValues);
 },onSuccess:()=>{toast.success('عملیات با موفقیت انجام شد');client.invalidateQueries();onClose();},onError:err=>toast.error(err.message)});
 const change=(k:string,v:any)=>{setValues(x=>({...x,[k]:v}));setDirty(x=>new Set(x).add(k));setConfirmed(false);};
 return <Modal title={actionTitle(e)+' — '+resource.title} onClose={onClose} busy={mutation.isPending}><form onSubmit={event=>{event.preventDefault();mutation.mutate();}}>
 {record&&<div className="record-tag">کد رکورد: <b dir="ltr">{record.code}</b></div>}
 {resource.note&&<p className="note">{resource.note}</p>}
 {rolesLoading?<p>در حال دریافت نقش‌های فعلی…</p>:rolesError?<ErrorState error={rolesError}/>:<div className="form-grid">{fields.map(f=><FormField key={f.name} field={{...f,required:f.required||(f.name==='reason'&&['Reject','ConfirmDelivery'].includes(values.action))||(f.name==='shippingMethod'&&values.action==='Ship')}} value={values[f.name]} resource={resource} record={record} onChange={v=>change(f.name,v)}/>)}</div>}
 {e.method==='DELETE'&&<p className="note danger-note">حذف این رکورد ممکن است قابل بازگشت نباشد. کد و اطلاعات رکورد را بررسی کنید.</p>}
 {e.action.includes('Refund')&&<p className="note">این عملیات فقط بازپرداخت انجام‌شده را ثبت می‌کند؛ قبل از تأیید، پرداخت واقعی و شماره پیگیری را بررسی کنید.</p>}
 <label className="confirm"><input type="checkbox" checked={confirmed} onChange={x=>setConfirmed(x.target.checked)}/>اطلاعات را بررسی کرده‌ام و انجام این عملیات را تأیید می‌کنم.</label>
 {mutation.error&&<ErrorState error={mutation.error}/>}<div className="modal-actions"><Button type="submit" variant={e.method==='DELETE'?'danger':'primary'} disabled={!confirmed||mutation.isPending||rolesLoading||!!rolesError}>{mutation.isPending?'در حال ثبت…':'ثبت عملیات'}</Button><Button type="button" variant="secondary" disabled={mutation.isPending} onClick={onClose}>انصراف</Button></div>
 </form></Modal>;
}
