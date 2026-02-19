import { Categories } from "@/design-system/organisms/Home";

import { getCategoryTree } from "@/lib/actions/categories";

export default async function CategoryPage() {
  const res = await getCategoryTree();
  const categories = res?.data ?? [];

  return (
    <div className="flex ">
      <Categories categories={categories} />
    </div>
  );
}
