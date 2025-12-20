"use client";
import Button from "@/design-system/atoms/Button";
import { useMyFarm } from "@/hooks/queries/useFarm";
import Link from "next/link";
import { IoStorefrontSharp } from "react-icons/io5";

const AllFarm = () => {
  const { farms } = useMyFarm();
  const myFarms = farms?.data ?? [];
  return (
    <div className="w-full h-full p-5 ">
      {myFarms.map((farm) => (
        <Link key={farm.code} href={`/dashboard/farm/myFarms/${farm.code}`}>
          <div className="flex gap-x-3 items-center justify-start ">
            <IoStorefrontSharp className="w-6 h-6" />
            <p className="text-secondary-700 text-xl">{farm.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default AllFarm;
