import { FarmDetail } from "@/design-system/organisms/public";
import { GetMyFarmDetail } from "@/lib/actions/farm";
import { PageParams } from "@/shared/types/general";
type DetailFarmParams = PageParams<"farmId">;

const DetailFarmPage = async ({ params }: DetailFarmParams) => {
  const { farmId } = await params;
  //   const detailFarm = await GetMyFarmDetail(farmId);
  //   console.log(detailFarm);

  return (
    <>
      <FarmDetail farmId={farmId} />
    </>
  );
};

export default DetailFarmPage;
