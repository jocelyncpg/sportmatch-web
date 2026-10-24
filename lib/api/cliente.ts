"use client";

import { errorBff } from "../servidor/core.mjs";
import { queryString, validarTexto } from "./validaciones.mjs";
import { olvidarSesion } from "../auth";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}
export { queryString, validarTexto };

export interface OpcionesApi extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiGw<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const path = ruta.replace(/^\/+/, "");
  if (!path || path.split("/").some((part) => part === ".." || part === ".")) {
    throw new ApiError("La ruta solicitada no es válida.", 400);
  }
  const { body, headers: inputHeaders, ...rest } = opciones;
  const headers = new Headers(inputHeaders);
  headers.set("x-requested-with", "sportmatch-web");
  if (body !== undefined) headers.set("content-type", "application/json");
  let response: Response;
  try {
    response = await fetch(`/api/gw/${path}`, {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servicio. Inténtalo nuevamente.", 0);
  }
  if (response.status === 401 && typeof window !== "undefined") {
    olvidarSesion();
    window.location.replace("/login");
  }
  let payload: unknown;
  try {
    payload = response.status === 204 ? undefined : await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const known: Record<number, string> = {
      400: "Los datos enviados no son válidos.",
      401: "Tu sesión expiró. Inicia sesión nuevamente.",
      403: "No tienes permiso para realizar esta acción.",
      404: "No se encontró la información solicitada.",
      409: "La solicitud entra en conflicto con el estado actual.",
      422: "Revisa los datos ingresados.",
      429: "Demasiadas solicitudes. Inténtalo más tarde.",
    };
    const fallback = known[response.status] ?? "No se pudo completar la solicitud.";
    throw new ApiError(errorBff(payload, fallback), response.status);
  }
  return payload as T;
}
