"use client";
import { FC } from "react";
import { IoNotificationsOutline } from "react-icons/io5";

interface Props {
  onClick: () => void;
}

const NotificationIcon: FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-1.5 bg-white rounded-md border hover:bg-gray-50 transition"
    >
      <IoNotificationsOutline size={20} />
    </button>
  );
};

export default NotificationIcon;
