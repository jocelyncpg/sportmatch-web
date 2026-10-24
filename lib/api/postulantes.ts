import { apiGw } from "./cliente";
import { queryString, validarTexto } from "./validaciones.mjs";
import type { Convocatoria } from "./convocatorias";

export type EstadoPostulacion = "PENDIENTE" | "PRESELECCIONADO" | "ACEPTADO" | "RECHAZADO";
export type EstadoRevision = Exclude<EstadoPostulacion, "PENDIENTE">;

export interface PerfilDeportivo {
  nombre: string;
  apellido_inicial: string;
  edad: number | null;
  foto_perfil: string | null;
  biografia: string | null;
  deportes: { deporte_codigo: string; nivel: number }[];
}

export interface Antecedente {
  institucion: string;
  deporte: string;
  anio_inicio: number;
  anio_fin: number | null;
  logros: string | null;
}

export interface Candidato {
  id: string;
  usuario_id: string;
  estado: EstadoPostulacion;
  perfil_deportivo: PerfilDeportivo;
  mensaje: string | null;
  antecedentes: Antecedente[];
  comentario_club: string | null;
  fecha_postulacion: string;
  fecha_actualizacion: string;
}

export interface CandidatoPage {
  convocatoria: Convocatoria;
  items: Candidato[];
  total: number;
  page: number;
  page_size: number;
  conteo_por_estado: Record<string, number>;
}

export interface CandidatoFilters {
  estado?: EstadoPostulacion;
  page?: number;
  page_size?: number;
}

export async function listarPostulantes(
  convocatoriaId: string,
  filtros: CandidatoFilters = {}
): Promise<CandidatoPage> {
  const ruta = `clubs/announcements/${encodeURIComponent(convocatoriaId)}/applications`;
  return apiGw(`${ruta}${queryString(filtros)}`);
}

// Ms-club acepta como máximo 50 por página (PAGE_SIZE_MAX); se recorren todas las páginas.
export const POSTULANTES_POR_PAGINA = 50;

export async function listarTodosPostulantes(convocatoriaId: string): Promise<CandidatoPage> {
  const primera = await listarPostulantes(convocatoriaId, { page: 1, page_size: POSTULANTES_POR_PAGINA });
  const items = [...primera.items];
  const paginas = Math.ceil(primera.total / POSTULANTES_POR_PAGINA);
  for (let page = 2; page <= paginas; page++) {
    const siguiente = await listarPostulantes(convocatoriaId, { page, page_size: POSTULANTES_POR_PAGINA });
    items.push(...siguiente.items);
  }
  return { ...primera, items };
}

export async function actualizarPostulante(
  postulacionId: string,
  estado: EstadoRevision,
  comentario?: string | null
): Promise<Candidato> {
  if (!["PRESELECCIONADO", "ACEPTADO", "RECHAZADO"].includes(estado)) {
    throw new Error("Selecciona un estado válido.");
  }
  if (comentario) {
    validarTexto(comentario, "El comentario", 1, 1000);
  }

  const body = { estado, ...(comentario !== undefined ? { comentario } : {}) };
  return apiGw(`clubs/announcements/applications/${encodeURIComponent(postulacionId)}`, {
    method: "PATCH",
    body,
  });
}
