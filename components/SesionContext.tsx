"use client";

import { createContext, useContext } from "react";
import type { Rol, Sesion } from "@/lib/auth";

export const SesionCtx = createContext<Sesion | null>(null);

export function useSesion(): Sesion {
  const s = useContext(SesionCtx);
  if (!s) throw new Error("useSesion debe usarse dentro del panel");
  return s;
}

// Muestra el contenido solo a los roles permitidos (HU-31: exclusivo para rol club; HU-47/45/48: exclusivo para admin).
export function SoloRol({ roles, children }: { roles: Rol[]; children: React.ReactNode }) {
  const s = useSesion();
  if (!roles.includes(s.rol)) {
    const texto = roles.includes("club")
      ? "Esta sección es solo para cuentas de club."
      : "Esta sección es solo para la administración de la plataforma.";
    return (
      <div className="rounded-[18px] border border-border bg-card p-6">
        <p className="font-bold">Sin permiso</p>
        <p className="mt-1 text-sm text-muted">{texto}</p>
      </div>
    );
  }
  return <>{children}</>;
}