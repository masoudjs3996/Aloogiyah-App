import { getCategoryIcon } from "@/shared/utils/categoryIconMap";

export const CategoryIcon = ({ icon }: { icon: string }) => {
  const Icon = getCategoryIcon(icon);
  return <Icon className="w-4 h-4 text-secondary-500" />;
};
