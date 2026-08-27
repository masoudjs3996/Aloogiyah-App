"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaLeaf } from "react-icons/fa";

const farmStats = [
  { label: "تعداد زمین‌ها", value: 12, icon: "🌾" },
  { label: "محصول آماده برداشت", value: 5, icon: "🥬" },
  { label: "برداشت امروز", value: "120 کیلوگرم", icon: "📦" },
  { label: "فروش هفته", value: "1,250,000 تومان", icon: "💰" },
  { label: "روزهای آبدهی", value: 3, icon: "💧" },
  { label: "میانگین دما (°C)", value: 28, icon: "🌡️" },
  { label: "رطوبت (%)", value: 65, icon: "💦" },
  { label: "کارگران فعال", value: 8, icon: "👨‍🌾" },
  { label: "ساعات فعالیت امروز", value: 7, icon: "⏰" },
  { label: "محصولات کل", value: 15, icon: "🥕" },
  { label: "تعداد زمین‌ها", value: 12, icon: "🌾" },
  { label: "محصول آماده برداشت", value: 5, icon: "🥬" },
  { label: "برداشت امروز", value: "120 کیلوگرم", icon: "📦" },
  { label: "فروش هفته", value: "1,250,000 تومان", icon: "💰" },
  { label: "روزهای آبدهی", value: 3, icon: "💧" },
  { label: "میانگین دما (°C)", value: 28, icon: "🌡️" },
  { label: "رطوبت (%)", value: 65, icon: "💦" },
  { label: "کارگران فعال", value: 8, icon: "👨‍🌾" },
  { label: "ساعات فعالیت امروز", value: 7, icon: "⏰" },
  { label: "محصولات کل", value: 15, icon: "🥕" },
];

export default function FarmerDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green">
          <FaLeaf className="h-6 w-6 text-green_foreground " />
        </div>
        <span className="font-heading text-xl font-bold text-foreground">
          داشبورد مزرعه
        </span>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {farmStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-100 p-4 scale-100 cursor-pointer rounded shadow flex flex-col items-center justify-center text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-sm text-gray-700">{stat.label}</p>
            <p className="text-xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
