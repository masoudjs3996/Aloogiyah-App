"use client";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import { BuildingStorefrontIcon, CheckCircleIcon, CloudArrowUpIcon, DocumentCheckIcon, LockClosedIcon, SunIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { businessApi } from "@/lib/actions/business";
import { platformApi, errorMessage } from "@/lib/actions/platform";
import { businessStatuses, businessTypes, businessActions, businessDocumentKinds, businessDocumentLabel, type BusinessDocumentKind, type BusinessApplication, type BusinessType } from "@/shared/types/business";
import { dateLabel } from "@/shared/utils/platform";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { TextField, TextAreaField, SelectField } from "@/design-system/molecules/platform/FormField";
import { AddressForm } from "./AddressesWorkspace";
import { TermsBody } from "./MarketplaceTermsDocument";
import styles from "./BusinessWorkspace.module.css";

const roleOptions = [
  { value: "Farmer", title: "کشاورز", description: "ثبت مزرعه و آگهی فروش", icon: SunIcon, active: "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600" },
  { value: "Shop", title: "مغازه‌دار", description: "خرید مستقیم از تولیدکننده", icon: BuildingStorefrontIcon, active: "border-[#e9d6a8] bg-gradient-to-l from-[#fbf4e3] to-white text-[#193f32] ring-1 ring-[#f1cb75]" },
] as const;

function BusinessDocumentUpload({ title, optional, file, existingName, disabled, onChange }: {
  title: string;
  optional: boolean;
  file?: File;
  existingName?: string;
  disabled: boolean;
  onChange: (file?: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const name = file?.name || existingName;
  const Icon = name ? DocumentCheckIcon : CloudArrowUpIcon;
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <label className="block cursor-pointer space-y-2">
        <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
          {title}
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${optional ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800"}`}>
            {optional ? "اختیاری" : "الزامی"}
          </span>
        </span>
        <input ref={input} className="peer sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx"
          disabled={disabled} required={!existingName && !optional}
          onChange={event => {
            const selected = event.target.files?.[0];
            if (selected && (selected.size <= 0 || selected.size > 10 * 1024 * 1024 || !/\.(jpe?g|png|webp|pdf|docx|xlsx)$/i.test(selected.name))) {
              toast.error("فرمت فایل معتبر نیست یا حجم آن بیش از ۱۰ مگابایت است.");
              event.target.value = "";
              onChange();
              return;
            }
            onChange(selected);
          }} />
        <span className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-700 peer-disabled:opacity-60 ${name ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-dashed border-slate-300 bg-slate-50 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50"}`}>
          <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="min-w-0 text-xs leading-5">
            <span className="block font-bold">{name ? "جایگزینی فایل" : "انتخاب فایل"}</span>
            {name && <span className="block break-all" dir="auto">{name}</span>}
          </span>
        </span>
      </label>
      {file && <button type="button" disabled={disabled} onClick={() => {
        if (input.current) input.current.value = "";
        onChange();
      }} className="mt-1 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-rose-700">
        <XMarkIcon className="h-4 w-4" aria-hidden="true" /> حذف فایل انتخابی
      </button>}
    </div>
  );
}

export default function BusinessWorkspace({ initialType = "Farmer" }: { initialType?: BusinessType }) {
 const client=useQueryClient();
 const terms=useQuery({queryKey:["marketplace-terms","current"],queryFn:businessApi.terms});
 const [acceptedHash,setAcceptedHash]=useState(""),[showTerms,setShowTerms]=useState(false);
 const q=useQuery({queryKey:["business-applications"],queryFn:businessApi.mine,refetchInterval:30000});
 const addresses=useQuery({queryKey:["platform","addresses","business"],queryFn:()=>platformApi.addresses({PageSize:100})});
 const [type,setType]=useState<BusinessType>(initialType),[name,setName]=useState(""),[description,setDescription]=useState(""),[license,setLicense]=useState(""),[address,setAddress]=useState(""),[files,setFiles]=useState<Partial<Record<BusinessDocumentKind, File>>>({});
 const [editing,setEditing]=useState<BusinessApplication>(),[removed,setRemoved]=useState<string[]>([]),[newAddress,setNewAddress]=useState(false),[downloading,setDownloading]=useState("");
 const [formVersion, setFormVersion] = useState(0);
 const clear=()=>{setFormVersion(current=>current+1);setAcceptedHash("");setEditing(undefined);setName("");setDescription("");setLicense("");setAddress("");setFiles({});setRemoved([]);};
 const mutation=useMutation({mutationFn:(data:FormData)=>businessApi.submit(data,editing?.code),onSuccess:()=>{clear();void q.refetch();toast.success("درخواست برای بررسی ارسال شد");},onError:(e)=>toast.error(errorMessage(e))});
 const edit=(item:BusinessApplication)=>{setAcceptedHash("");setEditing(item);setType(item.businessType);setName(item.businessName);setDescription(item.description);setLicense(item.licenseNumber||"");setAddress(item.address.code);setFiles({});setRemoved([]);document.getElementById("business-form")?.scrollIntoView({behavior:"smooth"});};
 const active=q.data?.items.find(x=>x.businessType===type && ["Pending","NeedsInfo","VisitRequired"].includes(x.status));
 return <div className="mx-auto max-w-4xl space-y-6">
  <PageHeading title="درخواست همکاری" description="ثبت‌نام کشاورز یا مغازه‌دار؛ مدارک شما فقط برای خودتان و مدیریت قابل مشاهده است." />
  <QueryState loading={q.isLoading} error={q.error} retry={()=>q.refetch()} />
  {q.data?.items.map(item=><section key={item.code} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{item.businessName}</h2><p className="mt-1 text-xs text-slate-500">{businessTypes[item.businessType]} · {dateLabel(item.createdAt)}</p></div><span className={`rounded-full px-3 py-1.5 text-xs ${item.status==="Approved"?"bg-emerald-50 text-emerald-700":item.status==="Rejected"?"bg-rose-50 text-rose-700":"bg-amber-50 text-amber-800"}`}>{businessStatuses[item.status]}</span></div>
   <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p>
   <p className="rounded-xl bg-slate-50 p-3 text-sm leading-7">نشانی محل فعالیت: {item.address.province}، {item.address.county}، {item.address.city||item.address.village}، {item.address.street}<br/>کد پستی: {item.address.postalCode}</p>
   {item.licenseNumber&&<p className="text-sm">شماره جواز: {item.licenseNumber}</p>}
   {item.termsAcceptance&&<p className="text-xs leading-7 text-slate-600">پذیرش قوانین: نسخه <Link href={`/terms?version=${encodeURIComponent(item.termsAcceptance.termsVersion)}`} target="_blank" rel="noopener noreferrer" className="underline">{item.termsAcceptance.termsVersion}</Link> · {dateLabel(item.termsAcceptance.acceptedAt)}</p>}
   {item.reviewNote&&<p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-7">پاسخ مدیریت: {item.reviewNote}</p>}
   {item.visitAt&&<p className="text-sm text-slate-600">زمان بازدید: {dateLabel(item.visitAt)}{item.visitedAt?" · بازدید انجام شد":""}</p>}
   {item.visitNote&&<p className="text-sm leading-7">نتیجه بازدید: {item.visitNote}</p>}
   <div className="flex flex-wrap gap-2">{item.documents.map(doc=><ActionButton key={doc.code} variant="secondary" busy={downloading===doc.code} onClick={async()=>{setDownloading(doc.code);try{const blob=await businessApi.download(item.code,doc.code);const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=doc.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){toast.error(errorMessage(e));}finally{setDownloading("");}}}>📎 {businessDocumentLabel(doc.kind, item.businessType)} · {doc.name}</ActionButton>)}</div>
   {item.status==="NeedsInfo"&&<ActionButton onClick={()=>edit(item)}>تکمیل اطلاعات و ارسال مجدد</ActionButton>}
   {item.status==="Approved"&&<div className="rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">{item.businessType==="Farmer"?<Link href="/dashboard/farm/myFarms">دسترسی کشاورز فعال شد؛ ورود به مزرعه‌های من ←</Link>:"حساب خریدار همکار تأیید شد؛ قیمت همکاری در خریدهای جدید اعمال می‌شود."}</div>}
   <details><summary className="cursor-pointer text-xs text-slate-500">تاریخچه درخواست</summary><ol className="mt-3 space-y-3 border-r-2 border-emerald-100 pr-3">{item.history.map((h,i)=><li key={i} className="text-xs leading-6 text-slate-600"><strong>{businessActions[h.action]||h.action}</strong> · {dateLabel(h.at)}<p className="whitespace-pre-wrap">{h.note}</p></li>)}</ol></details>
  </section>)}
  <form id="business-form" className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 sm:p-6" onSubmit={e=>{e.preventDefault();if(mutation.isPending)return;if(!terms.data||acceptedHash!==terms.data.hash){toast.error("قوانین همکاری را مطالعه و تأیید کنید");return;}const data=new FormData();data.append("acceptedTerms","true");data.append("termsVersion",terms.data.document.version);data.append("termsHash",terms.data.hash);data.append("businessType",type);data.append("businessName",name.trim());data.append("description",description.trim());data.append("addressCode",address);data.append("licenseNumber",license.trim());if(editing)data.append("version",editing.version);removed.forEach(c=>data.append("removeDocumentCodes",c));for(const kind of businessDocumentKinds){const file=files[kind];if(file)data.append(kind+"Document",file);}mutation.mutate(data);}}>
   <fieldset className="space-y-3" disabled={!!editing || mutation.isPending}>
    <legend className="mb-2 text-lg font-bold text-slate-900">{editing ? "تکمیل درخواست همکاری" : "نوع همکاری را انتخاب کنید"}</legend>
    <div className="grid grid-cols-2 gap-3">
      {roleOptions.map(({ value, title, description, icon: Icon, active }) => (
        <label key={value} className="relative min-w-0 cursor-pointer">
          <input type="radio" name="business-role" value={value} checked={type === value} className="peer sr-only"
            onChange={() => { setAcceptedHash(""); setFiles({}); setType(value); }} />
          <span className={`flex h-full min-h-28 flex-col gap-2 rounded-2xl border p-3 motion-safe:transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-700 sm:p-4 ${type === value ? active : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>
            <span className="flex items-center justify-between gap-2"><Icon className="h-6 w-6" aria-hidden="true" />
              {type === value && <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />}</span>
            <span className="font-bold">{title}</span>
            <span className="text-xs leading-5">{description}</span>
          </span>
        </label>
      ))}
    </div>
    {editing && <p className="text-xs text-slate-500">نوع همکاری در درخواست ثبت‌شده ثابت است.</p>}
   </fieldset>
   <div key={type} className={`${styles.roleDetails} space-y-5`}>
   {active&&!editing?<p className="rounded-xl bg-amber-50 p-4 text-sm leading-7">برای این نوع فعالیت درخواست باز دارید؛ وضعیت آن را در بالا پیگیری کنید.{active.status==="NeedsInfo"&&<button type="button" className="mr-2 font-bold text-emerald-700" onClick={()=>edit(active)}>تکمیل درخواست</button>}</p>:<>
    <div className={`rounded-2xl border p-4 ${type === "Farmer" ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-[#e9d6a8] bg-[#fbf4e3] text-[#193f32]"}`}>
      <h3 className="text-sm font-bold">{type === "Farmer" ? "اطلاعات مزرعه و تولید" : "اطلاعات مغازه و خرید"}</h3>
      <p className="mt-1 text-xs leading-6">نشانی محل فعالیت و مدارک مرتبط با این نقش را وارد کنید.</p>
    </div>
    <TextField label={type==="Farmer"?"نام مزرعه یا محل تولید":"نام مغازه / فروشگاه"} value={name} onChange={e=>setName(e.target.value)} required maxLength={150}/>
    <TextAreaField label="توضیحات فعالیت" hint={type==="Farmer"?"نوع تولید و سابقهٔ فعالیتتان را بنویسید.":"نوع فروشگاه، کالاهای موردنیاز و میزان تقریبی خرید را بنویسید."} value={description} onChange={e=>setDescription(e.target.value)} required maxLength={3000}/>
    <QueryState loading={addresses.isLoading} error={addresses.error} retry={()=>addresses.refetch()}/>
    <SelectField label="نشانی محل فعالیت" value={address} onChange={e=>setAddress(e.target.value)} required><option value="">انتخاب نشانی مزرعه یا مغازه</option>{addresses.data?.items.map(a=><option key={a.code} value={a.code}>{a.provinceName}، {a.countyName}، {a.street}</option>)}</SelectField>
    <ActionButton type="button" variant="secondary" onClick={()=>setNewAddress(true)}>ثبت نشانی جدید محل فعالیت</ActionButton>
    <TextField label="شماره جواز یا مجوز (اختیاری)" value={license} onChange={e=>setLicense(e.target.value)} maxLength={100}/>
    {!!editing?.documents.length&&<fieldset className="space-y-3 rounded-xl bg-slate-50 p-4"><legend className="text-sm font-bold">مدارک قبلی</legend>{editing.documents.map(d=><label key={d.code} className="flex gap-2 text-sm"><input type="checkbox" checked={removed.includes(d.code)} onChange={e=>setRemoved(old=>e.target.checked?[...old,d.code]:old.filter(c=>c!==d.code))}/>حذف مدرک: {businessDocumentLabel(d.kind, type)} · {d.name}</label>)}</fieldset>}
    <fieldset key={editing?.code || formVersion} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-2 text-sm font-bold">مدارک درخواست</legend>
      <p className="flex items-center gap-2 text-xs leading-6 text-slate-600"><LockClosedIcon className="h-4 w-4 shrink-0" aria-hidden="true" /> مدارک فقط برای شما و مدیران مجاز قابل مشاهده‌اند.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {businessDocumentKinds.map(kind => (
          <BusinessDocumentUpload key={kind} title={businessDocumentLabel(kind, type)} optional={kind === "Membership"} file={files[kind]}
            existingName={editing?.documents.find(doc => doc.kind === kind && !removed.includes(doc.code))?.name}
            disabled={mutation.isPending} onChange={file => setFiles(current => ({ ...current, [kind]: file }))} />
        ))}
      </div>
      <p className="text-xs leading-6 text-slate-500">تصویر، PDF، DOCX یا XLSX · حداکثر ۱۰ مگابایت برای هر فایل</p>
    </fieldset>
    <section className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><h3 className="font-bold">مطالعه و پذیرش قوانین همکاری</h3><QueryState loading={terms.isLoading} error={terms.error} retry={()=>terms.refetch()}/><ActionButton variant="secondary" onClick={()=>setShowTerms(true)} disabled={!terms.data}>مطالعه کامل قوانین</ActionButton>{terms.data&&<><p className="text-xs leading-6">نسخه {terms.data.document.version} · شامل شرایط عمومی، حریم خصوصی و تعهدات {type==="Farmer"?"کشاورز و فروشنده":"خریدار همکار"}</p><label className="flex items-start gap-3 text-sm leading-8"><input type="checkbox" className="mt-2 h-5 w-5 shrink-0" required checked={acceptedHash===terms.data.hash} disabled={mutation.isPending} onChange={e=>setAcceptedHash(e.target.checked?terms.data!.hash:"")}/>قوانین همکاری و حریم خصوصی را مطالعه کردم و با شرایط نقش انتخابی موافقم.</label></>}</section>
    <div className="flex gap-3"><ActionButton type="submit" busy={mutation.isPending} disabled={!address||addresses.isLoading||!terms.data||!!terms.error||acceptedHash!==terms.data.hash}>ارسال برای بررسی</ActionButton>{editing&&<ActionButton type="button" variant="secondary" disabled={mutation.isPending} onClick={clear}>انصراف از ویرایش</ActionButton>}</div>
   </>}
   </div>
  </form>
  <ActionButton variant="secondary" onClick={()=>{void q.refetch();void client.invalidateQueries({queryKey:["platform","profile"]});void client.invalidateQueries({queryKey:["GetUserRoul"]});void client.invalidateQueries({queryKey:["current-user-commerce-role"]});}}>به‌روزرسانی وضعیت و دسترسی‌ها</ActionButton>
  <FormPanel title="نشانی محل فعالیت" open={newAddress} onClose={()=>setNewAddress(false)}><AddressForm done={a=>{setNewAddress(false);void addresses.refetch();if(a)setAddress(a.code);}}/></FormPanel>
  <FormPanel title="قوانین همکاری و حریم خصوصی" open={showTerms} onClose={()=>setShowTerms(false)}>{terms.data&&<TermsBody terms={terms.data}/>}</FormPanel>
 </div>;
}
