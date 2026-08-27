"use client";
import NotificationItem from "@/design-system/atoms/NotificationItem";
import { useEffect } from "react";


const NotificationList = (data: any) => {
  useEffect(()=>{
    console.log(data);
    
  },[data])
  if (!data?.data?.data?.length) {
    return (
      <p className="text-center text-sm text-muted_foreground">
        نوتیفیکیشنی وجود ندارد
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data?.data?.data?.map((n: any) => (
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
