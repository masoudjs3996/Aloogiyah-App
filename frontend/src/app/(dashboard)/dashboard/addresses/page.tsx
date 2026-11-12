import AddressesWorkspace from "@/design-system/organisms/platform/AddressesWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default function Page() { if (isDirectListingsMode) redirect("/dashboard"); return <AddressesWorkspace />; }
