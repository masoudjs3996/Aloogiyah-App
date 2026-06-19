"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { FaLocationCrosshairs } from "react-icons/fa6";
import Button from "@/design-system/atoms/Button";

/* -------------------- Types -------------------- */

interface MapProps {
  position: LatLngExpression;
  updatePosition?: (pos: { lat: number; lng: number }) => void;
  isInModal?: boolean;
  isDetailAdvertiseView?: boolean;
  isAdvertiseView?: boolean;
}

/* -------------------- Helpers -------------------- */

function SetMapView({ location }: { location: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(location, map.getZoom());
  }, [location, map]);

  return null;
}

function ClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

/* -------------------- Component -------------------- */

export default function Map({
  position,
  updatePosition = () => {},
  isInModal = false,
  isAdvertiseView = false,
}: MapProps) {
  const [selectedLocation, setSelectedLocation] =
    useState<LatLngExpression>(position);
  const [showAlert, setShowAlert] = useState(false);

  const markerRef = useRef<any>(null);

  /* ----------- Geolocation ----------- */
  const getUserLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setSelectedLocation(newLocation);
        updatePosition(newLocation);
      },
      () => alert("امکان دریافت موقعیت مکانی وجود ندارد"),
    );
  };

  const confirmLocation = () => {
    const [lat, lng] = Array.isArray(selectedLocation)
      ? selectedLocation
      : [selectedLocation.lat, selectedLocation.lng];

    updatePosition({ lat, lng });
    setShowAlert(false);
  };

  return (
    <>
      {/* تایید لوکیشن */}
      {isAdvertiseView && showAlert && (
        <div className="absolute top-2 right-2 z-[1000] bg-white rounded-md p-3 flex gap-3">
          <p className="text-sm text-gray-600">آیا این موقعیت ثبت شود؟</p>
          <Button onClick={confirmLocation}>ثبت مکان </Button>
        </div>
      )}

      {/* دکمه GPS */}
      {isAdvertiseView && (
        <FaLocationCrosshairs
          className="absolute bottom-3 left-3 z-[1000] w-8 h-8 cursor-pointer"
          onClick={getUserLocation}
        />
      )}

      <MapContainer
        key="leaflet-map"
        center={selectedLocation}
        zoom={13}
        scrollWheelZoom={isAdvertiseView || isInModal}
        dragging={isAdvertiseView || isInModal}
        zoomControl={isAdvertiseView || isInModal}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        {isAdvertiseView && (
          <ClickHandler
            onSelect={(lat, lng) => {
              setSelectedLocation({ lat, lng });
              setShowAlert(true);
            }}
          />
        )}

        <Marker position={selectedLocation} ref={markerRef} />

        <SetMapView location={selectedLocation} />
      </MapContainer>
    </>
  );
}
