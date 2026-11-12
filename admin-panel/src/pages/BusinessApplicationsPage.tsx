import {Info} from 'lucide-react';
import PageIntro from '../design-system/molecules/PageIntro';
import PersianDeliveryTime from '../design-system/molecules/PersianDeliveryTime';
import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {request,downloadPrivate} from '../shared/api/client';
import {businessDocumentLabel, type BusinessApplication} from '../shared/types/business';
import {businessStatuses,businessTypes,businessActions} from '../shared/types/business';
import {persianToISO} from '../shared/utils/persian-date';
import Button from '../design-system/atoms/Button';
const date=(value?:string)=>value?new Date(value).toLocaleString('fa-IR-u-ca-persian'):'—';
const open=(status:string)=>['Pending','NeedsInfo','VisitRequired'].includes(status);
export default function BusinessApplicationsPage(){
 const client=useQueryClient();const [status,setStatus]=useState('Pending'),[type,setType]=useState(''),[search,setSearch]=useState(''),[term,setTerm]=useState(''),[page,setPage]=useState(1),[selected,setSelected]=useState('');
 const [action,setAction]=useState(''),[note,setNote]=useState(''),[visit,setVisit]=useState(''),[downloading,setDownloading]=useState('');
 const q=useQuery<{items:BusinessApplication[];totalCount:number}>({queryKey:['business-admin',status,type,term,page],queryFn:()=>request('/BusinessApplication/Admin','GET',undefined,{status,businessType:type,search:term,pageNumber:page,pageSize:20})});
 const detail=useQuery<BusinessApplication>({queryKey:['business-detail',selected],queryFn:()=>request('/BusinessApplication/'+encodeURIComponent(selected)),enabled:!!selected});
 const item=detail.data;
 const hasRequiredDocuments = item && ["Identity", "Premises", "License"].every(kind => item.documents.some(doc => doc.kind === kind));
 const review=useMutation({mutationFn:()=>{
   if(!item||!action)throw new Error('عملیات بررسی را انتخاب کنید');
   return request('/BusinessApplication/'+encodeURIComponent(item.code)+'/Review','POST',{version:item.version,action,note:note.trim()||undefined,visitAt:action==='ScheduleVisit'?persianToISO(visit):undefined});
 },onSuccess:(data)=>{client.setQueryData(['business-detail',selected],data);void q.refetch();setAction('');setNote('');setVisit('');toast.success('نتیجه بررسی ثبت شد');},onError:(e:Error)=>{toast.error(e.message);void detail.refetch();}});
 return <>
  <PageIntro eyebrow="رسیدگی به متقاضیان" title="درخواست‌های همکاری" description="درخواست را انتخاب کنید، مدارک و نشانی را ببینید و نتیجه بررسی را ثبت کنید." actions={<Button variant="secondary" onClick={()=>{void q.refetch();if(selected)void detail.refetch();}}>به‌روزرسانی</Button>} />
  <div className="guide-box"><Info size={20}/><div><strong>ابتدا مدارک، سپس نتیجه بررسی</strong><p>تأیید درخواست، دسترسی متقاضی را فعال می‌کند. اگر مدرک کافی نیست، «درخواست تکمیل اطلاعات» یا «تعیین زمان بازدید» را انتخاب کنید.</p></div></div>
  <form className="panel business-filters" onSubmit={e=>{e.preventDefault();setPage(1);setTerm(search);}}>
   <label>وضعیت<select aria-label="وضعیت درخواست" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">همه وضعیت‌ها</option>{Object.entries(businessStatuses).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label>نوع فعالیت<select aria-label="نوع فعالیت" value={type} onChange={e=>{setType(e.target.value);setPage(1);}}><option value="">همه فعالیت‌ها</option>{Object.entries(businessTypes).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   <label>جست‌وجو<input aria-label="جست‌وجوی درخواست همکاری" value={search} onChange={e=>setSearch(e.target.value)} placeholder="نام محل، متقاضی، تلفن یا کد"/></label><Button type="submit">جست‌وجو</Button>
  </form>
  {q.error&&<div role="alert" className="note">{q.error.message}<Button onClick={()=>q.refetch()}>تلاش دوباره</Button></div>}
  <div className="business-layout">
   <section className="panel business-list" aria-label="درخواست‌ها">
    {q.isLoading&&<p>در حال دریافت درخواست‌ها…</p>}{!q.isLoading&&!q.error&&!q.data?.items.length&&<p>درخواستی در این فیلتر وجود ندارد.</p>}
    {q.data?.items.map(row=><button key={row.code} className={'business-list-item '+(selected===row.code?'selected':'')} onClick={()=>{setSelected(row.code);setAction('');setNote('');setVisit('');}}><b>{row.businessName}</b><span>{row.applicantName} · {businessTypes[row.businessType]}</span><small>{businessStatuses[row.status]} · {date(row.createdAt)}</small></button>)}
    <div className="toolbar"><Button variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>قبلی</Button><span>{page.toLocaleString('fa-IR')}</span><Button variant="secondary" disabled={page*20>=(q.data?.totalCount||0)} onClick={()=>setPage(p=>p+1)}>بعدی</Button></div>
   </section>
   <section className="panel business-detail" aria-label="بررسی درخواست">
    {!selected&&<p>برای مشاهده مدارک و بررسی، یک درخواست را انتخاب کنید.</p>}
    {detail.isFetching&&!item&&<p>در حال دریافت…</p>}{detail.error&&<p role="alert">{detail.error.message}</p>}
    {item&&<>
     <div className="business-heading"><div><h2>{item.businessName}</h2><p>{businessTypes[item.businessType]} · کد {item.code}</p></div><span className={'badge '+(item.status==='Approved'?'green':'amber')}>{businessStatuses[item.status]}</span></div>
     <dl className="business-info"><div><dt>متقاضی</dt><dd>{item.applicantName}</dd></div><div><dt>شماره تماس</dt><dd dir="ltr">{item.phoneNumber}</dd></div><div><dt>شماره جواز</dt><dd>{item.licenseNumber||'ثبت نشده (اختیاری)'}</dd></div><div><dt>دسترسی پس از تأیید</dt><dd>{item.businessType==='Farmer'?'کشاورز؛ ثبت مزرعه و محصول':'خریدار همکار؛ قیمت همکاری و بدون ثبت محصول'}</dd></div></dl>
     <p className="business-description">{item.description}</p>
     <div className="note">{item.termsAcceptance ? <>قوانین پذیرفته‌شده: نسخه {item.termsAcceptance.termsVersion} · {date(item.termsAcceptance.acceptedAt)}<details><summary>شناسه نسخه قوانین</summary><small style={{display:'block',overflowWrap:'anywhere'}}>{item.termsAcceptance.termsHash}</small></details></> : 'پذیرش قوانین برای این درخواست قدیمی ثبت نشده است؛ پیش از تأیید، درخواست تکمیل اطلاعات ارسال کنید.'}</div>
     <div className="business-address"><b>نشانی محل فعالیت</b><p>{item.address.province}، {item.address.county}، {item.address.city||item.address.village}، {item.address.street}</p><p>کد پستی: {item.address.postalCode}</p>{item.address.latitude!=null&&item.address.longitude!=null&&<a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${item.address.latitude},${item.address.longitude}`}>مشاهده موقعیت روی نقشه ↗</a>}</div>
     <h2>مدارک ارسالی</h2>{!item.documents.length&&<p>مدرکی بارگذاری نشده است.</p>}
     <div className="toolbar">{item.documents.map(doc=><Button key={doc.code} variant="secondary" disabled={!!downloading} onClick={async()=>{setDownloading(doc.code);try{const blob=await downloadPrivate(`/BusinessApplication/${encodeURIComponent(item.code)}/Documents/${encodeURIComponent(doc.code)}`),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=doc.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){toast.error((e as Error).message);}finally{setDownloading('');}}}>📎 {businessDocumentLabel(doc.kind, item.businessType)} · {doc.name} · {Math.ceil(doc.size/1024).toLocaleString('fa-IR')} کیلوبایت</Button>)}</div>
     {item.reviewNote&&<div className="note">آخرین توضیح: {item.reviewNote}</div>}
     {item.visitAt&&<div className="note"><b>بازدید: {date(item.visitAt)}</b><p>{item.visitedAt?'انجام‌شده در '+date(item.visitedAt):'در انتظار ثبت نتیجه بازدید'}</p>{item.visitNote&&<p>{item.visitNote}</p>}</div>}
     {open(item.status)&&<form className="business-review" onSubmit={e=>{e.preventDefault();if(!review.isPending)review.mutate();}}>
      <h2>ثبت نتیجه بررسی</h2><p>نتیجه و توضیحات برای متقاضی نمایش داده می‌شود. نقش‌های مدیریتی از این مسیر اعطا نمی‌شوند.</p>
      {!hasRequiredDocuments && <p>مدارک الزامی کامل نیست. از گزینهٔ درخواست تکمیل مدارک استفاده کنید.</p>}
      <label>عملیات<select aria-label="عملیات بررسی" required value={action} disabled={review.isPending} onChange={e=>setAction(e.target.value)}><option value="">انتخاب کنید</option><option value="Approve" disabled={!item.termsAcceptance||!hasRequiredDocuments||item.status==='NeedsInfo'||item.status==='VisitRequired'&&!item.visitedAt}>تأیید و فعال‌سازی نقش {item.businessType==='Farmer'?'کشاورز':'خریدار همکار'}</option><option value="RequestInfo">درخواست تکمیل اطلاعات / مدارک</option><option value="ScheduleVisit">نیاز به بازدید و تعیین زمان</option>{item.status==='VisitRequired'&&<option value="RecordVisit">ثبت گزارش بازدید انجام‌شده</option>}<option value="Reject">رد درخواست</option></select></label>
      {action==='ScheduleVisit'&&<PersianDeliveryTime maxDaysAhead={null} label="تاریخ و ساعت بازدید" hint="زمان بازدید را با متقاضی هماهنگ کنید." value={visit} onChange={setVisit}/>}
      <label>{action==='RecordVisit'?'گزارش بازدید':'توضیح نتیجه / مدارک موردنیاز'}<textarea aria-label="توضیح بررسی" rows={4} required={['Reject','RequestInfo','RecordVisit'].includes(action)} maxLength={2000} disabled={review.isPending} value={note} onChange={e=>setNote(e.target.value)}/></label>
      <Button type="submit" variant={action==='Reject'?'danger':'primary'} disabled={!action||review.isPending||action==='ScheduleVisit'&&!visit}>{review.isPending?'در حال ثبت…':'ثبت نتیجه بررسی'}</Button>
     </form>}
     <details className="disclosure"><summary>تاریخچه رسیدگی</summary><ol className="business-history">{item.history.map((h,i)=><li key={i}><b>{businessActions[h.action]||h.action}</b><small>{h.author} · {date(h.at)}</small><p>{h.note}</p></li>)}</ol></details>
    </>}
   </section>
  </div>
 </>;
}
