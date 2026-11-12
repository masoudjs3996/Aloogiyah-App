import QualityWorkspace from "@/design-system/organisms/platform/QualityWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; order?: string }> }) {
  if (isDirectListingsMode) redirect("/dashboard");
  const { product, order } = await searchParams;
  return <QualityWorkspace key={`${product || ""}:${order || ""}`} initialProduct={product || ""} initialOrder={order || ""} />;
}
