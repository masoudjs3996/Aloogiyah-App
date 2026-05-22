"use client";
import NotificationItem from "@/design-system/atoms/NotificationItem";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useEffect } from "react";

const NotificationList = () => {
  const { data } = useNotifications();

  useEffect(() => {
    console.log(data?.data);
  }, [data]);
  if (!data?.data?.length) {
    return (
      <p className="text-center text-sm text-muted_foreground">
        نوتیفیکیشنی وجود ندارد
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data?.data.map((n) => (
        <NotificationItem
          key={n.code}
          title={"سفارش شما ثبت شد"}
          description={n.message}
        />
      ))}
    </div>
  );
};

export default NotificationList;
