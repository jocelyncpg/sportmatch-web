"use client";

import { Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Card, Chip, EstadoVacio, PageHeader, btnGhost, fechaHora, inputClass } from "@/components/ui";
import { formatearCLP } from "@/lib/api/ofertas";
import {
  csvPagos,
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO_PAGO,
  ETIQUETA_TIPO,
  MAX_FILAS_EXPORTACION,
  nombreArchivoCsv,
} from "@/lib/api/pagos-admin.mjs";
import {
  LIMITE_PAGOS,
  listarPagosAdmin,
  todosLosPagosAdmin,
  type CategoriaPago,
  type EstadoPago,
  type PagoAdmin,
  type PaginaPagosAdmin,
  type TipoSuscriptor,
} from "@/lib/api/pagosAdmin";

// HU-57: todos los pagos de la plataforma para el administrador. Es SOLO DE LECTURA: ni el panel ni ms-pago tienen
// forma de modificar un pago (solo cambia por el flujo de Webpay).
export default function PagosPage() {
  return (
    <SoloRol roles={["admin"]}>
      <Contenido />
    </SoloRol>
  );
}

const ESTADOS: { valor: EstadoPago | ""; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todos" },
  { valor: "APPROVED", etiqueta: "Aprobados" },
  { valor: "PENDING", etiqueta: "Pendientes" },
  { valor: "REJECTED", etiqueta: "Rechazados" },
  { valor: "CANCELLED", etiqueta: "Anulados" },
];

const COLOR_ESTADO: Record<EstadoPago, string> = {
  APPROVED: "var(--success)",
  PENDING: "var(--accent)",
  REJECTED: "var(--danger)",
  CANCELLED: "var(--muted)",
};

const ESTADO_PERIODO: Record<NonNullable<PagoAdmin["periodo"]>["estado"], string> = {
  VIGENTE: "Vigente",
  PROGRAMADO: "Renovación: empieza al terminar el actual",
  TERMINADO: "Terminado",
};

const dia = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });

