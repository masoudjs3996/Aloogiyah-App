import { PageParams } from "@/shared/types/general";
import { getCategoryTree } from "@/lib/actions/categories";
import { ICategoryFeatured } from "@/shared/types/categories";
import { AddFarmProductForm } from "@/design-system/organisms/dashbord";
type AddProductsParams = PageParams<"fermCode">;
const AddProducts = async ({ params }: AddProductsParams) => {
  const { fermCode } = await params;
  const res = await getCategoryTree();
  const categories = res?.data ?? [];
  return (
    <>
      <AddFarmProductForm fermCode={fermCode} categories={categories} />
    </>
  );
};

export default AddProducts;
