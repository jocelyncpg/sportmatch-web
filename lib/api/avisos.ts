import { apiGw } from "./cliente";
import { queryString, validarTexto } from "./validaciones.mjs";
export type AudienciaAviso = "TODOS" | "POSTULANTES" | "MIEMBROS";
export type PrioridadAviso = "NORMAL" | "URGENTE";

export interface Aviso {
  id: string;
  club: { id: string; nombre: string; logo: string | null };
  titulo: string;
  contenido: string;
  audiencia: AudienciaAviso;
  prioridad: PrioridadAviso;
  fecha_creacion: string;
  destinatarios: number;
}

export interface AvisoPage {
  items: Aviso[];
  total: number;
  page: number;
  page_size: number;
}

export interface AvisoCreate {
  titulo: string;
  contenido: string;
  audiencia: AudienciaAviso;
  prioridad?: PrioridadAviso;
}

export async function listarAvisos(
  clubId: string,
  filtros: { audiencia?: AudienciaAviso; prioridad?: PrioridadAviso; page?: number; page_size?: number } = {}
): Promise<AvisoPage> {
  const ruta = `clubs/${encodeURIComponent(clubId)}/notices`;
  return apiGw(`${ruta}${queryString(filtros)}`);
}

export async function publicarAviso(clubId: string, aviso: AvisoCreate): Promise<Aviso> {
  validarTexto(aviso.titulo, "El título", 3, 120);
  validarTexto(aviso.contenido, "El contenido", 5, 2000);
  if (!["TODOS", "POSTULANTES", "MIEMBROS"].includes(aviso.audiencia)) {
    throw new Error("Selecciona una audiencia válida.");
  }
  if (aviso.prioridad && !["NORMAL", "URGENTE"].includes(aviso.prioridad)) {
    throw new Error("Selecciona una prioridad válida.");
  }
  return apiGw(`clubs/${encodeURIComponent(clubId)}/notices`, { method: "POST", body: aviso });
}
