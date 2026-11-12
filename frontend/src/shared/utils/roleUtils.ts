export type UserRole = "User" | "Buyer" | "Farmer" | "Expert" | "Provider" | "Admin" | "Manager" | "DeliveryAgent";

export const getPersianRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    DeliveryAgent: "نماینده تحویل",
    Manager: "مدیر ارشد",
    Admin: "ادمین",
    User: "کاربر",
    Buyer: "خریدار",
    Farmer: "کشاورز",
    Expert: "کارشناس",
    Provider: "ارائه‌دهنده خدمات",
  };

  return roleMap[role] || role;
};
