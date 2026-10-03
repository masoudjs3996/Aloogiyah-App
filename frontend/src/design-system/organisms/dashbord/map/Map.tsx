"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType } from "react";
import type { LatLngExpression, Marker as LeafletMarker } from "leaflet";

import "leaflet/dist/leaflet.css";

import SelectFlag from "./selectFlag";
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

    const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } =
      reactLeaflet;

    const ProvinceZoom = provinceZoomModule.default;
    const bounds = L.latLngBounds(iranBounds);

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
          Math.min(map.getMaxZoom(), Math.max(15, map.getMinZoom())),
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
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
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

      function handlePick(point: MapPoint) {
        setPickedPoint(point);
        setConfirmed(false);
        setGpsError("");
      }

      function handleConfirm(point: MapPoint) {
        if (!confirmCallback) return;

        confirmCallback(point);
        setConfirmed(true);
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
          className={`iran-map relative isolate w-full overflow-hidden rounded-2xl ${className}`}
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

          <MapContainer
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
            <TileLayer
              noWrap
              maxZoom={18}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <IranMapLimits />

            <ProvinceZoom
              provinceName={provinceName}
              cityName={cityName}
              villageName={villageName}
              enabled={hasPlaceName && !pickedPoint}
            />

            <MapController
              point={pickedPoint ?? (hasPlaceName ? null : existingPoint)}
            />

            {canPick && <LocationPicker onPick={handlePick} />}

            {canPick && pickedPoint && (
              <PickedLocationMarker
                point={pickedPoint}
                confirmed={confirmed}
                onConfirm={confirmCallback ? handleConfirm : undefined}
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
                          className="rounded-lg bg-blue-600 px-3 py-2 text-white"
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
                          className="rounded-lg bg-blue-600 px-3 py-2 text-white"
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
          </MapContainer>

          {canPick && !pickedPoint && (
            <div
              dir="rtl"
              className="pointer-events-none absolute right-3 top-3 z-[1000] max-w-[80%] rounded-xl border border-red-400 bg-white px-3 py-2 text-sm font-bold text-red-600 shadow"
            >
              روی نقشه کلیک کنید و «ثبت موقعیت» را بزنید.
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
