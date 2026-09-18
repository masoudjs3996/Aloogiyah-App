import { FarmCard } from "@/design-system/molecules/public";
import { GetFarmsByFilter } from "@/lib/actions/farm";

export default async function Farm() {
  const farmRes = await GetFarmsByFilter();
  const farms = farmRes?.data;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4  my-10">
      {farms?.map((farm: any) => {
        return <FarmCard key={farm.description} farm={farm} />;
      })}
    </div>
  );
}