function descargar(texto: string, nombre: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function Contenido() {
  const [estado, setEstado] = useState<EstadoPago | "">("");
  const [categoria, setCategoria] = useState<CategoriaPago | "">("");
  const [tipo, setTipo] = useState<TipoSuscriptor | "">("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);
  // Última respuesta y la consulta a la que corresponde: mientras la consulta actual no llega, se sigue mostrando la
  // anterior atenuada (cargando se deriva de la clave, sin setState dentro del efecto).
  const [resultado, setResultado] = useState<{ clave: string; datos: PaginaPagosAdmin | null; error: string }>({
    clave: "",
    datos: null,
    error: "",
  });
  const [exportando, setExportando] = useState(false);
  const [aviso, setAviso] = useState("");

  const rangoInvalido = desde !== "" && hasta !== "" && desde > hasta;
  const filtro = { estado, categoria, tipo, desde, hasta };
  const clave = JSON.stringify({ ...filtro, page });
  const datos = resultado.datos;
  const cargando = !rangoInvalido && resultado.clave !== clave;
  const error = resultado.clave === clave ? resultado.error : "";
  const hayFiltros = estado !== "" || categoria !== "" || tipo !== "" || desde !== "" || hasta !== "";
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / LIMITE_PAGOS)) : 1;

  useEffect(() => {
    if (rangoInvalido) return;
    let vigente = true;
    listarPagosAdmin({ estado, categoria, tipo, desde, hasta, page })
      .then((r) => {
        if (vigente) setResultado({ clave, datos: r, error: "" });
      })
      .catch((e: unknown) => {
        if (vigente) {
          const mensaje = e instanceof Error ? e.message : "No se pudieron cargar los pagos.";
          setResultado((prev) => ({ clave, datos: prev.datos, error: mensaje }));
        }
      });
    return () => {
      vigente = false;
    };
  }, [clave, estado, categoria, tipo, desde, hasta, page, rangoInvalido]);

  // Cualquier cambio de filtro vuelve a la primera página.
  function cambiar<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v);
      setPage(1);
      setAviso("");
    };
  }

  function limpiar() {
    setEstado("");
    setCategoria("");
    setTipo("");
    setDesde("");
    setHasta("");
    setPage(1);
    setAviso("");
  }

  async function exportar() {
    setExportando(true);
    setAviso("");
    try {
      const { filas, total, truncado } = await todosLosPagosAdmin(filtro);
      descargar(csvPagos(filas), nombreArchivoCsv(filtro));
      setAviso(
        truncado
          ? `Se exportaron los primeros ${MAX_FILAS_EXPORTACION.toLocaleString("es-CL")} de ${total.toLocaleString("es-CL")} pagos. Acota el rango de fechas para exportar el resto.`
          : `Se exportaron ${filas.length} ${filas.length === 1 ? "pago" : "pagos"}.`,
      );
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo exportar.");
    } finally {
      setExportando(false);
    }
  }

  const filas = datos?.items ?? [];

  return (
    <section>
      <PageHeader
        titulo="Pagos"
        subtitulo="Todos los pagos de la plataforma. Solo lectura: un pago no se puede modificar desde el panel."
        accion={
          <button
            className={btnGhost}
            disabled={exportando || rangoInvalido || !datos || datos.total === 0}
            onClick={exportar}
          >
            {exportando ? "Exportando…" : "Descargar CSV"}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ESTADOS.map((e) => (
          <Chip key={e.valor || "todos"} activo={estado === e.valor} onClick={() => cambiar(setEstado)(e.valor)}>
            {e.etiqueta}
          </Chip>
        ))}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <select
          aria-label="Categoría"
          className={inputClass}
          value={categoria}
          onChange={(e) => cambiar(setCategoria)(e.target.value as CategoriaPago | "")}
        >
          <option value="">Planes y convenios</option>
          <option value="PLAN">Solo planes</option>
          <option value="CONVENIO">Solo convenios</option>
        </select>
        <select
          aria-label="Tipo"
          className={inputClass}
          value={tipo}
          onChange={(e) => cambiar(setTipo)(e.target.value as TipoSuscriptor | "")}
        >
          <option value="">Deportistas y clubes</option>
          <option value="USUARIO">Solo deportistas</option>
          <option value="CLUB">Solo clubes</option>
        </select>
        <input
          type="date"
          aria-label="Desde"
          title="Desde (incluido)"
          className={inputClass}
          value={desde}
          max={hasta || undefined}
          onChange={(e) => cambiar(setDesde)(e.target.value)}
        />
        <input
          type="date"
          aria-label="Hasta"
          title="Hasta (incluido)"
          className={inputClass}
          value={hasta}
          min={desde || undefined}
          onChange={(e) => cambiar(setHasta)(e.target.value)}
        />
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>
          {rangoInvalido
            ? "La fecha «desde» no puede ser posterior a «hasta»."
            : datos
              ? `${datos.total.toLocaleString("es-CL")} ${datos.total === 1 ? "pago" : "pagos"}`
              : ""}
        </span>
        {hayFiltros ? (
          <button className="font-semibold text-accent" onClick={limpiar}>
            Quitar filtros
          </button>
        ) : null}
      </div>

      {aviso ? <p className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{aviso}</p> : null}

      {error || rangoInvalido || (!cargando && filas.length === 0) ? (
        <EstadoVacio
          icono={Receipt}
          titulo={error ? "No se pudieron cargar los pagos" : "Sin pagos"}
          texto={
            error ||
            (rangoInvalido
              ? "Corrige el rango de fechas."
              : hayFiltros
                ? "Ningún pago coincide con estos filtros."
                : "Todavía no hay pagos en la plataforma.")
          }
        />
      ) : (
        <Card flush className={`overflow-x-auto ${cargando ? "opacity-60" : ""}`}>
          <table className="w-full min-w-[960px] text-left text-sm" aria-busy={cargando}>
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Deportista o club</th>
                <th className="px-5 py-3 font-semibold">Plan o convenio</th>
                <th className="px-5 py-3 font-semibold">Monto</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Autorización</th>
                <th className="px-5 py-3 font-semibold">Suscripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((p) => (
                <Fila key={p.id} pago={p} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {datos && datos.total > LIMITE_PAGOS && !error && !rangoInvalido ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button className={btnGhost} disabled={page <= 1 || cargando} onClick={() => setPage((n) => n - 1)}>
            Anterior
          </button>
          <span className="text-muted">
            Página {page} de {paginas}
          </span>
          <button className={btnGhost} disabled={page >= paginas || cargando} onClick={() => setPage((n) => n + 1)}>
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Fila({ pago: p }: { pago: PagoAdmin }) {
  return (
    <tr className="align-top">
      <td className="whitespace-nowrap px-5 py-3 text-muted">{fechaHora(p.fecha)}</td>
      <td className="px-5 py-3">
        <p className="font-semibold">{p.suscriptor_nombre ?? "Nombre no disponible"}</p>
        <p className="text-xs text-muted">{ETIQUETA_TIPO[p.tipo_suscriptor]}</p>
      </td>
      <td className="px-5 py-3">
        <p>{p.plan.nombre}</p>
        <p className="text-xs text-muted">{ETIQUETA_CATEGORIA[p.plan.categoria]}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-3 font-semibold">{formatearCLP(p.monto)}</td>
      <td className="px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR_ESTADO[p.estado] }} />
          {ETIQUETA_ESTADO_PAGO[p.estado]}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-3">
        {p.codigo_autorizacion ? <p className="font-mono">{p.codigo_autorizacion}</p> : <p className="text-muted">—</p>}
        {p.card_last4 ? <p className="text-xs text-muted">Tarjeta •••• {p.card_last4}</p> : null}
        <p className="text-xs text-muted" title="Orden de compra">{p.buy_order}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-3">
        {p.periodo ? (
          <>
            <p>
              {dia(p.periodo.fecha_inicio)} – {dia(p.periodo.fecha_fin)}
            </p>
            <p className="text-xs text-muted">{ESTADO_PERIODO[p.periodo.estado]}</p>
          </>
        ) : (
          <p className="text-muted">—</p>
        )}
      </td>
    </tr>
  );
}
