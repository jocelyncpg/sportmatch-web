"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { useTheme } from "@/lib/theme";

export interface Punto {
  id: string;
  nombre: string;
  detalle?: string;
  coord: [number, number];
  /** tamaño relativo del círculo (1 = normal) */
  peso?: number;
  destacado?: boolean;
}

// Mosaicos estándar de OpenStreetMap (gratis, sin API key). En modo oscuro se invierten con CSS (.mapa-oscuro).
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function MapaLeaflet({
  puntos,
  centro,
  zoom = 11,
  alto = 320,
}: {
  puntos: Punto[];
  centro: [number, number];
  zoom?: number;
  alto?: number;
}) {
  const { tema } = useTheme();
  const color = tema === "dark" ? "#9061f9" : "#7c3aed";

  return (
    <div style={{ height: alto }} className={`overflow-hidden rounded-xl border border-border ${tema === "dark" ? "mapa-oscuro" : ""}`}>
      <MapContainer center={centro} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url={TILES}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {puntos.map((p) => (
          <CircleMarker
            key={p.id}
            center={p.coord}
            radius={Math.round(8 * (p.peso ?? 1))}
            pathOptions={{
              color: tema === "dark" ? "#0b0f19" : "#ffffff",
              weight: 2,
              fillColor: color,
              fillOpacity: p.destacado === false ? 0.45 : 0.85,
            }}
          >
            <Tooltip direction="top">
              <strong>{p.nombre}</strong>
              {p.detalle ? <div>{p.detalle}</div> : null}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}