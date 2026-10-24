"use client";

import { useSyncExternalStore } from "react";

const suscribir = () => () => {};

// En el prerender se usa el año de respaldo; en el navegador se corrige al año actual.
// (Next 16 no permite new Date() directo en un componente de servidor.)
export default function AnioActual({ respaldo = 2026 }: { respaldo?: number }) {
  const anio = useSyncExternalStore(
    suscribir,
    () => new Date().getFullYear(),
    () => respaldo,
  );
  return <>{anio}</>;
}