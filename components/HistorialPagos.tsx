"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { descargarComprobante, historialPagos, historialPeriodos, precioCLP,
  type Pagina, type PagoHistorial, type Periodo } from "@/lib/api/pagos";

const estados = { APPROVED: "Aprobado", REJECTED: "Rechazado", CANCELLED: "Anulado", PENDING: "Pendiente" };
const fecha = (value: string) => new Date(value).toLocaleDateString("es-CL");

export default function HistorialPagos() {
  const [pagos, setPagos] = useState<Pagina<PagoHistorial> | null>(null);
  const [periodos, setPeriodos] = useState<Pagina<Periodo> | null>(null);
  const [paginaPago, setPaginaPago] = useState(1);
  const [paginaPeriodo, setPaginaPeriodo] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([historialPagos(paginaPago), historialPeriodos(paginaPeriodo)])
      .then(([p, s]) => { if (active) { setPagos(p); setPeriodos(s); setError(""); } })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setCargando(false); });
    return () => { active = false; };
  }, [paginaPago, paginaPeriodo, intento]);
  async function descargar(id: string) {
    setDescargando(id);
    try { await descargarComprobante(id); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo descargar el comprobante."); }
    finally { setDescargando(null); }
  }
  function navegar(tipo: "pago" | "periodo", pagina: number) {
    setCargando(true);
    if (tipo === "pago") setPaginaPago(pagina); else setPaginaPeriodo(pagina);
  }
  return <section className="space-y-5" aria-label="Historial de pagos y suscripciones">
    <h2 className="text-xl font-bold">Historial</h2>
    {error && <div role="alert"><p>{error}</p><button className="underline" onClick={() => { setCargando(true); setIntento(intento + 1); }}>Reintentar</button></div>}
    {cargando && <p role="status">Cargando historial…</p>}
    <Card><h3 className="mb-3 text-lg font-bold">Pagos</h3>
      {!cargando && pagos?.total === 0 && <p>Aún no tienes pagos registrados.</p>}
      <ul className="divide-y divide-border">{pagos?.items.map((pago) => <li key={pago.transaccion_id} className="space-y-2 py-4">
        <p className="font-semibold">{pago.plan.nombre} · {precioCLP(pago.amount)} · {estados[pago.status]}</p>
        <p className="text-sm text-muted">{fecha(pago.fecha)} · Orden {pago.buy_order}</p>
        {pago.periodo && <p className="text-sm">Período: {fecha(pago.periodo.fecha_inicio)} al {fecha(pago.periodo.fecha_fin)}</p>}
        {pago.status === "APPROVED" && <button className="text-accent underline" disabled={descargando !== null} onClick={() => void descargar(pago.transaccion_id)}>
          {descargando === pago.transaccion_id ? "Descargando…" : "Descargar comprobante"}</button>}
      </li>)}</ul>
      {pagos && pagos.total > pagos.page_size && <nav className="flex items-center gap-4" aria-label="Páginas de pagos">
        <button disabled={cargando || paginaPago === 1} onClick={() => navegar("pago", paginaPago - 1)}>Anterior</button>
        <span>Página {paginaPago}</span>
        <button disabled={cargando || paginaPago * pagos.page_size >= pagos.total} onClick={() => navegar("pago", paginaPago + 1)}>Siguiente</button>
      </nav>}
    </Card>
    <Card><h3 className="mb-3 text-lg font-bold">Períodos de suscripción</h3>
      {!cargando && periodos?.total === 0 && <p>Aún no tienes períodos pagados.</p>}
      <ul className="divide-y divide-border">{periodos?.items.map((p) => <li key={p.id} className="py-4">
        <p className="font-semibold">{p.plan_nombre} · {precioCLP(p.precio_pagado)}</p>
        <p>{fecha(p.fecha_inicio)} al {fecha(p.fecha_fin)} · {p.vigente ? "Vigente" : new Date(p.fecha_inicio) > new Date() ? "Programado" : "Finalizado"}</p>
      </li>)}</ul>
      {periodos && periodos.total > periodos.page_size && <nav className="flex items-center gap-4" aria-label="Páginas de períodos">
        <button disabled={cargando || paginaPeriodo === 1} onClick={() => navegar("periodo", paginaPeriodo - 1)}>Anterior</button>
        <span>Página {paginaPeriodo}</span>
        <button disabled={cargando || paginaPeriodo * periodos.page_size >= periodos.total} onClick={() => navegar("periodo", paginaPeriodo + 1)}>Siguiente</button>
      </nav>}
    </Card>
  </section>;
}
