"use client";

import { useEffect, useState } from "react";

import { ProfileCard } from "@/design-system/molecules/dashbord/ProfileCard";
import { useSelector } from "react-redux";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { SkeletonBlock } from "@/design-system/molecules/platform/Skeleton";

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="در حال دریافت اطلاعات پروفایل" className="mx-auto w-full max-w-6xl space-y-5 py-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <SkeletonBlock className="h-28 w-full rounded-none sm:h-36" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:gap-6 sm:px-8">
          <SkeletonBlock className="-mt-12 h-24 w-24 shrink-0 rounded-full border-4 border-white sm:-mt-14 sm:h-28 sm:w-28" />
          <div className="w-full space-y-3 pb-1">
            <SkeletonBlock className="h-6 w-36" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="w-full space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
        <SkeletonBlock className="mb-6 h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <SkeletonBlock className="mt-5 h-11 w-full sm:w-40" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading, isError, refetch } = usePlatformProfile();
  const reduxUser = useSelector((state: any) => state.user.data);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);
  const user = data?.user ?? reduxUser;

  if (!isHydrated || (isLoading && !user)) return <ProfileSkeleton />;

  if (isError && !user) {
    return (
      <div role="alert" className="mx-auto mt-8 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm leading-7 text-amber-900">
        دریافت اطلاعات پروفایل انجام نشد.
        <button type="button" onClick={() => void refetch()} className="mt-3 block w-full font-bold text-emerald-800 hover:underline">
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (!user) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen flex flex-col justify-between gap-y-4 py-6 sm:py-10">
      <div>
        <ProfileCard user={user} />
      </div>
    </div>
  );
}
