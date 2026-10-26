"use client";

import dynamic from "next/dynamic";

// Leaflet usa window: se carga solo en el navegador.
const MapaUbicacion = dynamic(() => import("./MapaUbicacionLeaflet"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-xl bg-subtle" />,
});

export default MapaUbicacion;