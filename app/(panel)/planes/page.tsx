"use client";

import { BadgePercent, Check } from "lucide-react";
import { useState } from "react";
import FormOferta from "@/components/FormOferta";
import { SoloRol, useSesion } from "@/components/SesionContext";
import {
  Card,
  Chip,
  EstadoVacio,
  PageHeader,
  StatStrip,
  btnGhost,
  btnPrimary,
  fechaCorta,
  fechaHora,
  inputClass,
} from "@/components/ui";
import {
  catalogoPublico,
  desactivarOferta,
  estaVigente,
  ETIQUETA_AUDIENCIA,
  ETIQUETA_TIPO_OFERTA,
  formatearCLP,
  precioTexto,
  reactivarOferta,
  ultimoVencimiento,
  usePlanes,
  vigentesDe,
  type Audiencia,
  type Oferta,
} from "@/lib/planes.mock";

// HU-56: el administrador de la plataforma mantiene al día la oferta de SportMatch (planes y convenios).
export default function PlanesPage() {
  return (
    <SoloRol roles={["admin"]}>
      <Contenido />
    </SoloRol>
  );
}

type Filtro = "todos" | "plan" | "convenio" | "desactivados";
const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "plan", etiqueta: "Planes" },
  { valor: "convenio", etiqueta: "Convenios" },
  { valor: "desactivados", etiqueta: "Desactivados" },
];

function Estado({ activa }: { activa: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full" style={{ background: activa ? "var(--success)" : "var(--muted)" }} />
      {activa ? "Activo en el catálogo" : "Desactivado"}
    </span>
  );
}

const dia = (iso: string) => fechaCorta(iso.slice(0, 10));

