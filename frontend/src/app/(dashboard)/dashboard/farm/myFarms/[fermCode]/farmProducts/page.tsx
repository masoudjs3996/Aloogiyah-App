import { FarmProducts } from "@/design-system/organisms/dashbord";
import { PageParams } from "@/shared/types/general";

type DetailFarmParams = PageParams<"fermCode">;

const ProductListPage = async ({ params }: DetailFarmParams) => {
  const { fermCode } = await params;

  return <FarmProducts fermCode={fermCode} />;
};

export default ProductListPage;
