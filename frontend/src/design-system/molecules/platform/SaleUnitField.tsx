"use client";
import { saleUnits, saleUnitGuide } from '@/shared/utils/sale-units';
export default function SaleUnitField({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return <label className="block space-y-2 text-sm"><span>واحد فروش محصول *</span><select required value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">انتخاب واحد فروش</option>{saleUnits.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select><small className="block text-xs leading-7 text-slate-500">{saleUnitGuide}</small></label>;
}
