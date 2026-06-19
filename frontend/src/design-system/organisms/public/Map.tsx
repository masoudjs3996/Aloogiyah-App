"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvent,
} from "react-leaflet";
import type { LatLngLiteral, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Button from "@/design-system/atoms/Button";
import { FaLocationCrosshairs } from "react-icons/fa6";

/* =======================
   Types
======================= */

interface MapProps {
  position: LatLngLiteral;
  updatePosition?: (location: LatLngLiteral) => void;
  isInModal?: boolean;
  isDetailAdvertiseView?: boolean;
  isAdvertiseView?: boolean;
}

/* =======================
   Component
======================= */

const Map: React.FC<MapProps> = ({
  position,
  updatePosition = () => {},
  isInModal = false,
  isDetailAdvertiseView = false,
  isAdvertiseView = false,
}) => {
  const [selectedLocation, setSelectedLocation] =
    useState<LatLngLiteral>(position);

  const [showAlert, setShowAlert] = useState<boolean>(false);

  const markerRef = useRef<L.Marker | null>(null);

  /* =======================
     Get User Location
  ======================= */

  const getUserLocation = (): void => {
    if (!navigator.geolocation) {
      alert("مرورگر شما از قابلیت موقعیت‌یابی پشتیبانی نمی‌کند!");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation: LatLngLiteral = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setSelectedLocation(newLocation);
        updatePosition(newLocation);
      },
      (error) => {
        console.error("خطا در دریافت موقعیت مکانی:", error);
        alert("امکان دریافت موقعیت مکانی وجود ندارد!");
      },
    );
  };

  /* =======================
     Set Map View
  ======================= */

  const SetMapView: React.FC<{ location: LatLngLiteral }> = ({ location }) => {
    const map = useMap();

    useEffect(() => {
      if (location) {
        map.setView(location, 15);
      }
    }, [location, map]);

    return null;
  };

  /* =======================
     Click Handler
  ======================= */

  const HandlerClick: React.FC = () => {
    useMapEvent("click", (e: LeafletMouseEvent) => {
      const newLocation: LatLngLiteral = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      setSelectedLocation(newLocation);
      setShowAlert(true);
    });

    return null;
  };

  /* =======================
     Select Location
  ======================= */

  const selectLocation = (): void => {
    updatePosition(selectedLocation);
    setShowAlert(false);
  };

  /* =======================
     Marker Icon
  ======================= */

  const customIcon = new L.Icon({
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const maxBounds: [[number, number], [number, number]] = [
    [-90, -180],
    [90, 180],
  ];

  /* =======================
     Render
  ======================= */

  return (
    <>
      {isAdvertiseView && showAlert && (
        <div
          className="z-[100000] h-[60px] bg-white px-4 absolute top-1 right-3 w-[60%] flex justify-center items-center rounded-md"
          dir="rtl"
        >
          <p className="w-[75%] text-[14px] text-slate-400 font-bold">
            آیا می‌خواهید لوکیشن مورد نظر شما اینجا باشد؟
          </p>
          <div className="w-[25%]">
            <Button onClick={selectLocation}>ثبت مکان</Button>
          </div>
        </div>
      )}

      {isAdvertiseView && (
        <div className="absolute bottom-2 left-2 z-[1000]">
          <FaLocationCrosshairs
            className="w-[30px] h-[30px] text-slate-600 cursor-pointer"
            onClick={getUserLocation}
          />
        </div>
      )}

      <MapContainer
        center={selectedLocation}
        scrollWheelZoom={isAdvertiseView || isInModal}
        dragging={isAdvertiseView || isInModal}
        zoomControl={isAdvertiseView || isInModal}
        doubleClickZoom={isAdvertiseView}
        boxZoom={isAdvertiseView}
        keyboard={isAdvertiseView}
        minZoom={2}
        maxZoom={18}
        maxBounds={maxBounds}
        maxBoundsViscosity={1.0}
        style={{
          height: "100%",
          width: "100%",
          zIndex: 1,
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        {isAdvertiseView && <HandlerClick />}

        <Marker position={selectedLocation} ref={markerRef} icon={customIcon} />

        <SetMapView location={selectedLocation} />
      </MapContainer>
    </>
  );
};

export default Map;
