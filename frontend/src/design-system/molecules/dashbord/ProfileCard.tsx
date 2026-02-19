"use client";

import { Avatar } from "@/design-system/atoms/Avatar";
import { SmallText, Text, Title } from "@/design-system/atoms/Typography";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { GrEdit } from "react-icons/gr";
export const ProfileCard = ({ user }: { user: any }) => {
  return (
    <div className="bg-secondary-0 p-2 m-4 rounded-lg shadow-sm flex justify-between items-center ">
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="relative">
          <Avatar src={user?.profileImageUrl} />
          <button className="absolute bottom-0 right-0 bg-teal-500 text-white rounded-full p-1">
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1">
          <Title>{user?.fName}</Title>
          <Text>{user?.userName}</Text>
          <SmallText>{user?.email}</SmallText>
        </div>
      </div>
      <Link href={"/profile/editProfile"}>
        <GrEdit className="w-6 h-6 cursor-pointer" />
      </Link>
    </div>
  );
};
