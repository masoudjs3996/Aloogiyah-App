import SellerSalesWorkspace from "@/design-system/organisms/platform/SellerSalesWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default function SalesPage() { if (isDirectListingsMode) redirect("/dashboard/inquiries"); return <div className="p-4"><SellerSalesWorkspace /></div>; }
