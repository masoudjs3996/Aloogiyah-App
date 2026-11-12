import { request } from "@/lib/actions/platform";
export type MapSettings = {
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  searchEnabled: boolean;
};
export type MapPlace = {
  name: string;
  latitude: number;
  longitude: number;
  bounds: number[];
};
export const getMapSettings = () => request<MapSettings>("/Map/Config");
export const searchMap = (q: string, signal?: AbortSignal) =>
  request<MapPlace[]>("/Map/Search", { params: { q }, signal, timeout: 30000 });
