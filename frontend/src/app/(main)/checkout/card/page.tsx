import CartWorkspace from "@/design-system/organisms/platform/CartWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default function Page() { if (isDirectListingsMode) redirect("/dashboard/inquiries"); return <CartWorkspace />; }
