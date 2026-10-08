import Link from "next/link";
export default function NotFound() { return <div className="p-12 text-center"><h1 className="mb-6 text-xl font-bold">صفحه پیدا نشد</h1><Link href="/dashboard" className="text-emerald-700">بازگشت به داشبورد</Link></div>; }
