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
