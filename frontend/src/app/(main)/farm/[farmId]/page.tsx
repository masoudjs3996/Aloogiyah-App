import { FarmProfile } from "@/design-system/organisms/platform/FarmsWorkspace";
import { detailCodeOrNotFound, detailMetadata, loadPublicFarm } from "@/lib/actions/public-detail";
import { publicDetailPath } from "@/shared/utils/public-detail-path";

type Props = { params: Promise<{ farmId: string }> };

export async function generateMetadata({ params }: Props) {
  const farm = await loadPublicFarm(detailCodeOrNotFound((await params).farmId));
  const city = farm.address?.cityName || farm.address?.countyName;
  const location = city ? ` در ${city}` : "";
  return detailMetadata(
    `${farm.name} | محصولات مزرعه و خرید مستقیم`,
    `با ${farm.name}${location} آشنا شوید و محصولات، واحدهای فروش و شرایط خرید از این مزرعه را ببینید.`,
    publicDetailPath("farm", farm.code, farm.name),
    farm.imageUrl,
  );
}

export default async function Page({ params }: Props) {
  const farm = await loadPublicFarm(detailCodeOrNotFound((await params).farmId));
  return <FarmProfile code={farm.code} initialFarm={farm} />;
}
