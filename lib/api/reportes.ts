import { apiGw } from "./cliente";
import { validarTexto } from "./validaciones.mjs";

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
