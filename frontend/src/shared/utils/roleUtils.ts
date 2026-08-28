export type UserRole = "User" | "Admin" | "Manager" | "Buyer" | "Farmer";

export const getPersianRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    User: "کاربر",
    Admin: "مدیر سیستم",
    Manager: "مدیر",
    Buyer: "خریدار",
    Farmer: "کشاورز",
  };

  return roleMap[role] || role;
};
