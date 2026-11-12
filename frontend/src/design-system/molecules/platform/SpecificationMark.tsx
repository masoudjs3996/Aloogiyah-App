import Image from "next/image";

export type SpecificationAppearance = { colorHex?: string | null; icon?: string | null };

export default function SpecificationMark({ colorHex, icon }: SpecificationAppearance) {
  return (
    <>
      {colorHex && <span aria-hidden="true" className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-slate-400" style={{ backgroundColor: colorHex }} />}
      {icon && <Image src={`/api/AgriculturalProductTemplate/Icons/${encodeURIComponent(icon)}`} alt="" width={16} height={16} unoptimized className="shrink-0" />}
    </>
  );
}
