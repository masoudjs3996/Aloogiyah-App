import { ICreateFarmResponse } from "@/shared/types/farm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import Link from "next/link";

const FarmCard = ({ farm }: { farm: ICreateFarmResponse }) => {

  return (
    <Link href={`/farm/${farm?.code}`}>
      <div className="space-y-4 p-4 hover:scale-105 duration-500">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="relative h-28 w-full overflow-hidden rounded-t-2xl">
            {farm?.imageUrl && (
              <Image
                src={getImageUrl(farm?.imageUrl) ?? ""}
                alt={farm.name}
                fill
                className="object-cover"
              />
            )}

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gray-200 border-4 border-white" />
          </div>
          <div className="pt-10 px-4 pb-4 text-center space-y-1">
            <p className="text-sm font-bold text-gray-900">{farm.name}</p>
            <p className="text-xs text-gray-500">{farm?.address?.countyName}</p>
            <div className="flex justify-center items-center gap-1 text-xs text-gray-600">
              <span className="text-black">★</span>
              <span className="font-medium">{farm.description}</span>
              <span className="text-gray-400">
                ({farm.capacity.toLocaleString()})
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FarmCard;
