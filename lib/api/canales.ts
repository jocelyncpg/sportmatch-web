import { apiGw } from "./cliente";
import { queryString, validarTexto } from "./validaciones.mjs";
import type { Mensaje } from "./consultas";
export interface MensajeCanal extends Mensaje { autor_nombre: string }
export interface CanalClub {
  id: string;
  club_id: string;
  nombre: string;
  miembros_escriben: boolean;
  miembros: number;
  ultimo: MensajeCanal | null;
  no_leidos: number;
  aviso_inactividad_en: string | null;
  mantener_hasta: string | null;
  fecha_creacion: string;
}
export interface MiembroCanal { usuario_id: string; nombre: string; agregado_en: string | null }
export interface MensajesCanal { canal: CanalClub; mensajes: MensajeCanal[] }
export interface CanalCreate { nombre: string; miembros_escriben?: boolean }
export interface CanalUpdate { nombre?: string; miembros_escriben?: boolean }
export interface NuevoMensajeCanal { texto: string; client_message_id: string }
export interface FiltrosMensajesCanal { after_id?: number; before_id?: number; limit?: number }
function validarMensaje(mensaje: NuevoMensajeCanal) {
  validarTexto(mensaje.texto, "El mensaje", 1, 1000);
  const uuidValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidValido.test(mensaje.client_message_id)) {
    throw new Error("El identificador del mensaje debe ser un UUID válido.");
  }
}

export async function listarCanales(clubId: string): Promise<CanalClub[]> {
  return apiGw(`clubs/${encodeURIComponent(clubId)}/canales`);
}

export async function crearCanal(clubId: string, datos: CanalCreate): Promise<CanalClub> {
  validarTexto(datos.nombre, "El nombre del canal", 1, 60);
  return apiGw(`clubs/${encodeURIComponent(clubId)}/canales`, { method: "POST", body: datos });
}

export async function editarCanal(
  clubId: string,
  canalId: string,
  datos: CanalUpdate
): Promise<CanalClub> {
  if (!Object.keys(datos).length) {
    throw new Error("Indica el nombre o si los miembros pueden escribir.");
  }
  if (datos.nombre !== undefined) {
    validarTexto(datos.nombre, "El nombre del canal", 1, 60);
  }
  return apiGw(`clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}`, {
    method: "PATCH",
    body: datos,
  });
}

export async function eliminarCanal(clubId: string, canalId: string): Promise<void> {
  const ruta = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}`;
  await apiGw(ruta, { method: "DELETE" });
}

export async function listarMiembrosCanal(
  clubId: string,
  canalId: string,
  candidatos = false
): Promise<MiembroCanal[]> {
  const tipo = candidatos ? "candidatos" : "miembros";
  const ruta = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}/${tipo}`;
  return apiGw(ruta);
}

export async function cambiarMiembroCanal(
  clubId: string,
  canalId: string,
  usuarioId: string,
  agregar: boolean
): Promise<void> {
  const base = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}`;
  const ruta = `${base}/miembros/${encodeURIComponent(usuarioId)}`;
  await apiGw(ruta, { method: agregar ? "PUT" : "DELETE" });
}

export async function listarMensajesCanal(
  clubId: string,
  canalId: string,
  filtros: FiltrosMensajesCanal = {}
): Promise<MensajesCanal> {
  const ruta = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}/messages`;
  return apiGw(`${ruta}${queryString(filtros)}`);
}

export async function enviarMensajeCanal(
  clubId: string,
  canalId: string,
  mensaje: NuevoMensajeCanal
): Promise<MensajeCanal> {
  validarMensaje(mensaje);
  const ruta = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}/messages`;
  return apiGw(ruta, { method: "POST", body: mensaje });
}

export async function marcarCanalLeido(
  clubId: string,
  canalId: string,
  hasta_id: number
): Promise<void> {
  if (!Number.isSafeInteger(hasta_id) || hasta_id < 0) {
    throw new Error("El identificador de lectura no es válido.");
  }
  const ruta = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}/read`;
  await apiGw(ruta, { method: "POST", body: { hasta_id } });
}

export async function decidirInactividad(
  clubId: string,
  canalId: string,
  decision: "eliminar" | "mantener"
): Promise<void> {
  if (decision !== "eliminar" && decision !== "mantener") {
    throw new Error("Selecciona una decisión válida.");
  }
  const ruta = `clubs/${encodeURIComponent(clubId)}/canales/${encodeURIComponent(canalId)}/inactividad`;
  await apiGw(ruta, { method: "POST", body: { decision } });
}
