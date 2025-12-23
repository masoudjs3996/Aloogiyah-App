import { GetDetailProduct } from "@/lib/actions/product";
import { PageParams } from "@/shared/types/general";
import Test from "./test";
import ProductDetailUI from "./test";

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
