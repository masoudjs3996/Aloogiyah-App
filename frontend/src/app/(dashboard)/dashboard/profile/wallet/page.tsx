"use client";

import { WalletSummary } from "@/design-system/molecules/dashbord/WalletSummary";
import QueryState from "@/design-system/molecules/platform/QueryState";
import { useWallet } from "@/hooks/queries/useWallet";

export default function WalletPage() {
  const { data, error, isLoading, refetch } = useWallet();
  return (
    <div className="space-y-6 p-4">
      <QueryState loading={isLoading} error={error} retry={() => refetch()}>
        {data?.data && <WalletSummary
          balance={data.data.balance}
          pendingAmount={data.data.heldAmount}
        />}
      </QueryState>
      <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
        شارژ آنلاین کیف پول هنوز فعال نشده است. می‌توانید با موجودی فعلی خرید کنید.
        وجه خرید تا تأیید فروشنده رزرو می‌شود؛ در صورت رد یا پایان مهلت تأیید، رزرو آزاد می‌شود.
      </p>
    </div>
  );
}
