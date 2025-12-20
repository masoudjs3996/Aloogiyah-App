import { RewardsFilters } from "@/design-system/organisms/dashbord";
import { getFeaturedCategories } from "@/lib/actions/categories";
import { ICategoryFeatured } from "@/shared/types/categories";

export default async function RewardsPage() {
  const res = await getFeaturedCategories();
  const categories: ICategoryFeatured[] = res?.data ?? [];
  return <RewardsFilters categories={categories} />;
}
