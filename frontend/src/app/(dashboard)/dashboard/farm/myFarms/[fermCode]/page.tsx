import { FarmInfo } from "@/design-system/organisms/dashbord";
import { PageParams } from "@/shared/types/general";


type DetailFarmParams = PageParams<"fermCode">;

export default async function DetailFarm({ params }: DetailFarmParams) {
  const { fermCode } = await params;
  return (
    <div className="p-5">
      <FarmInfo fermCode={fermCode} />
    </div>
  );
}
