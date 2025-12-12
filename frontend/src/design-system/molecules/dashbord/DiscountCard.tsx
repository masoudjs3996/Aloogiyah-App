import { CopyButton } from "@/design-system/atoms/CopyButton";
import Input from "@/design-system/atoms/Input";
import { ReactNode } from "react";

interface DiscountCardProps {
  title: string;
  daysLeft: number;
  remainingUsage: number;
  code: string;
  icon: ReactNode;
  bg: string;
}

export const DiscountCard = ({
  title,
  daysLeft,
  remainingUsage,
  code,
  icon,
  bg,
}: DiscountCardProps) => {
  return (
    <div className="bg-secondary-0 border p-4 rounded-xl shadow-sm flex flex-col gap-3">
      <div className="flex gap-x-2 items-center ">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-secondary-500">{title}</h3>
      </div>
      <div className="w-full flex gap-x-1">
        <div className="flex gap-x-2">
          <span className="text-gray-600 text-xs bg-gray-100 px-3 py-1 rounded-full">
            قابل استفاده تا {daysLeft} روز دیگر
          </span>

          <span className="text-gray-600 text-xs bg-gray-100 px-3 py-1 rounded-full">
            {remainingUsage} بار استفاده
          </span>
        </div>
      </div>
      <div className={`flex justify-between items-center ${bg} p-1 rounded-md`}>
        <div>
          <Input value={code} readOnly />
        </div>
        <CopyButton code={code} />
      </div>
    </div>
  );
};
