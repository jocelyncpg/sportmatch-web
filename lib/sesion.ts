"use client";

export type Rol = "club" | "admin";
export interface Sesion { nombre: string; email: string; rol: Rol }
async function request<T>(method: "GET" | "POST" | "DELETE", body?: unknown): Promise<T> {
  const response = await fetch("/api/sesion", { method, headers: { ...(body ? { "content-type": "application/json" } : {}), "x-requested-with": "sportmatch-web" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", credentials: "same-origin" });
  if (!response.ok) {
    let message = "No se pudo completar la solicitud.";
    try { const data = await response.json() as { error?: unknown }; if (typeof data.error === "string") message = data.error; } catch { /* respuesta sin JSON */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
export function login(email: string, password: string): Promise<Sesion> { return request<Sesion>("POST", { email, password }); }
export async function getSesion(): Promise<Sesion | null> {
  try { return await request<Sesion>("GET"); }
  catch (error) { if (error instanceof Error && error.message === "No hay una sesión activa.") return null; return null; }
}
export async function logout(): Promise<void> { await request<{ ok: true }>("DELETE"); }
