import { apiGw } from "./cliente";
import { validarTexto } from "./validaciones.mjs";

// Consultas (chat de postulación) del club. Ms-club: una conversación por deportista y club.
export const TEXTO_CONSULTA_MAX = 1000;

export interface MensajeConsulta {
  id: number;
  /** Lado que escribió: el deportista o el club (cualquier administrador del club). */
  de: "deportista" | "club";
  texto: string;
  enviado_en: string;
  propio: boolean;
}

export interface HiloClub {
  hilo_id: string;
  deportista_id: string;
  deportista_nombre: string;
  ultimo: MensajeConsulta | null;
  no_leidos: number;
}

export interface MensajesConsulta {
  hilo_id: string | null;
  mensajes: MensajeConsulta[];
}

function uuidCliente(): string {
  // Idempotencia: el mismo client_message_id devuelve el mensaje ya enviado si se reintenta.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function listarHilosClub(clubId: string): Promise<HiloClub[]> {
  return apiGw(`clubs/${encodeURIComponent(clubId)}/consultas`);
}

export async function mensajesDeHilo(clubId: string, hiloId: string, limit = 100): Promise<MensajesConsulta> {
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/${encodeURIComponent(hiloId)}/messages`;
  return apiGw(`${ruta}?limit=${limit}`);
}

export async function responderHilo(clubId: string, hiloId: string, texto: string): Promise<MensajeConsulta> {
  const limpio = validarTexto(texto, "El mensaje", 1, TEXTO_CONSULTA_MAX);
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/${encodeURIComponent(hiloId)}/messages`;
  return apiGw(ruta, { method: "POST", body: { texto: limpio, client_message_id: uuidCliente() } });
}

// El club escribe primero a un postulante activo (crea la conversación si no existe).
export async function escribirAPostulante(
  clubId: string,
  usuarioId: string,
  texto: string
): Promise<{ hilo_id: string; mensaje: MensajeConsulta }> {
  const limpio = validarTexto(texto, "El mensaje", 1, TEXTO_CONSULTA_MAX);
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/postulantes/${encodeURIComponent(usuarioId)}/messages`;
  return apiGw(ruta, { method: "POST", body: { texto: limpio, client_message_id: uuidCliente() } });
}
