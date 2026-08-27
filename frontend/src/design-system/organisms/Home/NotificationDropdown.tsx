"use client";
import NotificationList from "@/design-system/molecules/Home/NotificationList";
import useOutsideClick from "@/shared/hooks/useClickOutside";
interface Props {
  onClose: () => void;
  data: any;
}

const NotificationDropdown = ({ onClose,data }: Props) => {
  const ref = useOutsideClick<HTMLDivElement>(() => {
    onClose();
  });

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 w-72 rounded-lg border bg-white shadow-lg p-3 z-50"
    >
      <p className="mb-2 text-sm font-semibold">نوتیفیکیشن‌ها</p>
      <NotificationList data={data} />
    </div>
  );
};

export default NotificationDropdown;
