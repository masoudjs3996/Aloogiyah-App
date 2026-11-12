"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request, errorMessage } from "@/lib/actions/platform";
import { deliveryApi } from "@/lib/actions/delivery";
export default function FarmDeliveryPoint({code}:{code:string}) {
 const [choice,setChoice]=useState<string>(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 const points=useQuery({queryKey:["delivery-points"],queryFn:deliveryApi.points});
 const current=useQuery({queryKey:["farm-delivery",code],queryFn:()=>request<{pointCode?:string}>(`/Delivery/FarmPoint/${encodeURIComponent(code)}`)});
 const selected=choice ?? current.data?.pointCode ?? "";
 return <section className="my-6 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-900">میدان تحویل سفارش‌های این مزرعه</h2><p className="text-sm leading-7 text-slate-600">محصولات را به این میدان می‌آورید؛ خریدار میدان را دوباره انتخاب نمی‌کند.</p>
 <select className="block min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" aria-label="میدان تحویل مزرعه" value={selected} onChange={e=>setChoice(e.target.value)}><option value="">انتخاب میدان</option>{points.data?.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select>
 {(points.error || current.error) && <p>{errorMessage(points.error || current.error)}</p>}
 <button className="min-h-11 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50" type="button" disabled={busy || !selected || current.isLoading} onClick={()=>{setBusy(true);setMessage("");void request(`/Delivery/FarmPoint/${encodeURIComponent(code)}`,{method:"PUT",data:{pointCode:selected}}).then(()=>{setMessage("میدان تحویل ذخیره شد");void current.refetch();}).catch(e=>setMessage(errorMessage(e))).finally(()=>setBusy(false));}}>ذخیره میدان تحویل</button>
 {message && <p role="status" className="text-sm leading-7">{message}</p>}</section>;
}
