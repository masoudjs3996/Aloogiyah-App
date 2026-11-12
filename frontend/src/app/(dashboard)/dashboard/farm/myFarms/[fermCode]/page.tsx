import { FarmProfile } from "@/design-system/organisms/platform/FarmsWorkspace";
export default async function Page({ params }: { params: Promise<{ fermCode: string }> }) { const { fermCode } = await params; return <FarmProfile code={fermCode} dashboard />; }
