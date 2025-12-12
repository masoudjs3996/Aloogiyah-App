import { getCategoryIcon } from "@/shared/utils/categoryIconMap";

export const CategoryIcon = ({ slug }: { slug: string }) => {
  const Icon = getCategoryIcon(slug);
  return <Icon className="w-4 h-4 text-secondary-500" />;
};
