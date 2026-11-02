import { apiGw } from "./cliente";
import { cuerpoLevantamiento, cuerpoSancion, querySanciones } from "./admin.mjs";

// HU-45: sanciones a cuentas (Ms_Users vía el BFF, /users/admin/sanctions). Solo para administradores.
// La web usa "permanente" como el backend (antes el mock decía "definitiva").

export type TipoSancion = "temporal" | "permanente";
/** "vencida" = temporal cuya fecha de fin ya pasó (se calcula, no hay un job). */
export type EstadoSancion = "activa" | "levantada" | "vencida";
export type FiltroEstadoSancion = EstadoSancion | "todas";

/** Persona de una sanción: id y nombre corto ("Ana T."), sin correo, RUT ni foto. */
export type PersonaSancion = { user_id: string; nombre: string | null; apellido_inicial: string | null };

export type Sancion = {
  id: string;
  usuario: PersonaSancion;
  tipo: TipoSancion;
  motivo: string;
  inicio: string;
  fin: string | null; // null si es permanente
  estado: EstadoSancion;
  reporte_id: string | null;
  admin: PersonaSancion | null;
  levantada_por: PersonaSancion | null;
  levantada_en: string | null;
  motivo_levantamiento: string | null;
  fecha_creacion: string;
};

export type NuevaSancion = {
  usuarioId: string;
  tipo: TipoSancion;
  /** Obligatoria si es temporal (1 a 365); no va si es permanente. */
  dias?: number | string | null;
  motivo: string;
  /** Opcional: reporte escalado de esa misma cuenta (HU-47). */
  reporteId?: string | null;
};

export const LIMITE_SANCIONES = 50;

/** Más recientes primero. Sin estado trae todas. Devuelve una página (la API no informa el total). */
export function listarSanciones(filtro: FiltroEstadoSancion = "todas", pagina = 1, limit = LIMITE_SANCIONES): Promise<Sancion[]> {
  return apiGw<Sancion[]>(`users/admin/sanctions${querySanciones({ estado: filtro === "todas" ? undefined : filtro, pagina, limit })}`);
}

/** 409 si la cuenta ya tiene una sanción vigente o el reporte no está escalado; 422 si es admin o la misma cuenta. */
export function aplicarSancion(datos: NuevaSancion): Promise<Sancion> {
  return apiGw<Sancion>("users/admin/sanctions", { method: "POST", body: cuerpoSancion(datos) });
}

/** Idempotente: levantar una ya levantada o vencida no cambia nada. */
export function levantarSancion(id: string, motivo: string): Promise<Sancion> {
  return apiGw<Sancion>(`users/admin/sanctions/${encodeURIComponent(id)}/lift`, { method: "POST", body: cuerpoLevantamiento(motivo) });
}
