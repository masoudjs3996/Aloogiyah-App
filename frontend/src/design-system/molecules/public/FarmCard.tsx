import Image from "next/image";
import Link from "next/link";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { getImageUrl } from "@/shared/utils/getImageUrl";

type FarmCardProps = {
  farm: {
    farmCode: string;
    farmName: string;
    description: string;
    farmImageUrl?: string;
    userFullName: string;
    userImageUrl?: string;
    address?: {
      provinceName?: string;
      countyName?: string;
      cityName?: string;
    };
  };
};

const FarmCard = ({ farm }: FarmCardProps) => (
  <Link
    href={`/farm/${encodeURIComponent(farm.farmCode)}`}
    className="group block h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
  >
    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100 sm:h-48">
      {farm.farmImageUrl && (
        <Image
          src={getImageUrl(farm.farmImageUrl)}
          alt={farm.farmName}
          fill
          sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
      {farm.address && (
        <span className="absolute bottom-3 right-3 inline-flex max-w-[85%] items-center gap-1 truncate rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-700 backdrop-blur">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
          {[farm.address.cityName, farm.address.countyName, farm.address.provinceName]
            .filter(Boolean)
            .join("، ")}
        </span>
      )}
    </div>
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-50 shadow-sm">
          {farm.userImageUrl && (
            <Image
              src={getImageUrl(farm.userImageUrl)}
              alt={farm.userFullName || "فروشنده"}
              fill
              sizes="44px"
              className="object-cover"
            />
          )}
          {!farm.userImageUrl && <span className="text-sm font-bold text-emerald-700">{farm.userFullName?.slice(0, 1) || "م"}</span>}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-900 group-hover:text-emerald-800">
            {farm.farmName}
          </h3>
          <p className="mt-1 truncate text-xs text-slate-500">
            فروشنده: {farm.userFullName || "مزرعه الو گیاه"}
          </p>
        </div>
      </div>
      <p className="line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
        {farm.description || "برای آشنایی با مزرعه و محصولات آن وارد صفحه شوید."}
      </p>
      <span className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-emerald-700">
        آشنایی با مزرعه
        <span aria-hidden="true">←</span>
      </span>
    </div>
  </Link>
);

export default FarmCard;
