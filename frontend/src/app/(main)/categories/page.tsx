import { CategoryBody } from "@/design-system/organisms/Home/CategoryBody";
import { CategorySidebar } from "@/design-system/organisms/Home/CategorySidebar";
import { getCategoryTree } from "@/lib/actions/categories";

export default async function CategoryPage() {
  const res = await getCategoryTree();
  const categories = res?.data ?? [];

  return (
    <div className="flex">
      <CategorySidebar categories={categories} />
      <CategoryBody categories={categories} />
    </div>
  );
}
