"use client";

import { CalendarDays, Megaphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Campo,
  Card,
  Chip,
  EstadoVacio,
  PageHeader,
  btnGhost,
  btnPrimary,
  fechaCorta,
  inputClass,
} from "@/components/ui";
import { useClub, ClubState } from "./useClub";
import { listarDeportes, type Deporte } from "@/lib/api/club";
import {
  cerrarConvocatoria,
  listarConvocatoriasClub,
  publicarConvocatoria,
  type Convocatoria,
  type ConvocatoriaCreate,
} from "@/lib/api/convocatorias";

const etiquetaEstado: Record<string, string> = { ABIERTA: "Abierta", CERRADA: "Cerrada", FINALIZADA: "Finalizada" };
const errorDe = (error: unknown) => error instanceof Error ? error.message : "No se pudo completar la solicitud.";

function fechaConZona(fecha: string) {
  const hora = "18:00:00";
  const offset = -new Date(`${fecha}T${hora}`).getTimezoneOffset();
  const signo = offset >= 0 ? "+" : "-";
  const absoluto = Math.abs(offset);
  const horas = String(Math.floor(absoluto / 60)).padStart(2, "0");
  const minutos = String(absoluto % 60).padStart(2, "0");
  return `${fecha}T${hora}${signo}${horas}:${minutos}`;
}

export default function ConvocatoriasClub() {
  const { club, cargando, error } = useClub();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    if (!club) return;
    setCargandoLista(true);
    try {
      const [pagina, listaDeportes] = await Promise.all([
        listarConvocatoriasClub(club.id),
        listarDeportes(),
      ]);
      setConvocatorias(pagina.items);
      setDeportes(listaDeportes);
    } catch (fallo) {
      setMensaje(errorDe(fallo));
    } finally {
      setCargandoLista(false);
    }
  }, [club]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => void cargar(), 0);
    return () => window.clearTimeout(temporizador);
  }, [cargar]);

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Convocatorias" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }
  const clubActual = club;

  async function publicar(formulario: FormData) {
    setMensaje("");
    const requisitos = String(formulario.get("requisitos"))
      .split("\n")
      .map((requisito) => requisito.trim())
      .filter(Boolean);
    const datos: ConvocatoriaCreate = {
      titulo: String(formulario.get("titulo")) || null,
      deporte_id: Number(formulario.get("deporte")),
      categoria_edad: String(formulario.get("categoria")),
      fecha_prueba: fechaConZona(String(formulario.get("fecha"))),
      requisitos,
      cupos: Number(formulario.get("cupos")),
      direccion: String(formulario.get("direccion")),
      comuna: String(formulario.get("comuna")) || null,
    };
    try {
      await publicarConvocatoria(clubActual.id, datos);
      setMensaje("Convocatoria publicada.");
      await cargar();
    } catch (fallo) {
      setMensaje(errorDe(fallo));
    }
  }

  async function cerrar(id: string) {
    try {
      await cerrarConvocatoria(clubActual.id, id);
      setMensaje("Convocatoria cerrada.");
      await cargar();
    } catch (fallo) {
      setMensaje(errorDe(fallo));
    }
  }

  return (
    <section className="max-w-3xl">
      <PageHeader titulo="Convocatorias" subtitulo="Publica pruebas masivas y pruebas de jugadores." />
      <form action={publicar}>
        <Card className="space-y-4">
          <p className="text-sm font-bold">Nueva convocatoria</p>
          <Campo label="Título">
            <input name="titulo" maxLength={120} className={inputClass} />
          </Campo>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Deporte">
              <select name="deporte" className={inputClass} required>
                <option value="">Selecciona…</option>
                {deportes.map((deporte) => <option key={deporte.id} value={deporte.id}>{deporte.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Categoría / edad">
              <input name="categoria" placeholder="Ej: Sub-17" required className={inputClass} />
            </Campo>
            <Campo label="Fecha de la prueba">
              <input
                type="date"
                name="fecha"
                min={new Date().toISOString().slice(0, 10)}
                required
                className={inputClass}
              />
            </Campo>
            <Campo label="Cupos">
              <input type="number" name="cupos" min={1} max={1000} required className={inputClass} />
            </Campo>
            <Campo label="Dirección">
              <input name="direccion" minLength={5} required className={inputClass} />
            </Campo>
            <Campo label="Comuna">
              <input name="comuna" className={inputClass} />
            </Campo>
          </div>
          <Campo label="Requisitos (uno por línea)">
            <textarea name="requisitos" required className={`${inputClass} min-h-24`} />
          </Campo>
          <div className="flex items-center gap-4">
            <button type="submit" className={btnPrimary}>Publicar convocatoria</button>
            {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
          </div>
        </Card>
      </form>
      <h2 className="mb-3 mt-8 text-sm font-bold">Tus convocatorias</h2>
      {cargandoLista ? <p role="status" className="py-4 text-sm text-muted">Cargando convocatorias…</p> : null}
      {!cargandoLista && convocatorias.length === 0 ? (
        <EstadoVacio
          icono={Megaphone}
          titulo="Aún no hay convocatorias"
          texto="Usa el formulario de arriba para publicar la primera."
        />
      ) : null}
      {!cargandoLista ? (
        <div className="space-y-3">
          {convocatorias.map((convocatoria) => (
            <Card key={convocatoria.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{convocatoria.titulo ?? convocatoria.deporte.nombre}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <CalendarDays size={13} /> {fechaCorta(convocatoria.fecha_prueba.slice(0, 10))} ·
                    {convocatoria.categoria_edad}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip>{convocatoria.deporte.nombre}</Chip>
                  <span className="rounded-full bg-subtle px-3 py-1 text-xs font-bold">
                    {etiquetaEstado[convocatoria.estado]}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm">{convocatoria.requisitos.join(" · ")}</p>
              <p className="mt-4 text-xs font-semibold text-muted">
                {convocatoria.cupos_disponibles}/{convocatoria.cupos} cupos disponibles
              </p>
              {convocatoria.estado === "ABIERTA" ? (
                <div className="mt-4 flex justify-end">
                  <button type="button" className={btnGhost} onClick={() => void cerrar(convocatoria.id)}>
                    Cerrar convocatoria
                  </button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
