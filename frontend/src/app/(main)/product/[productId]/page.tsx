import ProductDetail from "@/design-system/organisms/public/ProductDetail";
import { detailCodeOrNotFound, detailMetadata, loadPublicProduct } from "@/lib/actions/public-detail";
import { PageParams } from "@/shared/types/general";
import { publicDetailPath } from "@/shared/utils/public-detail-path";

type DetailProductParams = PageParams<"productId">;

export async function generateMetadata({ params }: DetailProductParams) {
  const product = await loadPublicProduct(detailCodeOrNotFound((await params).productId));
  return detailMetadata(
    `خرید ${product.name} | قیمت و مشخصات محصول`,
    `قیمت، مشخصات، موجودی و واحد فروش ${product.name} را ببینید و شرایط سفارش این محصول را بررسی کنید.`,
    publicDetailPath("product", product.code, product.name),
    product.primaryImageUrl || product.imageUrls?.[0],
  );
}

const ProductPage = async ({ params }: DetailProductParams) => {
  const product = await loadPublicProduct(detailCodeOrNotFound((await params).productId));
  return <ProductDetail productId={product.code} initialProduct={product} />;
};

export default ProductPage;
