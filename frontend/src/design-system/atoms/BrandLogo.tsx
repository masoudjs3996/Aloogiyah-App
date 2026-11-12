import Image from "next/image";

export default function BrandLogo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <Image
      src={compact ? "/brand/logo-mark.png" : "/brand/logo-full.png"}
      alt="الو گیاه"
      width={compact ? 530 : 1104}
      height={compact ? 637 : 798}
      className={`object-contain ${className}`}
      unoptimized
    />
  );
}
