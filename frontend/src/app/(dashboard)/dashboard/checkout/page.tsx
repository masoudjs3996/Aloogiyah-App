import CheckoutWorkspace from "@/design-system/organisms/platform/CheckoutWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default function Page() { if (isDirectListingsMode) redirect("/dashboard/inquiries"); return <CheckoutWorkspace />; }
