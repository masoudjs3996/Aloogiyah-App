import axiosInstance from "@/shared/lib/config/axions";

export async function GetMyNotifications() {
  try {
    const { data } = await axiosInstance.get("/Notification/MyNotifications");
    return data ?? null;
  } catch (error) {
    console.error("Error fetching MyFarm:", error);
    return null;
  }
}
