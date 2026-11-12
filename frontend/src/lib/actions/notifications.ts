import axiosInstance from "@/shared/lib/config/axions";

export type NotificationItem = {
  code: string;
  userCode?: string | null;
  isPublic: boolean;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  isSuccess: boolean;
  message: string;
  data: NotificationItem[];
};

export type NotificationPreferences = {
  orderNotificationsEnabled: boolean;
  serviceRequestNotificationsEnabled: boolean;
  generalNotificationsEnabled: boolean;
};

export async function GetNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await axiosInstance.get<{ data: NotificationPreferences }>("/Notification/MyPreferences");
  return data.data;
}

export async function UpdateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
  const { data } = await axiosInstance.put<{ data: NotificationPreferences }>("/Notification/MyPreferences", preferences);
  return data.data;
}

export async function GetMyNotifications(): Promise<NotificationsResponse> {
  const { data } = await axiosInstance.get<NotificationsResponse>("/Notification/MyNotifications");
  return data;
}

export async function MarkNotificationAsRead(notificationCode: string) {
  const { data } = await axiosInstance.put("/Notification/Read", null, {
    params: { notificationCode },
  });
  return data;
}

export async function DeleteNotification(notificationCode: string) {
  const { data } = await axiosInstance.delete("/Notification/DeleteNotification", {
    params: { notificationCode },
  });
  return data;
}
