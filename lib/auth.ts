"use client";

import * as sesionApi from "./sesion";

export type Rol = "club" | "admin";
export interface Sesion { nombre: string; email: string; rol: Rol }

const CLAVE = "sportmatch_web_sesion";

export async function login(email: string, password: string): Promise<Sesion> {
  const sesion = await sesionApi.login(email, password);
  const segura: Sesion = { nombre: sesion.nombre, email: sesion.email, rol: sesion.rol };
  sessionStorage.setItem(CLAVE, JSON.stringify(segura));
  void import("./datos").then(({ refrescarDatos }) => refrescarDatos());
  return segura;
}

export function getSesion(): Sesion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLAVE);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Sesion>;
    if (typeof value.nombre !== "string" || typeof value.email !== "string" || (value.rol !== "club" && value.rol !== "admin")) return null;
    return { nombre: value.nombre, email: value.email, rol: value.rol };
  } catch { return null; }
}

export function olvidarSesion(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(CLAVE);
}

export function logout(): void {
  olvidarSesion();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("sportmatch_pago_pendiente");
    sessionStorage.removeItem("sportmatch_pago_checkout");
  }
  void import("./datos").then(({ reiniciarDatos }) => reiniciarDatos());
  if (typeof window !== "undefined") {
    void fetch("/api/sesion", { method: "DELETE", headers: { "x-requested-with": "sportmatch-web" }, credentials: "same-origin", cache: "no-store", keepalive: true }).catch(() => undefined);
  }
}
