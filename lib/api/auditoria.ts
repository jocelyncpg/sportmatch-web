import { apiGw } from "./cliente";
import { queryAuditoria } from "./admin.mjs";
import type { AccionAuditoria, RecursoAuditoria } from "./admin.mjs";

// HU-48: historial de acciones administrativas (Ms_Users vía el BFF, GET /users/admin/audit-events). Solo lectura.

export type { AccionAuditoria, RecursoAuditoria };

export type FiltrosAuditoria = {
  /** ISO 8601 con zona horaria. */
  desde?: string;
  hasta?: string;
  adminId?: string;
  accion?: AccionAuditoria;
  recursoTipo?: RecursoAuditoria;
  resultado?: "success" | "failure";
  /** Desde 1. */
  pagina?: number;
  /** Máximo 100. */
  porPagina?: number;
};

export type EventoAuditoria = {
  id: string;
  fecha: string;
  admin: { id: string | null; nombre: string | null };
  accion: AccionAuditoria | string;
  recurso_tipo: RecursoAuditoria | null;
  recurso_id: string | null;
  afectado: { id: string | null; nombre: string | null } | null;
  motivo: string | null;
  resultado: string;
  detalle: Record<string, string | number | boolean | null> | null;
};

export type PaginaAuditoria = {
  items: EventoAuditoria[];
  pagina: number;
  por_pagina: number;
  total: number;
  total_paginas: number;
};

export function listarAuditoria(filtros: FiltrosAuditoria = {}): Promise<PaginaAuditoria> {
  return apiGw<PaginaAuditoria>(`users/admin/audit-events${queryAuditoria(filtros)}`);
}
