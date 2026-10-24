"use client";

import { useMemo, useState } from "react";
import FormSancion from "@/components/FormSancion";
import { SoloRol, useSesion } from "@/components/SesionContext";
import { Card, PageHeader, btnGhost, btnPrimary, fechaHora, inputClass } from "@/components/ui";
import {
  estaActiva,
  levantarSancion,
  reportesPorUsuario,
  sancionVigenteDe,
  textoDuracion,
  useModeracion,
  type Sancion,
} from "@/lib/moderacion.mock";

// HU-45: suspender (temporal o definitiva) a quienes acumulan reportes o conductas indebidas.
export default function SancionesPage() {
  return (
    <SoloRol roles={["admin"]}>
      <Contenido />
    </SoloRol>
  );
}

function Contenido() {
  const sesion = useSesion();
  const { reportes, sanciones } = useModeracion();
  const [sancionando, setSancionando] = useState<string | null>(null);
  const [levantando, setLevantando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const personas = useMemo(() => reportesPorUsuario(reportes), [reportes]);
  const ordenadas = [...sanciones].sort((a, b) => new Date(b.aplicadaEn).getTime() - new Date(a.aplicadaEn).getTime());
  const vigentes = ordenadas.filter((s) => estaActiva(s));
  const historial = ordenadas.filter((s) => !estaActiva(s));

  function abrirLevantar(id: string) {
    setLevantando(id);
    setMotivo("");
    setError("");
    setMensaje("");
  }

  function levantar(id: string) {
    const r = levantarSancion(id, sesion.email, motivo);
    if (!r.ok) {
      setError(r.motivo);
      return;
    }
    setLevantando(null);
    setMensaje("Se devolvió el acceso a la cuenta. Quedó registrado en la auditoría.");
  }

  return (
    <section className="max-w-4xl">
      <PageHeader
        titulo="Sanciones"
        subtitulo="Suspende cuentas con conductas indebidas. La persona recibe una notificación con el motivo y la duración."
      />

      {mensaje ? (
        <p className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{mensaje}</p>
      ) : null}

      <h2 className="mb-3 text-sm font-bold">Personas con reportes</h2>
      {personas.length === 0 ? (
        <p className="text-sm text-muted">Nadie tiene reportes activos.</p>
      ) : (
        <div className="space-y-3">
          {personas.map((p) => {
            const vigente = sancionVigenteDe(sanciones, p.usuarioId);
            return (
              <Card key={p.usuarioId}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{p.usuarioNombre}</p>
                    <p className="text-xs text-muted">
                      {p.total} {p.total === 1 ? "reporte" : "reportes"}
                      {p.pendientes > 0 ? ` · ${p.pendientes} sin resolver` : ""}
                    </p>
                  </div>
                  {vigente ? (
                    <span className="rounded-full bg-subtle px-3 py-1 text-xs font-bold text-muted">
                      Suspendida ({textoDuracion(vigente)})
                    </span>
                  ) : sancionando === p.usuarioId ? null : (
                    <button
                      className={`${btnGhost} text-danger`}
                      onClick={() => {
                        setSancionando(p.usuarioId);
                        setMensaje("");
                      }}
                    >
                      Suspender
                    </button>
                  )}
                </div>
                {sancionando === p.usuarioId && !vigente ? (
                  <FormSancion
                    usuarioId={p.usuarioId}
                    usuarioNombre={p.usuarioNombre}
                    admin={sesion.email}
                    onListo={(aviso) => {
                      setSancionando(null);
                      setMensaje(aviso);
                    }}
                    onCancelar={() => setSancionando(null)}
                  />
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-bold">Suspensiones vigentes</h2>
      {vigentes.length === 0 ? (
        <p className="text-sm text-muted">No hay cuentas suspendidas ahora.</p>
      ) : (
        <div className="space-y-3">
          {vigentes.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{s.usuarioNombre}</p>
                  <p className="text-xs text-muted">
                    {s.tipo === "definitiva"
                      ? "Suspensión definitiva"
                      : `Suspensión de ${textoDuracion(s)} · hasta ${fechaHora(s.terminaEn as string)}`}
                  </p>
                </div>
                {levantando === s.id ? null : (
                  <button className={btnGhost} onClick={() => abrirLevantar(s.id)}>
                    Levantar suspensión
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm">{s.motivo}</p>
              <p className="mt-1 text-xs text-muted">
                Aplicada por {s.aplicadaPor} · {fechaHora(s.aplicadaEn)}
              </p>

              {levantando === s.id ? (
                <div className="mt-4 space-y-3 rounded-[13px] border border-border bg-subtle p-4">
                  <p className="text-sm font-bold">Levantar la suspensión de {s.usuarioNombre}</p>
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="Motivo (queda en la auditoría)."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button className={btnPrimary} onClick={() => levantar(s.id)}>
                      Confirmar
                    </button>
                    <button className={btnGhost} onClick={() => setLevantando(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-bold">Historial</h2>
      {historial.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay sanciones terminadas.</p>
      ) : (
        <div className="space-y-3">
          {historial.map((s) => (
            <Card key={s.id}>
              <p className="font-bold">{s.usuarioNombre}</p>
              <p className="text-xs text-muted">{resumenTerminada(s)}</p>
              <p className="mt-2 text-sm">{s.motivo}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function resumenTerminada(s: Sancion): string {
  const base = s.tipo === "definitiva" ? "Suspensión definitiva" : `Suspensión de ${textoDuracion(s)}`;
  if (s.levantadaEn) return `${base} · levantada el ${fechaHora(s.levantadaEn)}`;
  return `${base} · terminó el ${fechaHora(s.terminaEn as string)}`;
}