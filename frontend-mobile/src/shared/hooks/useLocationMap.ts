import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMapSettings, searchMap, type MapPlace } from "../utils/map-service";

export function useLocationMap(placeQuery?: string, hasPoint = false) {
  const settings = useQuery({
    queryKey: ["map-settings"],
    queryFn: getMapSettings,
    staleTime: 60000,
    retry: false,
    refetchInterval: (query) => query.state.status === "error" ? 10000 : false,
    refetchOnWindowFocus: false,
  });
  const [focus, setFocus] = useState<MapPlace | null>(null);
  useEffect(() => {
    if (!placeQuery || hasPoint || !settings.data?.searchEnabled) return;
    const controller = new AbortController();
    void searchMap(placeQuery, controller.signal)
      .then((places) => {
        if (!controller.signal.aborted && places[0]) setFocus(places[0]);
      })
      .catch(() => {
        /* Picking a point still works if automatic zoom is unavailable. */
      });
    return () => controller.abort();
  }, [placeQuery, hasPoint, settings.data?.searchEnabled]);
  return { settings, focus, setFocus };
}
