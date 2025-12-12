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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-md flex flex-col gap-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{title}</h1>
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
