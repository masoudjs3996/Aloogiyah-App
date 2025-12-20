"use client";

import Button from "@/design-system/atoms/Button";
import { useMyFarm } from "@/hooks/queries/useFarm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Link from "next/link";

interface FarmInfoProps {
  fermCode: string;
}

const FarmInfo = ({ fermCode }: FarmInfoProps) => {
  const { farmDetail, farmDetailLoading } = useMyFarm(fermCode);

  if (!farmDetail?.data)
    return <p className="text-red-500">اطلاعات مزرعه یافت نشد.</p>;

  const myFarmDetail = farmDetail.data;
  const { name, description, capacity, minPurchase, imageUrl, address } =
    myFarmDetail;

  return (
    <div className="max-w-xl mx-auto p-5 bg-white rounded-xl shadow-md">
      <div className="w-full h-48 mb-4 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={getImageUrl(imageUrl)}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400">بدون تصویر</span>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-2">{name}</h2>
      <p className="text-gray-700 mb-4">{description}</p>

      <div className="flex justify-between mb-2">
        <span className="font-semibold">ظرفیت:</span>
        <span>{capacity} نفر</span>
      </div>

      <div className="flex justify-between mb-2">
        <span className="font-semibold">حداقل خرید:</span>
        <span>{minPurchase.toLocaleString()} تومان</span>
      </div>

      {address && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">آدرس:</h3>
          <p>{address.street}</p>
          <p>
            {address.provinceName} - {address.countyName} -{" "}
            {address.villageName}
          </p>
          {address.postalCode && <p>کد پستی: {address.postalCode}</p>}
        </div>
      )}
      <div className="w-full py-4 flex justify-center items-center ">
        <Link href={`/dashboard/farm/myFarms/${fermCode}/farmProducts`}>
          <Button variant="success">لیست محصولات </Button>
        </Link>
      </div>
    </div>
  );
};

export default FarmInfo;
