import CheckoutWorkspace from "@/design-system/organisms/platform/CheckoutWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; if (isDirectListingsMode) redirect("/dashboard/inquiries"); return <CheckoutWorkspace code={code} />; }
