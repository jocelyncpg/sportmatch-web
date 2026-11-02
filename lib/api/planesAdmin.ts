import { apiGw } from "./cliente";
import { cuerpoDesactivacion, cuerpoPlanCambios, cuerpoPlanNuevo, cuerpoReactivacion, queryPlanes } from "./admin.mjs";
import type { DatosPlan } from "./admin.mjs";

// HU-56: planes y convenios (ms-club vía el BFF, /payments/admin/plans). Solo para administradores.
// Distinto de lib/api/pagos.ts, que es el catálogo que ve un club al contratar.

export type { DatosPlan };
export type TipoPlan = "USUARIO" | "CLUB";
/** Un convenio es un plan acordado con una institución o un club; se compra igual que un plan. */
export type CategoriaPlan = "PLAN" | "CONVENIO";
export type EstadoPlanFiltro = "activo" | "inactivo" | "todos";

export type PlanAdmin = {
  id: number;
  nombre: string;
  tipo: TipoPlan;
  categoria: CategoriaPlan;
  descripcion: string | null;
  /** Pesos chilenos enteros. 0 = gratuito (no se paga con Webpay). */
  precio: number;
  /** null = sin vencimiento (solo un plan gratis). */
  duracion_dias: number | null;
  beneficios: string[];
  /** Solo un convenio la tiene: con quién se firmó. */
  institucion: string | null;
  is_active: boolean;
  /** Suscripciones cuya vigencia no termina y cuyo último pago fue de este plan. */
  suscripciones_vigentes: number;
  fecha_creacion: string | null;
  /** El plan base no se puede desactivar. */
  es_base: boolean;
  /** Cuándo y por qué se retiró del catálogo (null mientras está activo). */
  fecha_desactivacion: string | null;
  motivo_desactivacion: string | null;
};

export type PaginaPlanes = { items: PlanAdmin[]; pagina: number; limit: number; total: number };

export const LIMITE_PLANES = 50;

/** Activos e inactivos, el más reciente primero. */
export function listarPlanesAdmin(
  f: { estado?: EstadoPlanFiltro; tipo?: TipoPlan; categoria?: CategoriaPlan; pagina?: number; limit?: number } = {},
): Promise<PaginaPlanes> {
  return apiGw<PaginaPlanes>(`payments/admin/plans${queryPlanes({
    estado: f.estado ?? "todos", tipo: f.tipo, categoria: f.categoria, pagina: f.pagina ?? 1, limit: f.limit ?? LIMITE_PLANES,
  })}`);
}

/** Lo que ve la gente al contratar (catálogo público de ms-club): solo planes activos. */
export type PlanPublico = Pick<PlanAdmin, "id" | "nombre" | "tipo" | "categoria" | "descripcion" | "precio" | "duracion_dias" | "beneficios" | "institucion">;
export function catalogoPublico(tipo: TipoPlan): Promise<PlanPublico[]> {
  return apiGw<PlanPublico[]>(`payments/plans?tipo=${tipo}`);
}

/** 409 si ya hay un plan activo con ese nombre; 503 si no se pudo registrar la auditoría (no se guarda nada). */
export function crearPlan(datos: DatosPlan): Promise<PlanAdmin> {
  return apiGw<PlanAdmin>("payments/admin/plans", { method: "POST", body: cuerpoPlanNuevo(datos) });
}

/** Solo cambia lo que difiere del original. Un cambio de precio o de duración no afecta lo ya pagado. */
export function editarPlan(original: PlanAdmin, datos: DatosPlan): Promise<PlanAdmin> {
  return apiGw<PlanAdmin>(`payments/admin/plans/${encodeURIComponent(String(original.id))}`, {
    method: "PATCH", body: cuerpoPlanCambios(original, datos),
  });
}

/** Borrado lógico: deja de mostrarse y de poder contratarse; las suscripciones vigentes siguen hasta su término. */
export function desactivarPlan(id: number, motivo?: string): Promise<PlanAdmin> {
  return apiGw<PlanAdmin>(`payments/admin/plans/${encodeURIComponent(String(id))}/deactivate`, {
    method: "POST", body: cuerpoDesactivacion(motivo),
  });
}

/** 409 si ya hay un plan activo con ese nombre o si ya estaba activo; 503 si no se pudo registrar la auditoría. */
export function reactivarPlan(id: number, motivo?: string): Promise<PlanAdmin> {
  return apiGw<PlanAdmin>(`payments/admin/plans/${encodeURIComponent(String(id))}/reactivate`, {
    method: "POST", body: cuerpoReactivacion(motivo),
  });
}

/** Una suscripción cuyo último pago fue de un plan. `suscriptor` es un nombre corto o el del club; null si no está disponible. */
export type SuscripcionPlan = {
  id: string;
  suscriptor: string | null;
  tipo_suscriptor: "USUARIO" | "CLUB";
  estado: "ACTIVE" | "EXPIRED";
  /** Nombre del plan y precio al contratar: un cambio posterior no los altera. */
  plan_nombre: string;
  precio_pagado: number;
  fecha_inicio: string;
  fecha_fin: string;
};
export type PaginaSuscripciones = { items: SuscripcionPlan[]; pagina: number; limit: number; total: number };
export const LIMITE_SUSCRIPCIONES = 100;

/** Las vigentes primero y luego las que terminaron más tarde. */
export function listarSuscripcionesPlan(id: number, pagina = 1): Promise<PaginaSuscripciones> {
  return apiGw<PaginaSuscripciones>(
    `payments/admin/plans/${encodeURIComponent(String(id))}/subscriptions?estado=todas&pagina=${pagina}&limit=${LIMITE_SUSCRIPCIONES}`,
  );
}
