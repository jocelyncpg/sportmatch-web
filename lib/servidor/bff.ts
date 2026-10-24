import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  falloLogin,
  limitado,
  limpiarIntentos,
  mapearRol,
  opcionesCookie,
  rutasPermitidas,
  validarCSRF,
  validarLoginBody,
} from "./core.mjs";
export {
  falloLogin,
  limitado,
  limpiarIntentos,
  mapearRol,
  opcionesCookie,
  rutasPermitidas,
  validarCSRF,
  validarLoginBody,
};

export const COOKIE_TOKEN = "sm_sesion";
export const COOKIE_USER = "sm_usuario";
let devSecret: string | undefined;

export interface SesionPublica {
  nombre: string;
  email: string;
  rol: "club" | "admin";
}

function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET requerida");
  if (!devSecret) {
    devSecret = randomBytes(32).toString("hex");
    console.warn("SESSION_SECRET no definida; se generó una clave temporal de desarrollo.");
  }
  return devSecret;
}

// La firma HMAC evita aceptar cookies de usuario modificadas desde el cliente.
export function firmarUsuario(user: SesionPublica): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
export function leerUsuarioFirmado(value: string | undefined): SesionPublica | null {
  if (!value) return null;
  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SesionPublica;
    const validRole = user.rol === "club" || user.rol === "admin";
    return typeof user.nombre === "string" && typeof user.email === "string" && validRole ? user : null;
  } catch { return null; }
}
export function origenSeguro(request: Request): boolean {
  try {
    return validarCSRF(request);
  } catch {
    return false;
  }
}

export function mensajeError(status: number): string {
  return status === 401 ? "Correo o contraseña incorrectos" : "No se pudo completar la solicitud.";
}
