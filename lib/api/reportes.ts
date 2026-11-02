import { apiGw } from "./cliente";
import { validarTexto } from "./validaciones.mjs";
import { cuerpoRevision, queryReportes } from "./admin.mjs";

// Reportes que hace el club sobre un deportista (tipo "usuario" en Ms_Users, POST /users/reports).
// Motivos tomados de REPORT_REASONS["usuario"] del backend.
export const MOTIVOS_REPORTE_DEPORTISTA = [
  "Acoso o trato irrespetuoso",
  "Lenguaje ofensivo",
  "Perfil falso o suplantación",
  "Spam o publicidad",
  "Otro",
] as const;
export type MotivoReporteDeportista = (typeof MOTIVOS_REPORTE_DEPORTISTA)[number];

// La justificación es obligatoria para cualquier motivo (la API solo la exige con "Otro").
export const JUSTIFICACION_MIN = 10;
export const JUSTIFICACION_MAX = 300;

export async function reportarDeportista(
  usuarioId: string,
  nombre: string,
  motivo: MotivoReporteDeportista,
  justificacion: string
): Promise<void> {
  if (!(MOTIVOS_REPORTE_DEPORTISTA as readonly string[]).includes(motivo)) {
    throw new Error("Elige un motivo para el reporte.");
  }
  const detalle = validarTexto(justificacion, "La justificación", JUSTIFICACION_MIN, JUSTIFICACION_MAX);
  await apiGw("users/reports", {
    method: "POST",
    body: {
      tipo: "usuario",
      objetivo_id: usuarioId,
      objetivo_nombre: nombre.trim().slice(0, 200),
      motivo,
      detalle,
    },
  });
}

// ---------------------------------------------------------------------------------------------------------------
// HU-47: moderación de reportes por el administrador (Ms_Users vía el BFF, /users/admin/reports).

export type EstadoReporte = "pendiente" | "revisado" | "descartado" | "escalado";
/** "todos" solo existe como filtro del listado. */
export type FiltroEstadoReporte = EstadoReporte | "todos";
/** Estados a los que se puede mover un reporte. "escalado" lo deja listo para una sanción (HU-45), no la aplica. */
export type DecisionReporte = Exclude<EstadoReporte, "pendiente">;

/** Persona de un reporte: id y nombre corto ("Ana T."), sin correo, RUT ni foto. */
export type PersonaReporte = { user_id: string; nombre: string; apellido_inicial: string };

export type ReporteAdmin = {
  id: string;
  tipo: "usuario" | "actividad" | "mensaje";
  objetivo_id: string;
  /** Lo escribe quien reporta; para la identidad real usar `reportado`. */
  objetivo_nombre: string;
  motivo: string;
  detalle: string;
  reportante: PersonaReporte | null;
  reportante_rol: string | null;
  /** La cuenta a la que se reportó (null si ya no existe). Es la que se sanciona. */
  reportado: PersonaReporte | null;
  estado: EstadoReporte;
  fecha_creacion: string;
  fecha_revision: string | null;
};

export const LIMITE_REPORTES = 50;

/** Más recientes primero. La API no devuelve el total: si llegan tantos como el límite, puede haber más páginas. */
export function listarReportesAdmin(estado: FiltroEstadoReporte = "pendiente", pagina = 1, limit = LIMITE_REPORTES): Promise<ReporteAdmin[]> {
  return apiGw<ReporteAdmin[]>(`users/admin/reports${queryReportes({ estado, pagina, limit })}`);
}

/** 404 si no existe, 409 si la transición no es válida (por ejemplo, un reporte descartado no se reabre). */
export function resolverReporte(id: string, estado: DecisionReporte, motivo?: string): Promise<ReporteAdmin> {
  return apiGw<ReporteAdmin>(`users/admin/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: cuerpoRevision(estado, motivo) });
}
