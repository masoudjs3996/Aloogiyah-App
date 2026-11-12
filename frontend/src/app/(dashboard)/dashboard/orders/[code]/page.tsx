import { OrderDetail } from "@/design-system/organisms/platform/OrdersWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; if (isDirectListingsMode) redirect("/dashboard/inquiries"); return <OrderDetail code={code} />; }
