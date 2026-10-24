"use client";

import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Card, Chip, EstadoVacio, PageHeader, btnGhost, fechaHora, inputClass } from "@/components/ui";
import { ETIQUETA_ACCION, useModeracion, type AccionAdmin, type RegistroAuditoria } from "@/lib/moderacion.mock";

// HU-48: registro de las acciones de moderación (fecha y hora, admin, recurso afectado y motivo).
// Es solo de lectura: nadie puede editar ni borrar un registro desde el panel.
export default function AuditoriaPage() {
  return (
    <SoloRol roles={["admin"]}>
      <Contenido />
    </SoloRol>
  );
}

type FiltroAccion = AccionAdmin | "todas";
const ACCIONES: { valor: FiltroAccion; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "reporte_revisado", etiqueta: ETIQUETA_ACCION.reporte_revisado },
  { valor: "sancion_aplicada", etiqueta: ETIQUETA_ACCION.sancion_aplicada },
  { valor: "sancion_levantada", etiqueta: ETIQUETA_ACCION.sancion_levantada },
];

// Evita que Excel interprete un texto libre como fórmula (=, +, -, @).
const seguro = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);
const celda = (v: string) => `"${seguro(v).replace(/"/g, '""')}"`;

function descargarCsv(filas: RegistroAuditoria[]) {
  const cabecera = ["Fecha y hora", "Fecha (ISO)", "Admin", "Acción", "Detalle", "Recurso afectado", "Motivo"];
  const cuerpo = filas.map((f) =>
    [fechaHora(f.fecha), f.fecha, f.admin, ETIQUETA_ACCION[f.accion], f.resumen, f.recurso, f.motivo].map(celda).join(",")
  );
  const csv = "\uFEFF" + [cabecera.map(celda).join(","), ...cuerpo].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "auditoria-sportmatch.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Contenido() {
  const { auditoria } = useModeracion();
  const [accion, setAccion] = useState<FiltroAccion>("todas");
  const [admin, setAdmin] = useState("");
  const [texto, setTexto] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const admins = useMemo(() => Array.from(new Set(auditoria.map((a) => a.admin))).sort(), [auditoria]);

  const lista = useMemo(() => {
    const t = texto.trim().toLowerCase();
    const ini = desde ? new Date(`${desde}T00:00:00`).getTime() : null;
    const fin = hasta ? new Date(`${hasta}T23:59:59.999`).getTime() : null;
    return auditoria
      .filter((r) => {
        const ms = new Date(r.fecha).getTime();
        return (
          (accion === "todas" || r.accion === accion) &&
          (!admin || r.admin === admin) &&
          (ini === null || ms >= ini) &&
          (fin === null || ms <= fin) &&
          (!t || `${r.recurso} ${r.motivo} ${r.resumen} ${r.admin}`.toLowerCase().includes(t))
        );
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [auditoria, accion, admin, texto, desde, hasta]);

  const hayFiltros = accion !== "todas" || admin !== "" || texto !== "" || desde !== "" || hasta !== "";

  function limpiar() {
    setAccion("todas");
    setAdmin("");
    setTexto("");
    setDesde("");
    setHasta("");
  }

  return (
    <section>
      <PageHeader
        titulo="Auditoría"
        subtitulo="Historial de las acciones de moderación. Cada acción queda registrada automáticamente."
        accion={
          <button className={btnGhost} disabled={lista.length === 0} onClick={() => descargarCsv(lista)}>
            Descargar CSV
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ACCIONES.map((a) => (
          <Chip key={a.valor} activo={accion === a.valor} onClick={() => setAccion(a.valor)}>
            {a.etiqueta}
          </Chip>
        ))}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Buscar por recurso, motivo o admin…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <select className={inputClass} value={admin} onChange={(e) => setAdmin(e.target.value)}>
          <option value="">Todos los admins</option>
          {admins.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Desde"
          className={inputClass}
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
        <input
          type="date"
          aria-label="Hasta"
          className={inputClass}
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>
          {lista.length} de {auditoria.length} {auditoria.length === 1 ? "registro" : "registros"}
        </span>
        {hayFiltros ? (
          <button className="font-semibold text-accent" onClick={limpiar}>
            Quitar filtros
          </button>
        ) : null}
      </div>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={ClipboardList}
          titulo="Sin registros"
          texto={hayFiltros ? "Ningún registro coincide con estos filtros." : "Todavía no hay acciones registradas."}
        />
      ) : (
        <Card flush className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-5 py-3 font-semibold">Fecha y hora</th>
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Acción</th>
                <th className="px-5 py-3 font-semibold">Recurso afectado</th>
                <th className="px-5 py-3 font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted">{fechaHora(r.fecha)}</td>
                  <td className="px-5 py-3">{r.admin}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{ETIQUETA_ACCION[r.accion]}</p>
                    <p className="text-xs text-muted">{r.resumen}</p>
                  </td>
                  <td className="px-5 py-3">{r.recurso}</td>
                  <td className="px-5 py-3 text-muted">{r.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}