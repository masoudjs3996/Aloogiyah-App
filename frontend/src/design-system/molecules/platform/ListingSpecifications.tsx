import type { ProductSpecificationValue } from "@/shared/types/platform";
import SpecificationMark from "./SpecificationMark";

export default function ListingSpecifications({
  typeName,
  specifications,
}: {
  typeName?: string | null;
  specifications?: ProductSpecificationValue[];
}) {
  if (!typeName && !specifications?.length) return null;
  return (
    <section className="my-5 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-bold text-slate-900">مشخصات آگهی</h2>
      {typeName && <p className="mt-1 break-words text-sm text-slate-600">نوع محصول · {typeName}</p>}
      {!!specifications?.length && (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {specifications.map(field => (
            <div key={field.specificationCode} className="min-w-0 rounded-xl bg-white px-3 py-2.5 [overflow-wrap:anywhere]">
              <dt className="text-xs leading-6 text-slate-600">{field.name}</dt>
              <dd className="flex items-center gap-2 text-sm font-bold leading-6 text-slate-900"><SpecificationMark {...field} />{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
