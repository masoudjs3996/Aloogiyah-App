export type UserRole = "User" | "Admin" | "Manager" | "Buyer" | "Farmer" | "Expert" | "Provider";

export const getPersianRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    User: "کاربر",
    Admin: "مدیر سیستم",
    Manager: "مدیر",
    Buyer: "خریدار",
    Farmer: "کشاورز",
    Expert: "کارشناس",
    Provider: "ارائه‌دهنده خدمات",
  };

  return roleMap[role] || role;
};
