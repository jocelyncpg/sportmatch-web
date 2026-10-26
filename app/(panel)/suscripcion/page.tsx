"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Card, PageHeader, btnPrimary } from "@/components/ui";
import { iniciarPago, listarPlanes, miSuscripcion, precioCLP, type Plan, type Suscripcion } from "@/lib/api/pagos";

function SuscripcionClub() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [actual, setActual] = useState<Suscripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState<number | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [checkout, setCheckout] = useState<string | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([listarPlanes(), miSuscripcion()]).then(([catalogo, suscripcion]) => {
      if (active) { setPlanes(catalogo); setActual(suscripcion); setPendiente(!!sessionStorage.getItem("sportmatch_pago_pendiente")); setCheckout(sessionStorage.getItem("sportmatch_pago_checkout")); }
    }).catch((e: Error) => { if (active) setError(e.message); }).finally(() => { if (active) setCargando(false); });
    return () => { active = false; };
  }, []);
  async function pagar(plan: Plan) {
    if (lock.current) return;
    lock.current = true; setPagando(plan.id); setError("");
    try {
      const pago = await iniciarPago(plan.id);
      sessionStorage.setItem("sportmatch_pago_pendiente", JSON.stringify({ token_ws: pago.token_ws }));
      sessionStorage.setItem("sportmatch_pago_checkout", pago.checkout_url);
      window.location.assign(pago.checkout_url);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar el pago."); lock.current = false; setPagando(null); }
  }
  return <>
    <PageHeader titulo="Mi suscripción" subtitulo="Planes del club y pagos con Webpay Plus." />
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    {cargando ? <p role="status">Cargando planes…</p> : <div className="space-y-6">
      {pendiente && <Card><p>Revisa el pago pendiente antes de iniciar otro intento.</p><Link className="text-accent underline" href="/pago/resultado">Revisar resultado</Link>
        {checkout && <a className="ml-5 text-accent underline" href={checkout}>Continuar en Webpay</a>}
      </Card>}
      <Card><h2 className="text-lg font-bold">{actual?.estado === "ACTIVE" ? actual.plan.nombre : "Sin suscripción activa"}</h2>
        {actual && <p className="mt-2 text-muted">{actual.estado === "ACTIVE" ? "Vigente hasta" : "Venció el"} {new Date(actual.fecha_fin).toLocaleDateString("es-CL")}</p>}
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {planes.map((plan) => <Card key={plan.id}>
          <h2 className="text-xl font-bold">{plan.nombre}</h2>
          <p className="my-3 text-2xl font-bold">{precioCLP(plan.precio)} <span className="text-sm font-normal text-muted">/ {plan.duracion_dias} días</span></p>
          <p className="mb-5 text-muted">{plan.descripcion}</p>
          <button className={btnPrimary} disabled={pagando !== null || (actual?.estado === "ACTIVE" && actual.plan.id !== plan.id)} onClick={() => void pagar(plan)}>
            {pagando === plan.id ? "Abriendo Webpay…" : actual?.estado === "ACTIVE" && actual.plan.id === plan.id ? "Renovar con Webpay" : "Contratar con Webpay"}
          </button>
        </Card>)}
      </div>
      {!planes.length && <p>No hay planes disponibles en este momento.</p>}
      <p className="text-sm text-muted">El pago se completa en Webpay. SportMatch no solicita ni guarda los datos completos de tu tarjeta.</p>
    </div>}
  </>;
}

export default function Page() {
  return <SoloRol roles={["club"]}><SuscripcionClub /></SoloRol>;
}