function Contenido() {
  const sesion = useSesion();
  const { ofertas, suscripciones } = usePlanes();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [creando, setCreando] = useState(false);
  const [abierto, setAbierto] = useState<{ id: string; modo: "editar" | "desactivar" } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const lista = ofertas
    .filter((o) =>
      filtro === "todos" ? true : filtro === "desactivados" ? !o.activa : o.tipo === filtro && o.activa
    )
    .sort(
      (a, b) =>
        Number(b.activa) - Number(a.activa) ||
        a.audiencia.localeCompare(b.audiencia) ||
        a.precio - b.precio ||
        a.nombre.localeCompare(b.nombre)
    );

  const activas = ofertas.filter((o) => o.activa).length;
  const vigentesTotal = suscripciones.filter((s) => estaVigente(s)).length;

  function abrir(id: string, modo: "editar" | "desactivar") {
    setAbierto({ id, modo });
    setCreando(false);
    setMotivo("");
    setError("");
    setMensaje("");
  }

  function desactivar(id: string) {
    const r = desactivarOferta(id, sesion.email, motivo);
    if (!r.ok) {
      setError(r.motivo);
      return;
    }
    setAbierto(null);
    setMensaje(r.aviso);
  }

  function reactivar(id: string) {
    const r = reactivarOferta(id, sesion.email);
    setMensaje(r.ok ? r.aviso : r.motivo);
  }

  const porAudiencia: Audiencia[] = ["deportista", "club"];
  const ordenadas = [...suscripciones].sort(
    (a, b) =>
      Number(estaVigente(b)) - Number(estaVigente(a)) ||
      new Date(b.fin ?? "9999-12-31").getTime() - new Date(a.fin ?? "9999-12-31").getTime()
  );

  return (
    <section className="max-w-5xl">
      <PageHeader
        titulo="Planes y convenios"
        subtitulo="Mantén al día la oferta de SportMatch. Cada cambio queda en la auditoría."
        accion={
          <button
            className={btnPrimary}
            onClick={() => {
              setCreando(true);
              setAbierto(null);
              setMensaje("");
            }}
          >
            Nuevo plan o convenio
          </button>
        }
      />

      <StatStrip
        items={[
          { valor: activas, etiqueta: "Activos en el catálogo" },
          { valor: ofertas.length - activas, etiqueta: "Desactivados" },
          { valor: vigentesTotal, etiqueta: "Suscripciones vigentes", nota: "Incluye las de planes desactivados" },
        ]}
      />

      {mensaje ? (
        <p className="mt-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{mensaje}</p>
      ) : null}

      {creando ? (
        <FormOferta
          admin={sesion.email}
          onListo={(aviso) => {
            setCreando(false);
            setMensaje(aviso);
          }}
          onCancelar={() => setCreando(false)}
        />
      ) : null}

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <Chip key={f.valor} activo={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.etiqueta}
          </Chip>
        ))}
      </div>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={BadgePercent}
          titulo="Nada con este filtro"
          texto="Prueba con otro filtro o crea un plan o convenio nuevo."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((o) => (
            <TarjetaOferta
              key={o.id}
              oferta={o}
              suscripciones={suscripciones}
              panel={abierto?.id === o.id ? abierto.modo : null}
              admin={sesion.email}
              motivo={motivo}
              setMotivo={setMotivo}
              error={error}
              onEditar={() => abrir(o.id, "editar")}
              onDesactivar={() => abrir(o.id, "desactivar")}
              onConfirmarDesactivar={() => desactivar(o.id)}
              onReactivar={() => reactivar(o.id)}
              onCerrar={() => setAbierto(null)}
              onListo={(aviso) => {
                setAbierto(null);
                setMensaje(aviso);
              }}
            />
          ))}
        </div>
      )}

      <h2 className="mb-1 mt-10 text-sm font-bold">Así se ve en el catálogo</h2>
      <p className="mb-3 text-sm text-muted">
        Es lo que ven las personas al contratar. Los planes desactivados no aparecen.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {porAudiencia.map((a) => {
          const visibles = catalogoPublico(ofertas, a);
          return (
            <Card key={a}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{ETIQUETA_AUDIENCIA[a]}</p>
              {visibles.length === 0 ? (
                <p className="text-sm text-muted">No hay ofertas activas para esta audiencia.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {visibles.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="font-semibold">{o.nombre}</span>
                      <span className="text-muted">{precioTexto(o)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <h2 className="mb-1 mt-10 text-sm font-bold">Suscripciones</h2>
      <p className="mb-3 text-sm text-muted">
        Cada suscripción guarda el precio que la persona pagó. Cambiar el precio de un plan no la modifica.
      </p>
      <Card flush className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-5 py-3 font-semibold">Suscriptor</th>
              <th className="px-5 py-3 font-semibold">Plan o convenio</th>
              <th className="px-5 py-3 font-semibold">Precio pagado</th>
              <th className="px-5 py-3 font-semibold">Vence</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ordenadas.map((s) => {
              const oferta = ofertas.find((o) => o.id === s.ofertaId);
              const vigente = estaVigente(s);
              return (
                <tr key={s.id} className="align-top">
                  <td className="px-5 py-3">{s.suscriptor}</td>
                  <td className="px-5 py-3">
                    {s.ofertaNombre}
                    {oferta && !oferta.activa ? <span className="ml-2 text-xs text-muted">(desactivado)</span> : null}
                  </td>
                  <td className="px-5 py-3">
                    {formatearCLP(s.precioPagado)}
                    {oferta && oferta.precio !== s.precioPagado ? (
                      <span className="ml-2 text-xs text-muted">hoy {formatearCLP(oferta.precio)}</span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted">{s.fin ? dia(s.fin) : "Sin vencimiento"}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: vigente ? "var(--success)" : "var(--muted)" }}
                      />
                      {vigente ? "Vigente" : "Vencida"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function TarjetaOferta({
  oferta: o,
  suscripciones,
  panel,
  admin,
  motivo,
  setMotivo,
  error,
  onEditar,
  onDesactivar,
  onConfirmarDesactivar,
  onReactivar,
  onCerrar,
  onListo,
}: {
  oferta: Oferta;
  suscripciones: ReturnType<typeof usePlanes>["suscripciones"];
  panel: "editar" | "desactivar" | null;
  admin: string;
  motivo: string;
  setMotivo: (v: string) => void;
  error: string;
  onEditar: () => void;
  onDesactivar: () => void;
  onConfirmarDesactivar: () => void;
  onReactivar: () => void;
  onCerrar: () => void;
  onListo: (aviso: string) => void;
}) {
  const vigentes = vigentesDe(suscripciones, o.id);
  const hasta = ultimoVencimiento(vigentes);

  return (
    <Card className={o.activa ? "" : "opacity-90"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{ETIQUETA_TIPO_OFERTA[o.tipo]}</Chip>
          <span className="text-xs text-muted">{ETIQUETA_AUDIENCIA[o.audiencia]}</span>
        </div>
        <Estado activa={o.activa} />
      </div>

      <p className="mt-3 text-lg font-bold tracking-tight">{o.nombre}</p>
      {o.institucion ? <p className="text-xs text-muted">Institución: {o.institucion}</p> : null}
      <p className="mt-1 text-sm font-semibold text-accent">{precioTexto(o)}</p>
      {o.descripcion ? <p className="mt-1 text-sm text-muted">{o.descripcion}</p> : null}

      <ul className="mt-3 space-y-1.5 text-sm">
        {o.beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <Check size={15} className="mt-0.5 shrink-0 text-success" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted">
        {vigentes.length === 0
          ? "Sin suscripciones vigentes"
          : `${vigentes.length} ${vigentes.length === 1 ? "suscripción vigente" : "suscripciones vigentes"}${
              !o.activa && hasta ? ` · siguen hasta el ${dia(hasta)}` : ""
            }`}
      </p>
      {!o.activa && o.desactivadaEn ? (
        <p className="mt-2 rounded-[13px] bg-subtle px-3 py-2 text-xs text-muted">
          Desactivado el {fechaHora(o.desactivadaEn)}
          {o.motivoDesactivacion ? ` · ${o.motivoDesactivacion}` : ""}
        </p>
      ) : null}

      {!panel ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={btnGhost} onClick={onEditar}>
            Editar
          </button>
          {o.activa ? (
            o.base ? (
              <span className="self-center text-xs text-muted">Plan base: no se puede desactivar</span>
            ) : (
              <button className={`${btnGhost} text-danger`} onClick={onDesactivar}>
                Desactivar
              </button>
            )
          ) : (
            <button className={btnGhost} onClick={onReactivar}>
              Reactivar
            </button>
          )}
        </div>
      ) : null}

      {panel === "editar" ? (
        <FormOferta oferta={o} vigentes={vigentes.length} admin={admin} onListo={onListo} onCancelar={onCerrar} />
      ) : null}

      {panel === "desactivar" ? (
        <div className="mt-4 space-y-3 rounded-[13px] border border-border bg-subtle p-4">
          <p className="text-sm font-bold">Desactivar {o.nombre}</p>
          <p className="text-sm text-muted">
            Dejará de mostrarse en el catálogo.{" "}
            {vigentes.length === 0
              ? "No tiene suscripciones vigentes."
              : `${
                  vigentes.length === 1
                    ? "La suscripción vigente sigue activa"
                    : `Las ${vigentes.length} suscripciones vigentes siguen activas`
                }${hasta ? ` hasta el ${dia(hasta)}` : ""}.`}
          </p>
          <textarea
            rows={2}
            className={inputClass}
            placeholder="Motivo (queda en la auditoría)."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={onConfirmarDesactivar}>
              Confirmar
            </button>
            <button className={btnGhost} onClick={onCerrar}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}