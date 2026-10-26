"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useTheme } from "@/lib/theme";

export type Coord = [number, number];

// Mosaicos estándar de OpenStreetMap (gratis, sin API key). En modo oscuro se invierten con CSS (.mapa-oscuro).
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function Clics({ onElegir }: { onElegir: (c: Coord) => void }) {
  useMapEvents({
    click: (e) => onElegir([Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))]),
  });
  return null;
}

// Centra el mapa cuando cambia el punto de foco (por ejemplo al elegir otra comuna).
function Enfocar({ foco, zoom }: { foco: Coord; zoom: number }) {
  const map = useMap();
  const [lat, lng] = foco;
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

export default function MapaUbicacionLeaflet({
  foco,
  pin,
  onElegir,
  zoom = 15,
  alto = 320,
}: {
  /** Hacia dónde mira el mapa. */
  foco: Coord;
  /** Punto marcado; sin él solo se ve el mapa. */
  pin: Coord | null;
  /** Si se entrega, tocar el mapa marca la ubicación. Sin esto el mapa es de solo lectura. */
  onElegir?: (c: Coord) => void;
  zoom?: number;
  alto?: number;
}) {
  const { tema } = useTheme();
  const color = tema === "dark" ? "#9061f9" : "#7c3aed";

  return (
    <div
      style={{ height: alto }}
      className={`overflow-hidden rounded-xl border border-border ${tema === "dark" ? "mapa-oscuro" : ""} ${
        onElegir ? "[&_.leaflet-container]:cursor-crosshair" : ""
      }`}
    >
      <MapContainer center={foco} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url={TILES}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Enfocar foco={foco} zoom={zoom} />
        {onElegir ? <Clics onElegir={onElegir} /> : null}
        {pin ? (
          <CircleMarker
            center={pin}
            radius={11}
            pathOptions={{
              color: tema === "dark" ? "#0b0f19" : "#ffffff",
              weight: 3,
              fillColor: color,
              fillOpacity: 0.95,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}