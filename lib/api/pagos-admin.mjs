// HU-57: pagos de la plataforma para el administrador (solo lectura). Lógica sin React para poder probarla con
// node --test (scripts/test-pagos-admin.mjs): la consulta al BFF y la exportación CSV.

/** Tope por página que acepta ms-pago; la exportación recorre todas las páginas con este tope. */
export const LIMITE_EXPORTACION = 200;
/** Freno de seguridad de la exportación (50 páginas de 200). */
export const MAX_FILAS_EXPORTACION = 10_000;

export const ETIQUETA_ESTADO_PAGO = {
  APPROVED: "Aprobado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
  CANCELLED: "Anulado",
};
export const ETIQUETA_CATEGORIA = { PLAN: "Plan", CONVENIO: "Convenio" };
export const ETIQUETA_TIPO = { USUARIO: "Deportista", CLUB: "Club" };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Query string de GET payments/admin/transactions. Ignora valores vacíos o fuera de los permitidos. */
export function queryPagosAdmin(f = {}) {
  const params = new URLSearchParams();
  if (f.estado && Object.hasOwn(ETIQUETA_ESTADO_PAGO, f.estado)) params.set("estado", f.estado);
  if (f.desde && FECHA.test(f.desde)) params.set("desde", f.desde);
  if (f.hasta && FECHA.test(f.hasta)) params.set("hasta", f.hasta);
  if (f.categoria && Object.hasOwn(ETIQUETA_CATEGORIA, f.categoria)) params.set("categoria", f.categoria);
  if (f.tipo && Object.hasOwn(ETIQUETA_TIPO, f.tipo)) params.set("tipo", f.tipo);
  if (Number.isInteger(f.page) && f.page > 1) params.set("page", String(f.page));
  if (Number.isInteger(f.limit) && f.limit > 0) params.set("limit", String(f.limit));
  const t = params.toString();
  return t ? `?${t}` : "";
}

/**
 * Pide todas las páginas del filtro actual (para exportar). `listar(page, limit)` devuelve { items, total }.
 * Se detiene al completar el total, ante una página vacía o al llegar a MAX_FILAS_EXPORTACION.
 */
export async function todasLasPaginas(listar, limite = LIMITE_EXPORTACION, maximo = MAX_FILAS_EXPORTACION) {
  const filas = [];
  const vistos = new Set();
  let total = 0;
  for (let page = 1; filas.length < maximo; page++) {
    const r = await listar(page, limite);
    total = r.total;
    // Si entra un pago nuevo mientras se exporta, las páginas se corren: se evita repetir filas.
    for (const fila of r.items) if (!vistos.has(fila.id)) { vistos.add(fila.id); filas.push(fila); }
    if (r.items.length < limite || page * limite >= r.total) break;
  }
  return { filas: filas.slice(0, maximo), total, truncado: total > maximo };
}

/**
 * Una celda CSV: siempre entre comillas, con las comillas duplicadas. Un texto que empieza con =, +, -, @, tab o
 * retorno de carro se antepone con ' para que Excel no lo ejecute como fórmula (inyección CSV). Los números van
 * tal cual.
 */
export function celdaCsv(valor) {
  if (valor === null || valor === undefined) return '""';
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  const texto = String(valor);
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export const CABECERA_CSV = [
  "ID", "Fecha (ISO)", "Estado", "Monto (CLP)", "Tipo", "Deportista o club", "ID deportista o club", "Plan o convenio",
  "Categoría", "Orden de compra", "Código de autorización", "Tarjeta (últimos 4)", "Período desde", "Período hasta",
];

/** CSV (con BOM para Excel y fin de línea CRLF) de las filas que entrega el endpoint de pagos del administrador. */
export function csvPagos(filas) {
  const lineas = filas.map((p) => [
    p.id, p.fecha, (Object.hasOwn(ETIQUETA_ESTADO_PAGO, p.estado) ? ETIQUETA_ESTADO_PAGO[p.estado] : p.estado), p.monto, (Object.hasOwn(ETIQUETA_TIPO, p.tipo_suscriptor) ? ETIQUETA_TIPO[p.tipo_suscriptor] : p.tipo_suscriptor),
    p.suscriptor_nombre ?? "", p.suscriptor_id, p.plan?.nombre ?? "", ETIQUETA_CATEGORIA[p.plan?.categoria] ?? "",
    p.buy_order, p.codigo_autorizacion ?? "", p.card_last4 ?? "", p.periodo?.fecha_inicio ?? "", p.periodo?.fecha_fin ?? "",
  ].map(celdaCsv).join(","));
  return "﻿" + [CABECERA_CSV.map(celdaCsv).join(","), ...lineas].join("\r\n") + "\r\n";
}

/** Nombre del archivo según el filtro, p. ej. pagos-sportmatch-2026-03-01_2026-03-31.csv */
export function nombreArchivoCsv(f = {}) {
  const rango = [f.desde, f.hasta].filter((d) => d && FECHA.test(d)).join("_");
  return `pagos-sportmatch${rango ? `-${rango}` : ""}.csv`;
}
