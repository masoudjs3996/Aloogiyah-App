import { saleUnitGuide } from "../../shared/utils/sale-units";
import MoneyInput from "./MoneyInput";
import { monetaryField } from "../../shared/utils/money-input";
import QualityReportFields from "./QualityReportFields";
import { lazy, Suspense } from 'react';
const ArticleEditor = lazy(() => import('./ArticleEditor'));
import StringArrayField from './StringArrayField';
import StructuredField,{structuredModel} from './StructuredField';
import type {Field,Row,Resource} from '../../shared/types';import {label,enumLabels} from '../../shared/utils/labels';import {useLookups} from '../../hooks/useLookups';import ReferencePicker,{isReference} from './ReferencePicker';
export default function FormField({field:f,value,onChange,resource,filter=false,record,discountType}:{field:Field;value:any;onChange:(v:any)=>void;resource?:Resource;filter?:boolean;record?:Row;discountType?:unknown}){
 const lookup=useLookups();const required=(f.required||(f.name==='statusCode'&&!!resource?.statusEntity&&!record))&&!filter;const common={id:f.name,required,maxLength:f.maxLength,value:value??'',onChange:(e:any)=>onChange(e.target.value)};
 let input:React.ReactNode;
 if(f.name==='fundingSource') input=<select {...common}><option value="">منبع هزینه را مشخص کنید</option><option value="Platform">الو گیاه؛ بدون کسر از سهم کشاورز</option><option value="Seller">کشاورز مالک مزرعه؛ کسر از سهم فروش</option></select>;
 else if(f.name==='content'&&resource?.id==='Article'&&!filter) input=<Suspense fallback={<p>در حال آماده‌سازی ویرایشگر…</p>}><ArticleEditor value={value??''} onChange={onChange} required={required} recordCode={record?.code}/></Suspense>;
 else if(f.name==='report'&&resource?.id==='QualityAssessment') input=<QualityReportFields value={value} onChange={onChange}/>;
 else if(f.name==='statusCode'&&resource?.statusEntity){const options=lookup.data?.statuses.filter(s=>s.entityStatus===resource.statusEntity)||[];input=<select {...common}><option value="">انتخاب وضعیت</option>{options.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select>;}
 else if(f.name==='fileTypeCode'){input=<select {...common}><option value="">انتخاب نوع فایل</option>{lookup.data?.fileTypes?.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select>;}
 else if(f.name==='roleCode'){input=<select {...common}><option value="">انتخاب نقش</option>{lookup.data?.roles.map(s=><option key={s.code} value={s.code}>{enumLabels[s.name]||s.name}</option>)}</select>;}
 else if(f.name==='roleCodes'){const selected:string[]=Array.isArray(value)?value:[];input=<div><label>نقش اصلی<select value={selected[0]||''} onChange={e=>onChange([e.target.value,...selected.filter(c=>c!==e.target.value)])}><option value="" disabled>اولین نقش انتخاب‌شده، نقش اصلی است</option>{lookup.data?.roles.filter(r=>selected.includes(r.code)).map(r=><option key={r.code} value={r.code}>{enumLabels[r.name]||r.name}</option>)}</select></label><div className="checkboxes">{lookup.data?.roles.map(r=><label key={r.code}><input type="checkbox" checked={selected.includes(r.code)} onChange={e=>onChange(e.target.checked?(lookup.data?.roles.find(x=>x.code===selected[0])?.name==="User"?[r.code,...selected]:[...selected,r.code]):selected.filter(c=>c!==r.code))}/>{enumLabels[r.name]||r.name}</label>)}</div></div>;}
 else if(isReference(f.name)) input=<ReferencePicker name={f.name} value={value} onChange={onChange} required={required}/>;
 else if(f.type==='enum'){let options=f.options||[];if(f.name==='action'&&record?.allowedActions) options=options.filter(o=>record.allowedActions.includes(o));input=<select {...common}><option value="">انتخاب کنید</option>{options.map(o=><option key={o} value={o}>{enumLabels[o]||o}</option>)}</select>;}
 else if(f.type==='boolean')input=<select {...common} value={value===undefined||value===''?(filter?'':String(f.default??false)):String(value)} onChange={e=>onChange(e.target.value===''?'':e.target.value==='true')}><option value="">انتخاب کنید</option><option value="true">بله</option><option value="false">خیر</option></select>;
 else if(f.type==='file'||f.type==='files')input=<input id={f.name} type="file" required={required} multiple={f.type==='files'} onChange={e=>onChange(f.type==='files'?e.target.files:e.target.files?.[0])}/>;
 else if(f.csType==='List<string>')input=<StringArrayField name={f.name} value={value} onChange={onChange}/>;
 else if(f.type==='json'&&structuredModel(f))input=<StructuredField field={f} value={value} onChange={onChange} resource={resource}/>;
 else if(f.type==='textarea'||f.type==='json')input=<textarea {...common} rows={f.type==='json'?5:3} dir={f.type==='json'?'ltr':undefined} value={typeof value==='object'?JSON.stringify(value,null,2):value??''} placeholder={f.type==='json'?'آرایه یا ساختار JSON مطابق مدل API':undefined}/>;
 else if(f.type==='date') {const iso=value?new Date(value):null;const date=iso&&!Number.isNaN(iso.getTime())?new Date(iso.getTime()-iso.getTimezoneOffset()*60000).toISOString().slice(0,16):'';input=<input {...common} type="datetime-local" value={date} dir="ltr"/>;}
 else if(f.type==='number'&&monetaryField(f.name,discountType??record?.discountType)) input=<MoneyInput id={f.name} required={required} value={value??''} onChange={onChange} min={f.min} max={f.max}/>;
 else input=<input {...common} type={f.type==='number'?'number':f.name.toLowerCase().includes('password')?'password':'text'} min={f.min} max={f.max} step={f.csType?.includes('int')?'1':'any'} dir={f.name.endsWith('Code')||f.type==='number'?'ltr':undefined}/>;
 return <div className={`field ${f.type==='textarea'||f.type==='json'?'wide':''}`}><label htmlFor={f.name}>{label(f.name)}{required&&<span aria-hidden="true" className="required"> *</span>}</label>{input}{f.name==='saleUnit'&&<p className="field-help">{saleUnitGuide}</p>}</div>;
}

