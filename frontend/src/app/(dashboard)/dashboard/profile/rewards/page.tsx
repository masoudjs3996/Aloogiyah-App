export const dynamic = "force-dynamic";
import { RewardsFilters } from "@/design-system/organisms/dashbord";
import { getFeaturedCategories } from "@/lib/actions/categories";
import { ICategoryFeatured } from "@/shared/types/categories";
import { redirect } from "next/navigation";
import { isDirectListingsMode } from "@/shared/utils/marketplace-mode";

export default async function RewardsPage() {
  if (isDirectListingsMode) redirect("/dashboard");
  const res = await getFeaturedCategories();
  const categories: ICategoryFeatured[] = res?.data ?? [];
  return <RewardsFilters categories={categories} />;
}
