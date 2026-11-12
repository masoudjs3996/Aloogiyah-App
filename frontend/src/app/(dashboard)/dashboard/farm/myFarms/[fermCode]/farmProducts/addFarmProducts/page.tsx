import { PageParams } from "@/shared/types/general";
import { AddFarmProductForm } from "@/design-system/organisms/dashbord";
type AddProductsParams = PageParams<"fermCode">;
const AddProducts = async ({ params }: AddProductsParams) => {
  const { fermCode } = await params;
  return (
    <>
      <AddFarmProductForm fermCode={fermCode} />
    </>
  );
};

export default AddProducts;
