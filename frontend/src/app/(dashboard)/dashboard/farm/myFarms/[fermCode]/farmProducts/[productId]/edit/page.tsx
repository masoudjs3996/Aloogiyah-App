import ProductEditWorkspace from "@/design-system/organisms/platform/ProductEditWorkspace";

export default async function Page({ params }: { params: Promise<{ fermCode: string; productId: string }> }) {
  const { fermCode, productId } = await params;
  return <ProductEditWorkspace farmCode={fermCode} productCode={productId} />;
}
