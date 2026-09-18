import { FarmInfo } from "@/design-system/organisms/dashbord";
import { PageParams } from "@/shared/types/general";

type DetailFarmParams = PageParams<"fermCode">;

export default async function DetailFarm({ params }: DetailFarmParams) {
  const { fermCode } = await params;
  return (
    <div className="min-h-screen bg-[#f6f8f7] px-4 py-8 sm:px-6 lg:py-12">
      <FarmInfo fermCode={fermCode} />
    </div>
  );
}
