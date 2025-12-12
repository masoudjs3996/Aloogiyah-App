import { ICategoryTree } from "@/shared/types/categories";

interface Props {
  category: ICategoryTree;
}

export const LastItem: React.FC<Props> = ({ category }) => {
  return (
    <span
      className="font-bold text-[8px] bg-primary-500 w-[50px] h-[50px] rounded-full 
      flex items-center justify-center text-secondary-0"
    >
      {category.name}
    </span>
  );
};
