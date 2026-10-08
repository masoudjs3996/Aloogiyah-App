"use client";
import { FC, ReactNode } from "react";
import Link from "next/link";

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
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-5 shadow-md sm:gap-6 sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-center sm:mb-4">{title}</h1>
        {children}
        {bottomText && bottomLinkText && bottomLinkHref && (
          <p className="text-sm text-center text-gray-600">
            {bottomText}{" "}
            <Link
              href={bottomLinkHref}
              className="text-blue-500 hover:underline"
            >
              {bottomLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPageTemplate;
