import { leafletJs, leafletCss, leafletIcons } from "../vendor/leafletBundle";
import type { Point } from "../types/mobile";
import type { MapSettings } from "./map-service";
import { createTileLayers } from "./mapTileLayers";
export function validPoint(point?: Point | null): point is Point {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}
export function createMapHtml(
  value: Point | null | undefined,
  interactive: boolean,
  bridge: "native" | "web" = "native",
  settings?: MapSettings,
) {
  const point = validPoint(value)
    ? value
    : { latitude: 35.6998616, longitude: 51.3488777 };
  const marker = validPoint(value)
    ? `L.marker([${point.latitude},${point.longitude}]).addTo(map)`
    : "null";
  const post =
    bridge === "native"
      ? "window.ReactNativeWebView.postMessage(JSON.stringify(point));"
      : "parent.postMessage({...point,kind:'aloogiyah-map'},'*');";
  const tiles = settings ? createTileLayers(settings) : "";
  return `<!doctype html><html><head><meta name="referrer" content="strict-origin-when-cross-origin"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>${leafletCss}</style><style>html,body,#map{height:100%;margin:0}.leaflet-control-attribution{font-size:11px;background:white}</style></head><body><div id="map"></div><script>${leafletJs}</script><script>L.Icon.Default.imagePath='';L.Icon.Default.mergeOptions({iconUrl:${JSON.stringify(leafletIcons["marker-icon.png"])},iconRetinaUrl:${JSON.stringify(leafletIcons["marker-icon-2x.png"])},shadowUrl:${JSON.stringify(leafletIcons["marker-shadow.png"])}});const map=L.map('map').setView([${point.latitude},${point.longitude}],${validPoint(value) ? 14 : 11});${tiles}let marker=${marker};window.focusPlace=(lat,lng)=>map.setView([lat,lng],16);window.addEventListener('message',e=>{const p=e.data;if(e.source===parent&&(p?.kind==='aloogiyah-focus'||p?.kind==='aloogiyah-point')&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180){if(p.kind==='aloogiyah-point')window.movePoint(p.latitude,p.longitude);else window.focusPlace(p.latitude,p.longitude);}});window.movePoint=(lat,lng)=>{if(marker)marker.setLatLng([lat,lng]);else marker=L.marker([lat,lng]).addTo(map);if(!map.getBounds().contains([lat,lng]))map.panTo([lat,lng]);};${interactive ? `map.on('click',e=>{window.movePoint(e.latlng.lat,e.latlng.lng);const point={latitude:e.latlng.lat,longitude:e.latlng.lng};${post}});` : ""}${bridge === "native" ? "window.ReactNativeWebView.postMessage('ready');" : ""}</script></body></html>`;
}
