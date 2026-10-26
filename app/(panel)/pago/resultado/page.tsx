"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, PageHeader, btnPrimary } from "@/components/ui";
import { ApiError } from "@/lib/api/cliente";
import { confirmarPago, precioCLP, type Comprobante, type RetornoPago } from "@/lib/api/pagos";

export default function ResultadoPago() {
  const search = useSearchParams().toString();
  const [receipt, setReceipt] = useState<Comprobante | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(search);
    const retorno: RetornoPago = {};
    for (const key of ["token_ws", "tbk_token", "tbk_orden_compra", "tbk_id_sesion"] as const) {
      const value = params.get(key); if (value) retorno[key] = value;
    }
    async function confirmar() {
      let body = retorno;
      if (!Object.keys(body).length && !params.has("error")) {
        body = JSON.parse(sessionStorage.getItem("sportmatch_pago_pendiente") || "{}");
      }
      if (!body.token_ws && !body.tbk_token && !body.tbk_orden_compra) throw new ApiError("El enlace no contiene un pago válido.", 400);
      sessionStorage.setItem("sportmatch_pago_pendiente", JSON.stringify(body));
      const result = await confirmarPago(body);
      if (result.status !== "APPROVED") throw new ApiError("El pago aún no está confirmado. Revisa su estado antes de volver a pagar.", 502);
      sessionStorage.removeItem("sportmatch_pago_pendiente");
      if (active) setReceipt(result);
    }
    void confirmar().catch((e: unknown) => {
      const terminal = e instanceof ApiError && [400, 404].includes(e.status);
      if (terminal) sessionStorage.removeItem("sportmatch_pago_pendiente");
      if (active) { setError(e instanceof Error ? e.message : "No se pudo confirmar el pago."); setRetry(!terminal); }
    });
    return () => { active = false; };
  }, [search, intento]);
  return <>
    <PageHeader titulo="Resultado del pago" />
    <Card>
      {receipt ? <div className="space-y-3"><h2 className="text-xl font-bold">Pago aprobado</h2>
        <p>Tu suscripción está activa.</p><p>Monto: {precioCLP(receipt.amount)}</p>
        <p>Orden: {receipt.buy_order}</p><p>Autorización: {receipt.authorization_code}</p>
        {receipt.card_last4 && <p>Tarjeta terminada en {receipt.card_last4}</p>}
      </div> : error ? <p role="alert">{error}</p> : <p role="status">Confirmando el pago con Webpay…</p>}
      {retry && <button className={`${btnPrimary} mt-5`} onClick={() => { setError(""); setRetry(false); setIntento((n) => n + 1); }}>Reintentar confirmación</button>}
      <Link href="/suscripcion" className="mt-6 block text-accent underline">Volver a mi suscripción</Link>
    </Card>
  </>;
}
