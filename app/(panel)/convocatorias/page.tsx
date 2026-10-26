"use client";

import { CalendarDays, Megaphone } from "lucide-react";
import { useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import {
  Campo,
  Card,
  Chip,
  EstadoVacio,
  PageHeader,
  ProgressBar,
  btnGhost,
  btnPrimary,
  fechaCorta,
  inputClass,
} from "@/components/ui";
import { CLUB_DEMO_ID, DEPORTES, cerrarConvocatoria, crearConvocatoria, useDatos } from "@/lib/datos";

// HU-32: formulario de convocatoria (categoría/edad, deporte, fecha, requisitos y cupos) y publicación.
export default function ConvocatoriasPage() {
  return (
    <SoloRol roles={["club"]}>
      <Contenido />
    </SoloRol>
  );
}

const VACIO = { titulo: "", deporte: "", categoria: "", fecha: "", requisitos: "", cupos: "" };

function Contenido() {
  const datos = useDatos();
  const [f, setF] = useState(VACIO);
  const [error, setError] = useState("");
  const [publicada, setPublicada] = useState(false);
  // El club decide si los postulantes pueden escribir en el chat de consultas de esta convocatoria.
  const [chat, setChat] = useState(false);

  const mias = datos.convocatorias.filter((c) => c.clubId === CLUB_DEMO_ID);
  const hoy = new Date().toISOString().slice(0, 10);

  const set = (k: keyof typeof VACIO, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setPublicada(false);
  };

  function onPublicar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cupos = Number(f.cupos);
    if (!f.titulo.trim() || !f.deporte || !f.categoria.trim() || !f.fecha || !f.requisitos.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    if (!Number.isInteger(cupos) || cupos < 1) {
      setError("Los cupos deben ser un número entero mayor a 0.");
      return;
    }
    if (f.fecha < hoy) {
      setError("La fecha de la prueba no puede estar en el pasado.");
      return;
    }
    crearConvocatoria({
      clubId: CLUB_DEMO_ID,
      titulo: f.titulo.trim(),
      deporte: f.deporte,
      categoria: f.categoria.trim(),
      fecha: f.fecha,
      requisitos: f.requisitos.trim(),
      cupos,
      chatPostulantes: chat,
    });
    setF(VACIO);
    setChat(false);
    setPublicada(true);
  }

  return (
    <section className="max-w-3xl">
      <PageHeader titulo="Convocatorias" subtitulo="Publica pruebas masivas y pruebas de jugadores." />

      <form onSubmit={onPublicar}>
        <Card className="space-y-4">
          <p className="text-sm font-bold">Nueva convocatoria</p>
          <Campo label="Título">
            <input className={inputClass} value={f.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </Campo>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Deporte">
              <select className={inputClass} value={f.deporte} onChange={(e) => set("deporte", e.target.value)}>
                <option value="">Selecciona…</option>
                {DEPORTES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Categoría / edad">
              <input
                className={inputClass}
                placeholder="Ej: Sub-17"
                value={f.categoria}
                onChange={(e) => set("categoria", e.target.value)}
              />
            </Campo>
            <Campo label="Fecha de la prueba">
              <input type="date" min={hoy} className={inputClass} value={f.fecha} onChange={(e) => set("fecha", e.target.value)} />
            </Campo>
            <Campo label="Cupos">
              <input type="number" min={1} className={inputClass} value={f.cupos} onChange={(e) => set("cupos", e.target.value)} />
            </Campo>
          </div>
          <Campo label="Requisitos">
            <textarea className={`${inputClass} min-h-24`} value={f.requisitos} onChange={(e) => set("requisitos", e.target.value)} />
          </Campo>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={chat}
              onChange={(e) => {
                setChat(e.target.checked);
                setPublicada(false);
              }}
            />
            <span>Permitir que los postulantes escriban en el chat de consultas</span>
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex items-center gap-4">
            <button type="submit" className={btnPrimary}>Publicar convocatoria</button>
            {publicada ? <p className="text-sm font-semibold text-success">Convocatoria publicada</p> : null}
          </div>
        </Card>
      </form>

      <h2 className="mb-3 mt-8 text-sm font-bold">Tus convocatorias</h2>
      {mias.length === 0 ? (
        <EstadoVacio
          icono={Megaphone}
          titulo="Aún no hay convocatorias"
          texto="Usa el formulario de arriba para publicar tu primera convocatoria."
        />
      ) : (
        <div className="space-y-3">
          {mias.map((c) => {
            const aceptados = datos.postulantes.filter((p) => p.convocatoriaId === c.id && p.estado === "Aceptado").length;
            const total = datos.postulantes.filter((p) => p.convocatoriaId === c.id).length;
            return (
              <Card key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{c.titulo}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <CalendarDays size={13} /> {fechaCorta(c.fecha)} · {c.categoria}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip>{c.deporte}</Chip>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        c.estado === "abierta" ? "bg-success-bg text-success" : "bg-subtle text-muted"
                      }`}
                    >
                      {c.estado === "abierta" ? "Abierta" : "Cerrada"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm">{c.requisitos}</p>
                <p className="mt-1 text-xs text-muted">
                  Chat de postulantes: {c.chatPostulantes ? "activado" : "desactivado (solo lectura)"}
                </p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted">
                    <span>{total} postulantes</span>
                    <span>{aceptados}/{c.cupos} cupos ocupados</span>
                  </div>
                  <ProgressBar valor={aceptados} max={c.cupos} />
                </div>
                <div className="mt-4 flex justify-end">
                  {c.estado === "abierta" ? (
                    <button type="button" className={btnGhost} onClick={() => cerrarConvocatoria(c.id)}>
                      Cerrar convocatoria
                    </button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}