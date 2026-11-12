import { apiGw } from "./cliente";
import { LIMITE_EXPORTACION, queryPagosAdmin, todasLasPaginas } from "./pagos-admin.mjs";
import type { FiltroPagos, PagoAdmin, PaginaPagosAdmin } from "./pagos-admin.mjs";

// HU-57: pagos de la plataforma (ms-pago vía el BFF, GET /payments/admin/transactions). Solo para administradores
// y solo lectura: no hay forma de modificar un pago desde el panel.
// Distinto de lib/api/pagos.ts, que es el pago que hace un club al contratar.

export type { EstadoPago, CategoriaPago, TipoSuscriptor, FiltroPagos, PagoAdmin, PaginaPagosAdmin } from "./pagos-admin.mjs";

export const LIMITE_PAGOS = 20;

/** Una página de pagos, el más reciente primero. */
export function listarPagosAdmin(f: FiltroPagos = {}): Promise<PaginaPagosAdmin> {
  return apiGw<PaginaPagosAdmin>(`payments/admin/transactions${queryPagosAdmin({ ...f, limit: f.limit ?? LIMITE_PAGOS })}`);
}

/** Todas las páginas del filtro actual (para exportar a CSV). */
export function todosLosPagosAdmin(f: Omit<FiltroPagos, "page" | "limit">) {
  return todasLasPaginas<PagoAdmin>((page, limit) => listarPagosAdmin({ ...f, page, limit }), LIMITE_EXPORTACION);
}
