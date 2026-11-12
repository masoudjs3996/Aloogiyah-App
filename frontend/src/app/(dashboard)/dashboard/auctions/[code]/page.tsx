import { AuctionDetail } from "@/design-system/organisms/platform/AuctionsWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { if (isDirectListingsMode) redirect("/dashboard"); const { code } = await params; return <AuctionDetail code={code} />; }
