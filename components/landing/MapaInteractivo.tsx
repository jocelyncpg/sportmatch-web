"use client";

import dynamic from "next/dynamic";
import MapaEjemplo from "./MapaEjemplo";

// Leaflet usa window: se carga solo en el navegador. Mientras tanto se muestra
// el mapa ilustrado (mismo tamaño), así la página no salta.
const MapaInteractivo = dynamic(() => import("./MapaLeafletLanding"), {
  ssr: false,
  loading: () => <MapaEjemplo />,
});

export default MapaInteractivo;