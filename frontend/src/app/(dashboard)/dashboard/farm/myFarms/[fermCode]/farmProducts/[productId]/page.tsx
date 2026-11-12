import { PageParams } from "@/shared/types/general";
import ProductDetailUI from "./ProductDetailUI";

type ProductDetailParams = PageParams<"productId">;
const ProductDetail = async ({ params }: ProductDetailParams) => {
  const { productId } = await params;

  return (
    <>
      <ProductDetailUI productId={productId} />
    </>
  );
};

export default ProductDetail;
