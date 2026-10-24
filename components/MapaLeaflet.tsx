"use client";

import { useEffect, useRef, useState } from "react";
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

  // Leaflet no tolera montarse, destruirse y montarse otra vez sobre el mismo contenedor
  // (Strict Mode, HMR, y las páginas que Next oculta con cacheComponents).
  // Solución: el mapa existe solo mientras el componente está montado y cada montaje usa una key nueva.
  const [instancia, setInstancia] = useState(0);
  const contador = useRef(0);

  useEffect(() => {
    contador.current += 1;
    setInstancia(contador.current);
    return () => setInstancia(0);
  }, []);

  return (
    <div
      style={{ height: alto }}
      className={`overflow-hidden rounded-xl border border-border ${tema === "dark" ? "mapa-oscuro" : ""}`}
    >
      {instancia === 0 ? (
        <div className="h-full w-full animate-pulse bg-subtle" />
      ) : (
        <MapContainer
          key={instancia}
          center={centro}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
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
      )}
    </div>
  );
}