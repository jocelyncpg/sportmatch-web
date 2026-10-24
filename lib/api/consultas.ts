import { apiGw } from "./cliente";
import { queryString, validarTexto } from "./validaciones.mjs";
export interface Mensaje { id: number; de: "deportista" | "club"; texto: string; enviado_en: string; propio: boolean }
export interface HiloClub {
  hilo_id: string;
  deportista_id: string;
  deportista_nombre: string;
  ultimo: Mensaje | null;
  no_leidos: number;
}
export interface MensajesPage { hilo_id: string | null; mensajes: Mensaje[] }
export interface ConsultaIniciada { hilo_id: string; mensaje: Mensaje }
export interface FiltrosMensajes { after_id?: number; before_id?: number; limit?: number }
export interface NuevoMensaje { texto: string; client_message_id: string }

function validarMensaje(mensaje: NuevoMensaje) {
  validarTexto(mensaje.texto, "El mensaje", 1, 1000);
  const uuidValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidValido.test(mensaje.client_message_id)) {
    throw new Error("El identificador del mensaje debe ser un UUID válido.");
  }
}

export async function listarConsultas(clubId: string): Promise<HiloClub[]> {
  return apiGw(`clubs/${encodeURIComponent(clubId)}/consultas`);
}

export async function listarMensajesConsulta(
  clubId: string,
  hiloId: string,
  filtros: FiltrosMensajes = {}
): Promise<MensajesPage> {
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/${encodeURIComponent(hiloId)}/messages`;
  return apiGw(`${ruta}${queryString(filtros)}`);
}

export async function responderConsulta(
  clubId: string,
  hiloId: string,
  mensaje: NuevoMensaje
): Promise<Mensaje> {
  validarMensaje(mensaje);
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/${encodeURIComponent(hiloId)}/messages`;
  return apiGw(ruta, { method: "POST", body: mensaje });
}

export async function marcarConsultaLeida(
  clubId: string,
  hiloId: string,
  hasta_id: number
): Promise<void> {
  if (!Number.isSafeInteger(hasta_id) || hasta_id < 0) {
    throw new Error("El identificador de lectura no es válido.");
  }
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/${encodeURIComponent(hiloId)}/read`;
  await apiGw(ruta, { method: "POST", body: { hasta_id } });
}

export async function iniciarConsultaPostulante(
  clubId: string,
  usuarioId: string,
  mensaje: NuevoMensaje
): Promise<ConsultaIniciada> {
  validarMensaje(mensaje);
  const ruta = `clubs/${encodeURIComponent(clubId)}/consultas/postulantes/${encodeURIComponent(usuarioId)}/messages`;
  return apiGw(ruta, { method: "POST", body: mensaje });
}
