import OrdersWorkspace from "@/design-system/organisms/platform/OrdersWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default function Page() { if (isDirectListingsMode) redirect("/dashboard/inquiries"); return <OrdersWorkspace />; }
