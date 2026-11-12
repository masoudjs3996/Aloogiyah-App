import SettlementsWorkspace from "@/design-system/organisms/platform/SettlementsWorkspace";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";

export default function SettlementsPage() {
  if (isDirectListingsMode) redirect("/dashboard/inquiries");
  return <div className="p-4"><SettlementsWorkspace /></div>;
}
