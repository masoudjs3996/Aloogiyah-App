import { setCategories } from "@/lib/store/slices/productFilterSlice";
import { ICategoryTree } from "@/shared/types/categories";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

interface Props {
  category: ICategoryTree;
}

export const LastItem: React.FC<Props> = ({ category }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const handlerClick = (code: string) => {
    dispatch(setCategories(code));
    router.push("/product");
  };
  return (
    <span
      onClick={() => handlerClick(category.code)}
      className="font-bold text-[8px] bg-primary-500 w-[50px] h-[50px] rounded-full 
      flex items-center justify-center text-secondary-0"
    >
      {category.name}
    </span>
  );
};
