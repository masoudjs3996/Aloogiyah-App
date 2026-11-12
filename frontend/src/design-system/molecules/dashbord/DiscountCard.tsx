import { CopyButton } from "@/design-system/atoms/CopyButton";
import Input from "@/design-system/atoms/Input";
import { ReactNode } from "react";
import { rewardColors } from "@/shared/utils/rewardColors";

interface DiscountCardProps {
  title: string;
  daysLeft: number;
  remainingUsage: number;
  code: string;
  icon: ReactNode;
  palette: { color: string; soft: string; border: string };
  colors: string[];
}

export const DiscountCard = ({
  title,
  daysLeft,
  remainingUsage,
  code,
  icon,
  palette = rewardColors.all,
  colors,
}: DiscountCardProps) => {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-white shadow-sm"
      style={{ borderColor: palette.border }}
    >
      <div aria-hidden="true" className="flex h-1">
        {colors.map((color) => (
          <span
            key={color}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-x-2 items-center ">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: palette.soft, color: palette.color }}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-secondary-500">{title}</h3>
        </div>
        <div className="w-full flex gap-x-1">
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-600 text-xs bg-gray-100 px-3 py-1 rounded-full">
              قابل استفاده تا {daysLeft} روز دیگر
            </span>

            <span className="text-gray-600 text-xs bg-gray-100 px-3 py-1 rounded-full">
              {remainingUsage} بار استفاده
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-between gap-2 rounded-md border border-dashed p-2"
          style={{
            backgroundColor: palette.soft,
            borderColor: palette.border,
            color: palette.color,
          }}
        >
          <div className="min-w-0 flex-1">
            <Input value={code} readOnly />
          </div>
          <CopyButton code={code} color={palette.color} />
        </div>
      </div>
    </div>
  );
};
