"use client";

import Link from "next/link";
import Image from "next/image";
import { FiMapPin, FiGrid } from "react-icons/fi";
import {
  IoLeafOutline,
  IoStorefrontOutline,
  IoFlowerOutline,
  IoSunnyOutline,
  IoWaterOutline,
  IoRoseOutline,
} from "react-icons/io5";
import { GiWheat, GiGrapes } from "react-icons/gi";
import { MdOutlineAgriculture } from "react-icons/md";
import { useMyFarm } from "@/hooks/queries/useFarm";

const farmExtras: Record<
  string,
  {
    image: string;
    location: string;
    product: string;
    productIcon: React.ReactNode;
    area: string;
    status: string;
    cardIcon: React.ReactNode;
  }
> = {
  "66E5848074": {
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    location: "تهران، ورامین",
    product: "گندم",
    productIcon: <GiWheat className="w-4 h-4 text-amber-600" />,
    area: "۱۲ هکتار",
    status: "فعال",
    cardIcon: <MdOutlineAgriculture className="w-5 h-5 text-emerald-600" />,
  },
  "331DE06794": {
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    location: "فارس، مرودشت",
    product: "انگور",
    productIcon: <GiGrapes className="w-4 h-4 text-purple-600" />,
    area: "۸ هکتار",
    status: "فعال",
    cardIcon: <IoStorefrontOutline className="w-5 h-5 text-emerald-600" />,
  },
  "9189288C37": {
    image:
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80",
    location: "خوزستان، دزفول",
    product: "گندم",
    productIcon: <GiWheat className="w-4 h-4 text-amber-600" />,
    area: "۲۰ هکتار",
    status: "فعال",
    cardIcon: <IoSunnyOutline className="w-5 h-5 text-emerald-600" />,
  },
  A841324451: {
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    location: "تهران، ورامین",
    product: "گل رز",
    productIcon: <IoRoseOutline className="w-4 h-4 text-rose-500" />,
    area: "۵ هکتار",
    status: "فعال",
    cardIcon: <IoFlowerOutline className="w-5 h-5 text-emerald-600" />,
  },
  "79A05E6A91": {
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
    location: "شیراز",
    product: "نرگس",
    productIcon: <IoFlowerOutline className="w-4 h-4 text-yellow-500" />,
    area: "۳ هکتار",
    status: "فعال",
    cardIcon: <IoLeafOutline className="w-5 h-5 text-emerald-600" />,
  },
  "746F7AD598": {
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
    location: "اصفهان",
    product: "آفتابگردان",
    productIcon: <IoSunnyOutline className="w-4 h-4 text-yellow-600" />,
    area: "۷ هکتار",
    status: "فعال",
    cardIcon: <IoWaterOutline className="w-5 h-5 text-emerald-600" />,
  },
};

const defaultExtra = {
  image:
    "https://images.unsplash.com/photo-1592846606840-60d4c52e0d6d?w=800&q=80",
  location: "ایران",
  product: "محصولات کشاورزی",
  productIcon: <IoLeafOutline className="w-4 h-4 text-emerald-600" />,
  area: "—",
  status: "فعال",
  cardIcon: <MdOutlineAgriculture className="w-5 h-5 text-emerald-600" />,
};

const AllFarm = () => {
  const { farms } = useMyFarm();
  const myFarms = farms?.data ?? [];

  return (
    <div className="w-full h-full p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {myFarms.map((farm: any) => {
          const extra = farmExtras[farm.code] || defaultExtra;

          return (
            <Link
              key={farm.code}
              href={`/dashboard/farm/myFarms/${farm.code}`}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={extra.image}
                    alt={farm.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm">
                    {extra.cardIcon}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800 truncate">
                      {farm.name}
                    </h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <FiMapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{extra.location}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                    <div className="text-center">
                      <p className="text-[11px] text-gray-400 mb-1">وضعیت</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">
                          {extra.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] text-gray-400 mb-1">
                        محصول اصلی
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        {extra.productIcon}
                        <span className="text-xs font-medium text-gray-700">
                          {extra.product}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] text-gray-400 mb-1">مساحت</p>
                      <div className="flex items-center justify-center gap-1">
                        <FiGrid className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">
                          {extra.area}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium group-hover:bg-emerald-100 transition-colors">
                      مشاهده جزئیات ←
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {myFarms.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <IoStorefrontOutline className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">هنوز مزرعه‌ای ثبت نشده است</p>
        </div>
      )}
    </div>
  );
};

export default AllFarm;
