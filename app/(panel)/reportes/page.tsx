"use client";

import { useMemo, useState } from "react";
import FormSancion from "@/components/FormSancion";
import { SoloRol, useSesion } from "@/components/SesionContext";
import { BadgeReporte, Card, Chip, PageHeader, btnGhost, btnPrimary, fechaHora, inputClass } from "@/components/ui";
import {
  ETIQUETA_TIPO,
  marcarRevisado,
  reportesPorUsuario,
  sancionVigenteDe,
  useModeracion,
  type EstadoReporte,
} from "@/lib/moderacion.mock";

// HU-47: el moderador atiende los reportes de la comunidad: los revisa o los escala a sanción (HU-45).
export default function ReportesPage() {
  return (
    <SoloRol roles={["admin"]}>
      <Contenido />
    </SoloRol>
  );
}

type Filtro = EstadoReporte | "todos";
const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "revisado", etiqueta: "Revisados" },
  { valor: "escalado", etiqueta: "Escalados" },
  { valor: "todos", etiqueta: "Todos" },
];

function Contenido() {
  const sesion = useSesion();
  const { reportes, sanciones } = useModeracion();
  const [filtro, setFiltro] = useState<Filtro>("pendiente");
  const [abierto, setAbierto] = useState<{ id: string; modo: "revisar" | "sancionar" } | null>(null);
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const conteo = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of reportesPorUsuario(reportes)) m.set(u.usuarioId, u.total);
    return m;
  }, [reportes]);

  const lista = reportes
    .filter((r) => filtro === "todos" || r.estado === filtro)
    .sort((a, b) => {
      const dif = new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
      // Pendientes: primero los más antiguos. El resto: primero los más recientes.
      return filtro === "pendiente" ? dif : -dif;
    });

  const pendientes = reportes.filter((r) => r.estado === "pendiente").length;

  function abrir(id: string, modo: "revisar" | "sancionar") {
    setAbierto({ id, modo });
    setNota("");
    setError("");
    setMensaje("");
  }

  function revisar(id: string) {
    const r = marcarRevisado(id, sesion.email, nota);
    if (!r.ok) {
      setError(r.motivo);
      return;
    }
    setAbierto(null);
    setMensaje("Reporte marcado como revisado. Quedó registrado en la auditoría.");
  }

  return (
    <section className="max-w-4xl">
      <PageHeader
        titulo="Reportes"
        subtitulo={
          pendientes === 0
            ? "No hay reportes pendientes."
            : `${pendientes} ${pendientes === 1 ? "reporte pendiente" : "reportes pendientes"} de la comunidad.`
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <Chip key={f.valor} activo={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.etiqueta}
          </Chip>
        ))}
      </div>

      {mensaje ? (
        <p className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{mensaje}</p>
      ) : null}

      {lista.length === 0 ? (
        <p className="text-sm text-muted">No hay reportes con este filtro.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((r) => {
            const total = conteo.get(r.usuarioId) ?? 0;
            const vigente = sancionVigenteDe(sanciones, r.usuarioId);
            const panel = abierto?.id === r.id ? abierto.modo : null;
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip>{ETIQUETA_TIPO[r.tipo]}</Chip>
                    <span className="text-xs text-muted">{r.referencia}</span>
                  </div>
                  <BadgeReporte estado={r.estado} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="font-bold">{r.usuarioNombre}</p>
                  {total > 1 ? (
                    <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-bold text-danger">
                      {total} reportes
                    </span>
                  ) : null}
                  {vigente ? (
                    <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-bold text-muted">
                      Ya suspendida
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm font-semibold">{r.motivo}</p>
                {r.detalle ? <p className="mt-1 text-sm text-muted">{r.detalle}</p> : null}
                <p className="mt-2 text-xs text-muted">
                  Emitido por {r.emitidoPor} · {fechaHora(r.creadoEn)}
                </p>

                {r.estado !== "pendiente" && r.resueltoEn ? (
                  <p className="mt-3 rounded-[13px] bg-subtle px-3 py-2 text-xs text-muted">
                    {r.estado === "escalado" ? "Escalado a sanción" : "Revisado"} por {r.resueltoPor} ·{" "}
                    {fechaHora(r.resueltoEn)}
                    {r.nota ? ` · ${r.nota}` : ""}
                  </p>
                ) : null}

                {r.estado === "pendiente" && !panel ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className={btnGhost} onClick={() => abrir(r.id, "revisar")}>
                      Marcar como revisado
                    </button>
                    <button
                      className={`${btnGhost} text-danger`}
                      disabled={!!vigente}
                      title={vigente ? "Esta persona ya tiene una suspensión vigente" : undefined}
                      onClick={() => abrir(r.id, "sancionar")}
                    >
                      Escalar a sanción
                    </button>
                  </div>
                ) : null}

                {panel === "revisar" ? (
                  <div className="mt-4 space-y-3 rounded-[13px] border border-border bg-subtle p-4">
                    <p className="text-sm font-bold">Marcar como revisado (sin sanción)</p>
                    <textarea
                      rows={2}
                      className={inputClass}
                      placeholder="Nota opcional: qué se revisó y por qué no hay sanción."
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                    />
                    {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      <button className={btnPrimary} onClick={() => revisar(r.id)}>
                        Confirmar
                      </button>
                      <button className={btnGhost} onClick={() => setAbierto(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                {panel === "sancionar" ? (
                  <FormSancion
                    usuarioId={r.usuarioId}
                    usuarioNombre={r.usuarioNombre}
                    reporteId={r.id}
                    admin={sesion.email}
                    onListo={(aviso) => {
                      setAbierto(null);
                      setMensaje(aviso);
                    }}
                    onCancelar={() => setAbierto(null)}
                  />
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}