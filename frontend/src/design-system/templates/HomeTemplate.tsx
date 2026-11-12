
import { FC, ReactNode } from "react";
import Link from "next/link";
import { HomeBottomNavigation, HomeHeader } from "../organisms/Home";

interface HomeTemplateProps {
  children: ReactNode;
}

const HomeTemplate: FC<HomeTemplateProps> = ({ children }) => {
 
  return (
    <div className="min-h-screen bg-[#faf8f2] ">
      <HomeHeader />
      <main className="pb-24 md:pb-6">{children}</main>
      <footer className="border-t border-[#dedfd2] px-4 pb-24 pt-6 text-center text-sm text-slate-600 md:pb-6">
        <p className="mb-2 font-bold text-[#193f32]">الو گیاه؛ ریشه در رو‌راستی، رونق در معامله.</p>
        <nav aria-label="قوانین و پشتیبانی" className="flex flex-wrap justify-center gap-4">
          <Link href="/terms" className="underline">قوانین آگهی و همکاری</Link>
          <Link href="/privacy" className="underline">حریم خصوصی و پشتیبانی</Link>
        </nav>
      </footer>
      <HomeBottomNavigation />
    </div>
  );
};

export default HomeTemplate;
