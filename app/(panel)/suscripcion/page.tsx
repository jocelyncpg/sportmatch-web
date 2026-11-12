"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import HistorialPagos from "@/components/HistorialPagos";
import { Card, PageHeader, btnPrimary } from "@/components/ui";
import { cancelarPago, iniciarPago, listarPlanes, miSuscripcion, precioCLP, usoPlanClub, type Plan, type Suscripcion } from "@/lib/api/pagos";
import { recuperarPagoPendiente } from "@/lib/api/pago-pendiente.mjs";
import { textoSeLibera, textoUsoPlan, type UsoPlan } from "@/lib/limitePlan";

function SuscripcionClub() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [actual, setActual] = useState<Suscripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState<number | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [historialVersion, setHistorialVersion] = useState(0);
  const [uso, setUso] = useState<UsoPlan | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([listarPlanes(), miSuscripcion()]).then(async ([catalogo, suscripcion]) => {
      if (active) { setPlanes(catalogo); setActual(suscripcion); setPendiente(!!sessionStorage.getItem("sportmatch_pago_pendiente")); }
      const previo = await recuperarPagoPendiente(sessionStorage, cancelarPago);
      if (active && previo) {
        setPendiente(false);
        setHistorialVersion((version) => version + 1);
        if (previo.status === "APPROVED") setActual(previo.suscripcion);
        setMensaje(previo.status === "APPROVED" ? "El pago anterior ya fue aprobado. Puedes revisar su detalle abajo." : "El intento anterior quedó cancelado. Puedes iniciar un nuevo pago.");
      }
    }).catch((e: Error) => { if (active) setError(e.message); }).finally(() => { if (active) setCargando(false); });
    // HU-54: el uso del plan es informativo; si no responde, la página sigue igual.
    usoPlanClub().then((valor) => { if (active) setUso(valor); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  async function pagar(plan: Plan) {
    if (lock.current) return;
    lock.current = true; setPagando(plan.id); setError("");
    try {
      const previo = await recuperarPagoPendiente(sessionStorage, cancelarPago);
      if (previo?.status === "APPROVED") {
        setActual(previo.suscripcion); setPendiente(false);
        setHistorialVersion((version) => version + 1);
        setMensaje("El pago anterior ya fue aprobado. Revisa tu suscripción antes de pagar nuevamente.");
        lock.current = false; setPagando(null);
        return;
      }
      const pago = await iniciarPago(plan.id);
      sessionStorage.setItem("sportmatch_pago_pendiente", JSON.stringify({ token_ws: pago.token_ws }));
      sessionStorage.setItem("sportmatch_pago_checkout", pago.checkout_url);
      window.location.assign(pago.checkout_url);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar el pago."); lock.current = false; setPagando(null); }
  }
  const cancelarIntento = useCallback(async () => {
    if (lock.current) return;
    lock.current = true; setPagando(-1); setError("");
    try {
      const previo = await recuperarPagoPendiente(sessionStorage, cancelarPago);
      setPendiente(false);
      setHistorialVersion((version) => version + 1);
      if (previo?.status === "APPROVED") setActual(previo.suscripcion);
      setMensaje(previo?.status === "APPROVED" ? "El pago anterior ya fue aprobado." : "Intento cancelado. Puedes volver a pagar.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo verificar el pago."); }
    finally { lock.current = false; setPagando(null); }
  }, []);
  useEffect(() => {
    const revisarAlVolver = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      lock.current = false; setPagando(null);
      if (sessionStorage.getItem("sportmatch_pago_pendiente")) void cancelarIntento();
    };
    window.addEventListener("pageshow", revisarAlVolver);
    return () => window.removeEventListener("pageshow", revisarAlVolver);
  }, [cancelarIntento]);
  return <>
    <PageHeader titulo="Mi suscripción" subtitulo="Planes del club y pagos con Webpay Plus." />
    {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
    {mensaje && <p role="status" className="mb-4 text-muted">{mensaje}</p>}
    {cargando ? <p role="status">Cargando planes…</p> : <div className="space-y-6">
      {pendiente && <Card><p>Revisa el pago pendiente antes de iniciar otro intento.</p><Link className="text-accent underline" href="/pago/resultado">Revisar resultado</Link>
        <button disabled={pagando !== null} className="ml-5 text-accent underline" onClick={() => void cancelarIntento()}>Cancelar intento anterior</button>
      </Card>}
      <Card><h2 className="text-lg font-bold">{actual?.estado === "ACTIVE" ? actual.plan.nombre : "Sin suscripción activa"}</h2>
        {actual && <p className="mt-2 text-muted">{actual.estado === "ACTIVE" ? "Vigente hasta" : "Venció el"} {new Date(actual.fecha_fin).toLocaleDateString("es-CL")}</p>}
      </Card>
      {uso && uso.items.some((item) => textoUsoPlan(item)) && <Card>
        <h2 className="text-lg font-bold">Uso de tu plan</h2>
        <ul className="mt-2 space-y-1">
          {uso.items.map((item) => {
            const texto = textoUsoPlan(item);
            if (!texto) return null;
            const libera = item.limite !== null && item.usado !== null && item.usado >= item.limite
              ? textoSeLibera({ recurso: item.recurso, limite: item.limite, usado: item.usado, se_libera_en: item.se_libera_en })
              : null;
            return <li key={item.recurso}>{texto}{libera && <span className="text-sm text-muted"> · {libera}</span>}</li>;
          })}
        </ul>
        {uso.plan === "GRATIS" && <p className="mt-2 text-sm text-muted">Con un plan pagado no tienes estos límites.</p>}
      </Card>}
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
      <HistorialPagos key={historialVersion} />
      <p className="text-sm text-muted">El pago se completa en Webpay. SportMatch no solicita ni guarda los datos completos de tu tarjeta.</p>
    </div>}
  </>;
}

export default function Page() {
  return <SoloRol roles={["club"]}><SuscripcionClub /></SoloRol>;
}
