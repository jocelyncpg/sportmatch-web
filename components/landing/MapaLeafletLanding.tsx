"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import MapaEjemplo from "./MapaEjemplo";

// Mapa de ejemplo para la portada. Usa los mismos mosaicos de OpenStreetMap que el panel
// (gratis, sin API key). Los puntos y la ruta son inventados: solo ilustran la idea.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CENTRO: [number, number] = [-33.4345, -70.6385];

const RUTA: [number, number][] = [
  [-33.4392, -70.6585],
  [-33.4372, -70.6506],
  [-33.4352, -70.6455],
  [-33.4338, -70.6398],
  [-33.4318, -70.6335],
  [-33.4292, -70.6272],
  [-33.4268, -70.6215],
];

const PERSONAS = [
  { texto: "Ciclismo · 1,2 km", coord: [-33.4309, -70.6366] as [number, number] },
  { texto: "Running · 0,8 km", coord: [-33.4405, -70.6502] as [number, number] },
  { texto: "Escalada · 2,4 km", coord: [-33.4262, -70.6168] as [number, number] },
];

const TU: [number, number] = [-33.4352, -70.6455];

export default function MapaLeafletLanding() {
  // El mapa se crea solo cuando el componente está montado. Si la página se oculta y
  // se vuelve a mostrar (al cerrar sesión), el mapa viejo se destruye y se crea uno nuevo
  // con otra "key"; así Leaflet nunca reutiliza un contenedor ya destruido.
  const [montaje, setMontaje] = useState(0);

  useEffect(() => {
    setMontaje((n) => n + 1);
    return () => setMontaje(0);
  }, []);

  if (montaje === 0) return <MapaEjemplo />;

  return (
    <figure>
      <div
        role="img"
        aria-label="Mapa de ejemplo con una ruta y tres personas cercanas que practican ciclismo, running y escalada"
        className="aspect-[5/4] overflow-hidden rounded-2xl border border-slate-200 shadow-sm [&_.leaflet-tile-pane]:grayscale-[0.9] [&_.leaflet-tile-pane]:contrast-[0.85] [&_.leaflet-tile-pane]:brightness-[1.1]"
      >
        <MapContainer
          key={montaje}
          center={CENTRO}
          zoom={window.innerWidth < 640 ? 13 : 14}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url={TILES}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Polyline
            positions={RUTA}
            pathOptions={{ color: "#ffffff", weight: 11, opacity: 0.95 }}
          />
          <Polyline
            positions={RUTA}
            pathOptions={{ color: "#7C3AED", weight: 6, lineCap: "round" }}
          />
          {PERSONAS.map((p) => (
            <CircleMarker
              key={p.texto}
              center={p.coord}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#7C3AED",
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                <strong>{p.texto}</strong>
              </Tooltip>
            </CircleMarker>
          ))}
          <CircleMarker
            center={TU}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#2563EB",
              fillOpacity: 1,
            }}
          />
        </MapContainer>
      </div>
      <figcaption className="mt-3 text-sm text-slate-500">
        Ilustración de ejemplo. No muestra ubicaciones ni personas reales.
      </figcaption>
    </figure>
  );
}