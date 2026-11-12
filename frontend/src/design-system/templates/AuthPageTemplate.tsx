"use client";
import { FC, ReactNode, useEffect, useState } from "react";
import { getAuthReturnPath } from "@/shared/utils/authRedirect";
import Link from "next/link";
import BrandLogo from "@/design-system/atoms/BrandLogo";

type AuthPageTemplateProps = {
  title: string;
  children: ReactNode;
  bottomText?: string; 
  bottomLinkText?: string; 
  bottomLinkHref?: string;
};

const AuthPageTemplate: FC<AuthPageTemplateProps> = ({
  title,
  children,
  bottomText,
  bottomLinkText,
  bottomLinkHref,
}) => {
  const [returnPath, setReturnPath] = useState<string | null>(null);
  useEffect(() => { setReturnPath(getAuthReturnPath()); }, []);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-slate-950/10">
        <div className="border-b border-gray-200 bg-white px-5 py-6 text-center sm:px-8">
          <Link href="/" aria-label="صفحه اصلی الو گیاه" className="mx-auto mb-5 block w-full max-w-[280px]">
            <BrandLogo className="h-auto w-full" />
          </Link>
          <h1 className="text-xl font-bold text-emerald-950 sm:text-2xl">{title}</h1>
        </div>
        <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-8">
        {children}
        {bottomText && bottomLinkText && bottomLinkHref && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-slate-700">{bottomText}</p>
            <Link
              href={returnPath ? `${bottomLinkHref}?next=${encodeURIComponent(returnPath)}` : bottomLinkHref}
              className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-gray-300 transition hover:bg-emerald-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              {bottomLinkText}
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AuthPageTemplate;
