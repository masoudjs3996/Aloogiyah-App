import { AuctionDetail } from "@/design-system/organisms/platform/AuctionsWorkspace";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <AuctionDetail code={code} />; }
