"use client";

import { apiGw, ApiError } from "./cliente";

export type Plan = { id: number; nombre: string; descripcion: string | null; precio: number; duracion_dias: number };
export type Suscripcion = { estado: "ACTIVE" | "EXPIRED"; plan: Plan; fecha_fin: string };
export type RetornoPago = { token_ws?: string; tbk_token?: string; tbk_orden_compra?: string; tbk_id_sesion?: string };
export type Comprobante = {
  status: "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING";
  buy_order: string; amount: number; authorization_code: string | null;
  card_last4: string | null; suscripcion: Suscripcion | null;
};
export const precioCLP = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);
export const listarPlanes = () => apiGw<Plan[]>("payments/plans?tipo=CLUB");
export async function miSuscripcion(): Promise<Suscripcion | null> {
  try { return await apiGw<Suscripcion>("payments/subscription/me"); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}
export async function iniciarPago(planId: number) {
  return apiGw<{ checkout_url: string; token_ws: string; environment: string }>("payments/webpay/initiate", {
    method: "POST", body: { plan_id: planId, client: "web" },
  });
}
export const confirmarPago = (body: RetornoPago) => apiGw<Comprobante>("payments/webpay/commit", { method: "POST", body });

export type Periodo = {
  id: string; transaccion_id: string; plan_nombre: string; precio_pagado: number;
  fecha_inicio: string; fecha_fin: string; vigente: boolean;
};
export type PagoHistorial = {
  transaccion_id: string; buy_order: string; fecha: string; plan: Plan; amount: number;
  status: Comprobante["status"]; authorization_code: string | null; card_last4: string | null;
  payment_type_code: string | null; periodo: Periodo | null;
};
export type Pagina<T> = { items: T[]; total: number; page: number; page_size: number };
export const historialPagos = (page = 1) => apiGw<Pagina<PagoHistorial>>(`payments/history/me?page=${page}&page_size=10`);
export const historialPeriodos = (page = 1) => apiGw<Pagina<Periodo>>(`payments/subscriptions/me/history?page=${page}&page_size=10`);

export async function descargarComprobante(id: string) {
  const response = await fetch(`/api/gw/payments/history/${encodeURIComponent(id)}/receipt`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo descargar el comprobante. Revisa tu sesión e inténtalo nuevamente.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprobante-${id}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
