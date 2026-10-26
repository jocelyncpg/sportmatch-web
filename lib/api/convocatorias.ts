import { apiGw } from "./cliente";
import { queryString, validarTexto } from "./validaciones.mjs";
import type { Deporte } from "./club";

export type EstadoConvocatoria = "ABIERTA" | "CERRADA" | "FINALIZADA";

export interface Convocatoria {
  id: string;
  club: { id: string; nombre: string; logo: string | null };
  deporte: Deporte;
  titulo: string | null;
  descripcion: string | null;
  categoria_edad: string;
  edad_minima: number | null;
  edad_maxima: number | null;
  fecha_prueba: string;
  requisitos: string[];
  cupos: number;
  cupos_disponibles: number;
  direccion: string;
  comuna: string | null;
  estado: EstadoConvocatoria;
  fecha_creacion: string | null;
  /** Si los postulantes pueden escribir en el chat de consultas (campo pendiente de contrato en Ms-club). */
  chat_postulantes_habilitado?: boolean;
}

export interface ConvocatoriaPage {
  items: Convocatoria[];
  total: number;
  page: number;
  page_size: number;
}

export interface ConvocatoriaCreate {
  deporte_id: number;
  categoria_edad: string;
  edad_minima?: number | null;
  edad_maxima?: number | null;
  fecha_prueba: string;
  requisitos: string[];
  cupos: number;
  direccion: string;
  comuna?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  chat_postulantes_habilitado?: boolean;
}

export interface ConvocatoriaFilters {
  deporte?: string;
  deporte_id?: number;
  categoria?: string;
  edad?: number;
  club_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: EstadoConvocatoria;
  page?: number;
  page_size?: number;
}

export async function listarConvocatorias(
  filtros: ConvocatoriaFilters = {}
): Promise<ConvocatoriaPage> {
  return apiGw(`clubs/announcements${queryString(filtros)}`);
}

export async function listarConvocatoriasClub(
  clubId: string,
  estado?: EstadoConvocatoria
): Promise<ConvocatoriaPage> {
  const filtros = { club_id: clubId, estado, page_size: 50 };
  return apiGw(`clubs/announcements${queryString(filtros)}`);
}

export async function detalleConvocatoria(id: string): Promise<Convocatoria> {
  return apiGw(`clubs/announcements/${encodeURIComponent(id)}`);
}

export async function publicarConvocatoria(clubId: string, datos: ConvocatoriaCreate): Promise<Convocatoria> {
  validarTexto(datos.categoria_edad, "La categoría", 2, 40);
  validarTexto(datos.direccion, "La dirección", 5, 255);
  if (!Number.isInteger(datos.deporte_id) || datos.deporte_id < 1) {
    throw new Error("Selecciona un deporte válido.");
  }
  if (!Number.isInteger(datos.cupos) || datos.cupos < 1 || datos.cupos > 1000) {
    throw new Error("Los cupos deben estar entre 1 y 1000.");
  }
  if (!datos.requisitos.length || datos.requisitos.length > 15) {
    throw new Error("Agrega entre 1 y 15 requisitos.");
  }
  datos.requisitos.forEach((requisito, indice) => {
    validarTexto(requisito, `El requisito ${indice + 1}`, 2, 200);
  });
  if (datos.titulo) {
    validarTexto(datos.titulo, "El título", 3, 120);
  }
  if (datos.descripcion) {
    validarTexto(datos.descripcion, "La descripción", 1, 2000);
  }
  const date = new Date(datos.fecha_prueba);
  const fechaFutura = date.getTime() > Date.now();
  const dentroDelAnio = date.getTime() <= Date.now() + 365 * 86400000;
  const incluyeZona = /[+-]\d\d:\d\d$/.test(datos.fecha_prueba);
  if (!Number.isFinite(date.getTime()) || !incluyeZona || !fechaFutura || !dentroDelAnio) {
    throw new Error("La fecha debe ser futura, incluir zona horaria y estar dentro del próximo año.");
  }
  if (
    datos.edad_minima != null &&
    datos.edad_maxima != null &&
    datos.edad_minima > datos.edad_maxima
  ) {
    throw new Error("La edad mínima no puede superar a la máxima.");
  }
  for (const edad of [datos.edad_minima, datos.edad_maxima]) {
    if (edad != null && (!Number.isInteger(edad) || edad < 4 || edad > 99)) {
      throw new Error("Las edades deben estar entre 4 y 99 años.");
    }
  }
  if (datos.comuna) {
    validarTexto(datos.comuna, "La comuna", 2, 80);
  }
  return apiGw(`clubs/${encodeURIComponent(clubId)}/announcements`, { method: "POST", body: datos });
}

export async function cerrarConvocatoria(clubId: string, id: string): Promise<void> {
  const ruta = `clubs/${encodeURIComponent(clubId)}/announcements/${encodeURIComponent(id)}/close`;
  await apiGw(ruta, { method: "POST" });
}
