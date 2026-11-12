import AuctionsWorkspace from "@/design-system/organisms/platform/AuctionsWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";
export default function Page() { if (isDirectListingsMode) redirect("/dashboard"); return <AuctionsWorkspace />; }
