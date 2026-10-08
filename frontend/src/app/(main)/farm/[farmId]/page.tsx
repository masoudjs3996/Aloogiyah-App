import { FarmProfile } from "@/design-system/organisms/platform/FarmsWorkspace";
export default async function Page({ params }: { params: Promise<{ farmId: string }> }) { const { farmId } = await params; return <FarmProfile code={farmId} />; }
