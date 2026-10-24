"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Campo, Card, EstadoVacio, PageHeader, btnPrimary, fechaHora, inputClass } from "@/components/ui";
import { listarAvisos, publicarAviso, type Aviso, type AudienciaAviso, type PrioridadAviso } from "@/lib/api/avisos";
import { useClub, ClubState } from "./useClub";

const errorDe = (error: unknown) => error instanceof Error ? error.message : "No se pudo completar la solicitud.";

export default function AvisosClub() {
  const { club, cargando, error } = useClub();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    if (!club) return;
    setCargandoLista(true);
    try {
      setAvisos((await listarAvisos(club.id, { page_size: 50 })).items);
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
        <PageHeader titulo="Avisos" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }
  const clubActual = club;

  async function publicar(formulario: FormData) {
    setMensaje("");
    try {
      await publicarAviso(clubActual.id, {
        titulo: String(formulario.get("titulo")),
        contenido: String(formulario.get("contenido")),
        audiencia: String(formulario.get("audiencia")) as AudienciaAviso,
        prioridad: String(formulario.get("prioridad")) as PrioridadAviso,
      });
      setMensaje("Aviso publicado.");
      await cargar();
    } catch (fallo) {
      setMensaje(errorDe(fallo));
    }
  }

  return (
    <section className="max-w-3xl">
      <PageHeader titulo="Avisos" subtitulo="Envía comunicados a tus postulantes y miembros." />
      <form action={publicar}>
        <Card className="space-y-4">
          <Campo label="Título">
            <input name="titulo" required maxLength={120} className={inputClass} />
          </Campo>
          <Campo label="Mensaje">
            <textarea name="contenido" required minLength={5} maxLength={2000} className={`${inputClass} min-h-28`} />
          </Campo>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Audiencia">
              <select name="audiencia" className={inputClass}>
                <option value="TODOS">Todos</option>
                <option value="POSTULANTES">Postulantes</option>
                <option value="MIEMBROS">Miembros</option>
              </select>
            </Campo>
            <Campo label="Prioridad">
              <select name="prioridad" className={inputClass}>
                <option value="NORMAL">Normal</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </Campo>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" className={btnPrimary}>Publicar aviso</button>
            {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
          </div>
        </Card>
      </form>
      <h2 className="mb-3 mt-8 text-sm font-bold">Avisos enviados</h2>
      {cargandoLista ? <p role="status" className="py-4 text-sm text-muted">Cargando avisos…</p> : null}
      {!cargandoLista && avisos.length === 0 ? (
        <EstadoVacio icono={Bell} titulo="Aún no has enviado avisos" texto="Los avisos publicados aparecerán aquí." />
      ) : null}
      {!cargandoLista ? (
        <div className="space-y-3">
          {avisos.map((aviso) => (
            <Card key={aviso.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{aviso.titulo}</p>
                <time className="text-xs text-muted">{fechaHora(aviso.fecha_creacion)}</time>
              </div>
              <p className="mt-2 text-sm">{aviso.contenido}</p>
              <p className="mt-2 text-xs text-muted">
                Para: {aviso.audiencia.toLowerCase()} · {aviso.destinatarios} destinatarios
              </p>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
