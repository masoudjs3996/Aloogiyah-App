"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType, ReactNode } from "react";
import type { LatLngExpression, Marker as LeafletMarker } from "leaflet";

import "leaflet/dist/leaflet.css";

import SelectFlag from "./selectFlag";
import { useQuery } from "@tanstack/react-query";
import { getMapSettings } from "@/shared/utils/map-service";
import DefaultFlag from "./defaultFlag";

/* -------------------- Types -------------------- */

export type MapPoint = {
  lat: number;
  lng: number;
};

export type Location = {
  id: string | number;
  name: string;
  lat?: number | null;
  lng?: number | null;
  regionId?: string;
  regionName?: string;
};

export type MapProps = {
  locations?: Location[];
  provinceName?: string;
  cityName?: string;
  villageName?: string;
  selectedLocation?: Location | null;

  onSelectLocation?: (location: Location) => void;
  onEdit?: (id: string | number) => void;
  onShowClasses?: (id: string | number) => void;

  pickLocation?: boolean;
  onConfirmLocation?: (point: MapPoint) => void;

  // پشتیبانی از پراپ‌های مپ قبلی الوگیاه
  position?: LatLngExpression;
  updatePosition?: (point: MapPoint) => void;
  isInModal?: boolean;
  isDetailAdvertiseView?: boolean;
  isAdvertiseView?: boolean;

  className?: string;
};

const iranBounds: [[number, number], [number, number]] = [
  [24.5, 44],
  [40, 63.5],
];

/*
 * Leaflet و ProvinceZoom فقط در مرورگر import می‌شوند.
 * بنابراین کد وابسته به window روی سرور اجرا نمی‌شود.
 */
