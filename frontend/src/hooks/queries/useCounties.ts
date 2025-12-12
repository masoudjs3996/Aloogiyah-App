import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCounties, getCityAndVillage } from "@/lib/actions/city";
import { ICityAndVillage, ICounties } from "@/shared/types/city";

type FetchType = "counties" | "cityAndVillage";

type LocationDataMap = {
  counties: ICounties[];
  cityAndVillage: ICityAndVillage[];
};

export function useLocationData<T extends FetchType>(
  type: T,
  code?: string
): UseQueryResult<LocationDataMap[T] | null> {
  return useQuery<LocationDataMap[T] | null>({
    queryKey: [type, code],
    queryFn: (): Promise<LocationDataMap[T] | null> => {
      if (type === "counties")
        return getCounties(code!) as Promise<LocationDataMap[T] | null>;
      if (type === "cityAndVillage")
        return getCityAndVillage(code!) as Promise<LocationDataMap[T] | null>;
      return Promise.resolve(null);
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 2,
  });
}
