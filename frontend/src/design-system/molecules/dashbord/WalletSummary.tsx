"use client";

import { CardContainer } from "@/design-system/atoms/CardContainer";
import { TextLabel } from "@/design-system/atoms/TextLabel";
import { HiOutlineWallet } from "react-icons/hi2";

interface WalletSummaryProps {
  balance: number;
  pendingAmount: number;
}

export const WalletSummary = ({
  balance,
  pendingAmount,
}: WalletSummaryProps) => {
  return (
    <CardContainer className="bg-teal-50 border-teal-200">
      <div className="flex justify-between items-center">
        <div>
          <TextLabel className="font-medium text-gray-900">
            موجودی کیف پول
          </TextLabel>

          <p className="text-lg font-bold text-gray-800 mt-1">
            {balance?.toLocaleString()} ریال
          </p>

          <p className="text-xs text-teal-700 mt-2">
            مبلغ در انتظار تایید: {pendingAmount?.toLocaleString()} ریال
          </p>
        </div>

        <HiOutlineWallet className="text-4xl text-teal-600" />
      </div>
    </CardContainer>
  );
};
