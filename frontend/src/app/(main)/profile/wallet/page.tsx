"use client";

import Button from "@/design-system/atoms/Button";
import { BottomSheetModal } from "@/design-system/molecules/dashbord/BottomSheetModal";
import { WalletSummary } from "@/design-system/molecules/dashbord/WalletSummary";
import { useWallet } from "@/hooks/queries/useWallet";
import { useState } from "react";

export default function WalletPage() {
  const [open, setOpen] = useState(false);
  const { data } = useWallet();
  return (
    <div className="p-4 space-y-6">
      <WalletSummary
        balance={data?.data?.balance ?? 0}
        pendingAmount={data?.data?.heldAmount ?? 0}
      />

      <Button onClick={() => setOpen(true)}>افزایش موجودی</Button>

      <BottomSheetModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="پرداخت به صورت آنلاین"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["50,000", "70,000", "90,000"].map((item) => (
              <button
                key={item}
                className="px-4 py-2 rounded-xl border text-gray-700"
              >
                {item} ریال
              </button>
            ))}
          </div>
          <input
            className="w-full p-3 border rounded-xl text-right"
            placeholder="مبلغ دلخواه"
          />

          <Button onClick={() => console.log("submit")}>
            تایید مبلغ شارژ حساب
          </Button>
        </div>
      </BottomSheetModal>
    </div>
  );
}
