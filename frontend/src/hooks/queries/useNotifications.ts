import { GetMyNotifications, type NotificationItem } from "@/lib/actions/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MarkNotificationAsRead, DeleteNotification } from "@/lib/actions/notifications";

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ["GetMyNotifications"],
    queryFn: GetMyNotifications,
    staleTime: 1000 * 60 * 2,
  });

  const markAsRead = async (code: string) => {
    await MarkNotificationAsRead(code);
    queryClient.setQueryData(["GetMyNotifications"], (current: any) =>
      current?.data
        ? { ...current, data: current.data.map((item: NotificationItem) => item.code === code ? { ...item, isRead: true } : item) }
        : current,
    );
  };

  const deleteNotification = async (code: string) => {
    await DeleteNotification(code);
    queryClient.setQueryData(["GetMyNotifications"], (current: any) =>
      current?.data
        ? { ...current, data: current.data.filter((item: NotificationItem) => item.code !== code) }
        : current,
    );
  };

  return {
    data: data?.data ?? [],
    error,
    isLoading,
    isSuccess,
    markAsRead,
    deleteNotification,
  };
};
