import StringArrayField from './StringArrayField';
import StructuredField,{structuredModel} from './StructuredField';
import type {Field,Row,Resource} from '../../shared/types';import {label,enumLabels} from '../../shared/utils/labels';import {useLookups} from '../../hooks/useLookups';import ReferencePicker,{isReference} from './ReferencePicker';
export default function FormField({field:f,value,onChange,resource,filter=false,record}:{field:Field;value:any;onChange:(v:any)=>void;resource?:Resource;filter?:boolean;record?:Row}){
 const lookup=useLookups();const required=(f.required||(f.name==='statusCode'&&!!resource?.statusEntity&&!record))&&!filter;const common={id:f.name,required,maxLength:f.maxLength,value:value??'',onChange:(e:any)=>onChange(e.target.value)};
 let input:React.ReactNode;
 if(f.name==='statusCode'&&resource?.statusEntity){const options=lookup.data?.statuses.filter(s=>s.entityStatus===resource.statusEntity)||[];input=<select {...common}><option value="">انتخاب وضعیت</option>{options.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select>;}
 else if(f.name==='fileTypeCode'){input=<select {...common}><option value="">انتخاب نوع فایل</option>{lookup.data?.fileTypes?.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select>;}
 else if(f.name==='roleCode'){input=<select {...common}><option value="">انتخاب نقش</option>{lookup.data?.roles.map(s=><option key={s.code} value={s.code}>{enumLabels[s.name]||s.name}</option>)}</select>;}
 else if(f.name==='roleCodes'){input=<div className="checkboxes">{lookup.data?.roles.map(r=><label key={r.code}><input type="checkbox" checked={(Array.isArray(value)?value:[]).includes(r.code)} onChange={e=>{const current=Array.isArray(value)?value:[];onChange(e.target.checked?[...current,r.code]:current.filter((c:string)=>c!==r.code));}}/>{enumLabels[r.name]||r.name}</label>)}</div>;}
 else if(isReference(f.name)) input=<ReferencePicker name={f.name} value={value} onChange={onChange} required={required}/>;
 else if(f.type==='enum'){let options=f.options||[];if(f.name==='action'&&record?.allowedActions) options=options.filter(o=>record.allowedActions.includes(o));input=<select {...common}><option value="">انتخاب کنید</option>{options.map(o=><option key={o} value={o}>{enumLabels[o]||o}</option>)}</select>;}
 else if(f.type==='boolean')input=<select {...common} value={value===undefined||value===''?(filter?'':String(f.default??false)):String(value)} onChange={e=>onChange(e.target.value===''?'':e.target.value==='true')}><option value="">انتخاب کنید</option><option value="true">بله</option><option value="false">خیر</option></select>;
 else if(f.type==='file'||f.type==='files')input=<input id={f.name} type="file" required={required} multiple={f.type==='files'} onChange={e=>onChange(f.type==='files'?e.target.files:e.target.files?.[0])}/>;
 else if(f.csType==='List<string>')input=<StringArrayField name={f.name} value={value} onChange={onChange}/>;
 else if(f.type==='json'&&structuredModel(f))input=<StructuredField field={f} value={value} onChange={onChange} resource={resource}/>;
 else if(f.type==='textarea'||f.type==='json')input=<textarea {...common} rows={f.type==='json'?5:3} dir={f.type==='json'?'ltr':undefined} value={typeof value==='object'?JSON.stringify(value,null,2):value??''} placeholder={f.type==='json'?'آرایه یا ساختار JSON مطابق مدل API':undefined}/>;
 else if(f.type==='date') {const iso=value?new Date(value):null;const date=iso&&!Number.isNaN(iso.getTime())?new Date(iso.getTime()-iso.getTimezoneOffset()*60000).toISOString().slice(0,16):'';input=<input {...common} type="datetime-local" value={date} dir="ltr"/>;}
 else input=<input {...common} type={f.type==='number'?'number':f.name.toLowerCase().includes('password')?'password':'text'} min={f.min} max={f.max} step={f.csType?.includes('int')?'1':'any'} dir={f.name.endsWith('Code')||f.type==='number'?'ltr':undefined}/>;
 return <div className={`field ${f.type==='textarea'||f.type==='json'?'wide':''}`}><label htmlFor={f.name}>{label(f.name)}{required&&<span aria-hidden="true" className="required"> *</span>}</label>{input}</div>;
}
