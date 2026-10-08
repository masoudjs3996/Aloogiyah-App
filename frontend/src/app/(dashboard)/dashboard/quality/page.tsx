import QualityWorkspace from "@/design-system/organisms/platform/QualityWorkspace";
export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string }> }) { const { product } = await searchParams; return <QualityWorkspace initialProduct={product || ""} />; }