const Map = dynamic<MapProps>(
  async () => {
    const [leafletModule, reactLeaflet, provinceZoomModule] = await Promise.all(
      [import("leaflet"), import("react-leaflet"), import("./ProvinceZoom")],
    );

    const L = leafletModule.default;

    const { TileLayer, Marker, Popup, useMap, useMapEvents } = reactLeaflet;
    const { LeafletProvider, createLeafletContext } =
      await import("@react-leaflet/core");

    const ProvinceZoom = provinceZoomModule.default;
    const MapSearch = (await import("./MapSearch")).default;
    const bounds = L.latLngBounds(iranBounds);

    /**
     * React-Leaflet's MapContainer creates the map in a callback ref. During
     * Next.js development remounts that callback can run against a reused DOM
     * node before Leaflet's previous instance has released it. Owning the map
     * in an effect gives setup/cleanup a strict, repeatable lifecycle.
     */
    function StableMapContainer({
      children,
      className,
      bounds: initialBounds,
      ...options
    }: {
      children: ReactNode;
      className?: string;
      bounds?: typeof iranBounds;
      [key: string]: unknown;
    }) {
      const containerRef = useRef<HTMLDivElement>(null);
      const [context, setContext] = useState<ReturnType<
        typeof createLeafletContext
      > | null>(null);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const map = L.map(container, options as L.MapOptions);
        if (initialBounds) map.fitBounds(initialBounds);

        setContext(createLeafletContext(map));

        return () => {
          map.remove();
          setContext(null);
        };
        // Map setup is intentionally tied to this container's lifecycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div ref={containerRef} className={className}>
          {context && (
            <LeafletProvider value={context}>{children}</LeafletProvider>
          )}
        </div>
      );
    }

    /* -------------------- Icons -------------------- */

    const createFlagIcon = (FlagComponent: ComponentType) =>
      L.divIcon({
        className: "custom-flag-icon",
        html: renderToStaticMarkup(<FlagComponent />),
        iconSize: [30, 30],
        iconAnchor: [30, 30],
        popupAnchor: [-15, -30],
      });

    const defaultIcon = createFlagIcon(DefaultFlag);
    const selectedIcon = createFlagIcon(SelectFlag);

    /* -------------------- Helpers -------------------- */

    function validPoint(
      point?: {
        lat?: number | null;
        lng?: number | null;
      } | null,
    ): MapPoint | null {
      if (point?.lat == null || point.lng == null) return null;

      const lat = Number(point.lat);
      const lng = Number(point.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      if (!bounds.contains([lat, lng])) return null;

      return { lat, lng };
    }

    function positionToPoint(position?: LatLngExpression): MapPoint | null {
      if (!position) return null;

      try {
        return validPoint(L.latLng(position));
      } catch {
        return null;
      }
    }

    /* -------------------- محدود کردن نقشه -------------------- */

    function IranMapLimits() {
      const map = useMap();

      useEffect(() => {
        const updateLimits = () => {
          const size = map.getSize();

          if (size.x <= 0 || size.y <= 0) return;

          const minZoom = map.getBoundsZoom(bounds, true);

          if (!Number.isFinite(minZoom)) return;

          map.setMinZoom(minZoom);
          map.setMaxBounds(bounds);

          if (map.getZoom() < minZoom) {
            map.setZoom(minZoom, { animate: false });
          }

          map.panInsideBounds(bounds, { animate: false });
        };

        updateLimits();
        map.on("resize", updateLimits);

        const observer = new ResizeObserver(() => {
          map.invalidateSize({ pan: false });
          updateLimits();
        });

        observer.observe(map.getContainer());

        return () => {
          map.off("resize", updateLimits);
          observer.disconnect();
        };
      }, [map]);

      return null;
    }

    /* -------------------- نمایش موقعیت موجود -------------------- */

    function MapController({ point }: { point: MapPoint | null }) {
      const map = useMap();

      const lat = point?.lat;
      const lng = point?.lng;

      useEffect(() => {
        if (lat == null || lng == null) return;

        map.flyTo(
          [lat, lng],
          Math.min(map.getMaxZoom(), Math.max(map.getZoom(), 15, map.getMinZoom())),
          {
            animate: true,
            duration: 1.2,
          },
        );
      }, [lat, lng, map]);

      return null;
    }

    /* -------------------- انتخاب موقعیت با کلیک -------------------- */

    function LocationPicker({ onPick }: { onPick: (point: MapPoint) => void }) {
      useMapEvents({
        click: ({ latlng }) => {
          const point = validPoint(latlng);

          if (point) onPick(point);
        },
      });

      return null;
    }

    /* -------------------- پرچم و تأیید موقعیت -------------------- */

    function PickedLocationMarker({
      point,
      confirmed,
      onConfirm,
    }: {
      point: MapPoint;
      confirmed: boolean;
      onConfirm?: (point: MapPoint) => void;
    }) {
      const markerRef = useRef<LeafletMarker | null>(null);

      useEffect(() => {
        if (!confirmed) markerRef.current?.openPopup();
      }, [point.lat, point.lng, confirmed]);

      return (
        <Marker
          ref={markerRef}
          position={[point.lat, point.lng]}
          icon={selectedIcon}
          zIndexOffset={1000}
          bubblingMouseEvents={false}
        >
          <Popup closeOnClick={false}>
            <div dir="rtl" className="flex flex-col items-center gap-2 p-1">
              <span dir="ltr" className="text-xs text-gray-600">
                {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
              </span>

              {confirmed ? (
                <span className="font-bold text-green-600">
                  موقعیت انتخاب شد
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!onConfirm}
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={(event) => {
                    event.stopPropagation();

                    if (!onConfirm) return;

                    onConfirm(point);
                    markerRef.current?.closePopup();
                  }}
                >
                  ثبت موقعیت
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      );
    }

    /* -------------------- کامپوننت اصلی -------------------- */

    function MapClient({
      locations = [],
      selectedLocation,
      onSelectLocation,
      provinceName,
      cityName,
      villageName,
      onEdit,
      onShowClasses,
      pickLocation,
      onConfirmLocation,
      position,
      updatePosition,
      isInModal = false,
      isAdvertiseView = false,
      isDetailAdvertiseView = false,
      className = "h-[400px] md:h-[550px] lg:h-[600px]",
    }: MapProps) {
      const canPick = pickLocation ?? isAdvertiseView;

      const interactive =
        canPick || isInModal || (!isDetailAdvertiseView && !position);

      const [pickedPoint, setPickedPoint] = useState<MapPoint | null>(null);

      const [confirmed, setConfirmed] = useState(false);
      const [gpsError, setGpsError] = useState("");
      const [locating, setLocating] = useState(false);
      const settings = useQuery({
        queryKey: ["map-settings"],
        queryFn: getMapSettings,
        staleTime: 60000,
        retry: false,
        refetchInterval: (query) => query.state.status === "error" ? 10000 : false,
        refetchOnWindowFocus: false,
      });
      const [tileAttempt, setTileAttempt] = useState(0);
      const [tilesReady, setTilesReady] = useState(false);
      const tileLoaded = useRef(false);
      const [satellite, setSatellite] = useState(true);
      const tileSource = settings.data ? { ...settings.data, ...(satellite ? {
        tileUrl: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxZoom: 19,
      } : {}) } : undefined;

      const existingPoint =
        validPoint(selectedLocation) || positionToPoint(position);

      const existingLat = existingPoint?.lat;
      const existingLng = existingPoint?.lng;

      const confirmCallback = onConfirmLocation ?? updatePosition;

      const hasPlaceName = Boolean(provinceName || cityName || villageName);

      // تغییر محدوده یا موقعیت ورودی، انتخاب موقت را پاک می‌کند.
      useEffect(() => {
        setPickedPoint(null);
        setConfirmed(false);
        setGpsError("");
      }, [
        canPick,
        provinceName,
        cityName,
        villageName,
        existingLat,
        existingLng,
      ]);

      useEffect(() => {
        tileLoaded.current = false;
        setTilesReady(false);
        if (!settings.data) return;
        const timer = window.setInterval(() => {
          if (tileLoaded.current) return;
          setTileAttempt((attempt) => attempt + 1);
        }, 16000);
        return () => window.clearInterval(timer);
      }, [satellite, settings.data, tileAttempt]);

      function handlePick(point: MapPoint) {
        setPickedPoint(point);
        setConfirmed(true);
        confirmCallback?.(point);
        setGpsError("");
      }

      function getUserLocation() {
        if (!navigator.geolocation) {
          setGpsError("مرورگر شما دریافت موقعیت را پشتیبانی نمی‌کند");
          return;
        }

        setLocating(true);
        setGpsError("");

        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            setLocating(false);

            const point = validPoint({
              lat: coords.latitude,
              lng: coords.longitude,
            });

            if (!point) {
              setGpsError("موقعیت دریافت‌شده خارج از محدوده نقشه است");
              return;
            }

            handlePick(point);
          },
          () => {
            setLocating(false);
            setGpsError("امکان دریافت موقعیت مکانی وجود ندارد");
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          },
        );
      }

      const selectedIsListed = locations.some(
        (location) =>
          location.id === selectedLocation?.id && validPoint(location),
      );

      const showExistingMarker =
        existingPoint && !pickedPoint && !selectedIsListed;

      return (
        <div
          className={`iran-map isolate flex w-full flex-col overflow-hidden rounded-2xl ${className}`}
        >
          <style>{`
            .iran-map .custom-flag-icon {
              background: transparent !important;
              border: none !important;
            }

            .iran-map .custom-flag-icon svg {
              display: block;
              width: 30px;
              height: 30px;
            }
          `}</style>

          <div className="flex shrink-0 gap-1 bg-white p-2" dir="rtl" role="group" aria-label="نوع نقشه">
            <button type="button" aria-pressed={satellite} onClick={() => setSatellite(true)} className={`rounded-lg px-3 py-2 text-sm ${satellite ? "bg-emerald-700 text-white" : "text-gray-700"}`}>ماهواره‌ای</button>
            <button type="button" aria-pressed={!satellite} onClick={() => setSatellite(false)} className={`rounded-lg px-3 py-2 text-sm ${!satellite ? "bg-emerald-700 text-white" : "text-gray-700"}`}>نقشه</button>
          </div>
          <div className="relative min-h-0 flex-1">
          <StableMapContainer
            bounds={iranBounds}
            maxBounds={iranBounds}
            maxBoundsViscosity={1}
            maxZoom={18}
            scrollWheelZoom={interactive}
            dragging={interactive}
            zoomControl={interactive}
            doubleClickZoom={interactive}
            touchZoom={interactive}
            boxZoom={interactive}
            keyboard={interactive}
            className="z-0 h-full w-full"
          >
            {tileSource && (
              <TileLayer
                key={tileSource.tileUrl + tileAttempt}
                noWrap
                maxZoom={Math.min(18, tileSource.maxZoom)}
                url={tileSource.tileUrl}
                referrerPolicy="strict-origin-when-cross-origin"
                attribution={tileSource.attribution}
                eventHandlers={{
                  loading: () => {
                    tileLoaded.current = false;
                    setTilesReady(false);
                  },
                  tileload: () => {
                    tileLoaded.current = true;
                    setTilesReady(true);
                  },
                }}
              />
            )}

            <IranMapLimits />

            <ProvinceZoom
              provinceName={provinceName}
              cityName={cityName}
              villageName={villageName}
              enabled={
                hasPlaceName &&
                !pickedPoint &&
                !existingPoint &&
                !!tileSource?.searchEnabled
              }
            />
            {canPick && (
              <MapSearch
                city={cityName || villageName}
                enabled={!!tileSource?.searchEnabled}
              />
            )}

            <MapController point={pickedPoint ?? existingPoint} />

            {canPick && <LocationPicker onPick={handlePick} />}

            {canPick && pickedPoint && (
              <PickedLocationMarker
                point={pickedPoint}
                confirmed={confirmed}
                onConfirm={undefined}
              />
            )}

            {showExistingMarker && (
              <Marker
                position={[existingPoint.lat, existingPoint.lng]}
                icon={selectedIcon}
              />
            )}

            {(!pickedPoint ? locations : []).map((location) => {
              const point = validPoint(location);

              if (!point) return null;

              const isSelected = selectedLocation?.id === location.id;

              return (
                <Marker
                  key={location.id}
                  position={[point.lat, point.lng]}
                  title={location.name}
                  icon={isSelected ? selectedIcon : defaultIcon}
                  bubblingMouseEvents={false}
                  eventHandlers={{
                    click: () => onSelectLocation?.(location),
                  }}
                >
                  <Popup>
                    <div dir="rtl" className="flex flex-col gap-3 p-1">
                      <span className="font-bold">{location.name}</span>

                      {onEdit && (
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-700 px-3 py-2 text-white transition hover:bg-emerald-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(location.id);
                          }}
                        >
                          ویرایش موقعیت
                        </button>
                      )}

                      {onShowClasses && (
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-700 px-3 py-2 text-white transition hover:bg-emerald-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            onShowClasses(location.id);
                          }}
                        >
                          مشاهده لیست کلاس‌ها
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </StableMapContainer>

          {!tilesReady && (
            <div
              className="pointer-events-none absolute bottom-8 left-1/2 z-[900] -translate-x-1/2 rounded-lg bg-white/95 px-3 py-1 text-xs font-medium text-slate-600 shadow"
              dir="rtl"
            >
              در حال بارگذاری نقشه...
            </div>
          )}

          {canPick && !pickedPoint && !tileSource?.searchEnabled && (
            <div
              dir="rtl"
              className="pointer-events-none absolute right-3 top-3 z-[1000] max-w-[80%] rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm"
            >
              با کلیک روی نقشه، موقعیت بلافاصله انتخاب و به‌روز می‌شود.
            </div>
          )}

          {canPick && (
            <button
              type="button"
              disabled={locating}
              onClick={getUserLocation}
              className="absolute bottom-8 left-3 z-[1000] rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow disabled:opacity-50"
            >
              {locating ? "در حال دریافت موقعیت..." : "موقعیت من"}
            </button>
          )}

          {gpsError && (
            <div
              role="alert"
              dir="rtl"
              className="absolute bottom-8 right-3 z-[1000] max-w-[70%] rounded-lg bg-white px-3 py-2 text-sm text-red-600 shadow"
            >
              {gpsError}
            </div>
          )}

          </div>
        </div>
      );
    }

    return MapClient;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
        در حال بارگذاری نقشه...
      </div>
    ),
  },
);

export default Map;
