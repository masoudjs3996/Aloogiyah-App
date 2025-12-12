import { RewardsFilters } from "@/design-system/organisms/dashbord";
import { getFeaturedCategories } from "@/lib/actions/categories";

export default async function RewardsPage() {
  const res = await getFeaturedCategories();
  const categories = res?.data;
  return <RewardsFilters categories={categories} />;
}
