"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { IoSettings } from "react-icons/io5";
import { useRouter } from "next/navigation";

export const ProfileHeader = () => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <header className="bg-secondary-0 shadow-sm p-4 flex justify-between items-center">
      <button onClick={goBack} className="text-gray-600 dark:text-gray-300">
        <ArrowLeftIcon className="w-6 h-6 rotate-180" />
      </button>
      <div className="text-teal-500 font-bold text-lg">حساب کاربری</div>
      <button className="text-gray-600 dark:text-gray-300">
        <IoSettings className="w-6 h-6" />
      </button>
    </header>
  );
};
