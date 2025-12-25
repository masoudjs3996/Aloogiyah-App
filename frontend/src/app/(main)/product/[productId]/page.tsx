import ProductDetail from "@/design-system/organisms/public/ProductDetail";
import { PageParams } from "@/shared/types/general";
type DetailProductParams = PageParams<"productId">;
const ProductPage = async ({ params }: DetailProductParams) => {
  const { productId } = await params;
  return (
    <>
      <ProductDetail productId={productId} />
    </>
  );
};

export default ProductPage;
