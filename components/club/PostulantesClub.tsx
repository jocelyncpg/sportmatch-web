"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import PerfilPostulante from "@/components/PerfilPostulante";
import PostulanteCard from "@/components/PostulanteCard";
import { useGestionPostulantes } from "@/components/useGestionPostulantes";
import { Chip, EstadoVacio, PageHeader, inputClass } from "@/components/ui";
import { iniciarConsultaPostulante } from "@/lib/api/consultas";
import { listarConvocatoriasClub, type Convocatoria } from "@/lib/api/convocatorias";
import { useClub, ClubState } from "./useClub";

const estados = [
  ["PENDIENTE", "Pendiente"],
  ["PRESELECCIONADO", "Preseleccionado"],
  ["ACEPTADO", "Aceptado"],
  ["RECHAZADO", "Rechazado"],
] as const;

export default function PostulantesClub() {
  const router = useRouter();
  const { club, cargando, error } = useClub();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [falloConvocatorias, setFalloConvocatorias] = useState("");
  const [filtro, setFiltro] = useState("");
  const [estado, setEstado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const gestion = useGestionPostulantes(club?.id ?? "", convocatorias
    .filter((convocatoria) => !filtro || convocatoria.id === filtro)
    .map((convocatoria) => convocatoria.id));

  useEffect(() => {
    if (!club) return;
    let vigente = true;
    void listarConvocatoriasClub(club.id)
      .then((pagina) => {
        if (vigente) setConvocatorias(pagina.items);
      })
      .catch((fallo) => {
        if (vigente) {
          setFalloConvocatorias(
            fallo instanceof Error ? fallo.message : "No se cargaron las convocatorias."
          );
        }
      });
    return () => {
      vigente = false;
    };
  }, [club]);

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Postulantes" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }

  const clubActual = club;
  const listaBase = gestion.postulantes;
  const lista = listaBase.filter((postulante) => !estado || postulante.estado === estado);
  const seleccionado = listaBase.find((postulante) => postulante.id === gestion.abierto);

  async function escribir() {
    if (!seleccionado || seleccionado.estado === "RECHAZADO" || enviando) return;
    const texto = window.prompt("Escribe el primer mensaje al postulante.");
    if (!texto?.trim()) return;
    setEnviando(true);
    gestion.setMensaje("");
    try {
      const inicio = await iniciarConsultaPostulante(clubActual.id, seleccionado.usuario_id, {
        texto: texto.trim(),
        client_message_id: crypto.randomUUID(),
      });
      router.push(`/consultas/${inicio.hilo_id}`);
    } catch (fallo) {
      gestion.setMensaje(fallo instanceof Error ? fallo.message : "No se pudo iniciar la consulta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <PageHeader titulo="Postulantes" subtitulo="Revisa los perfiles y confirma a los seleccionados." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="filtro-convocatoria">Convocatoria</label>
        <select
          id="filtro-convocatoria"
          className={`${inputClass} max-w-xs`}
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
        >
          <option value="">Todas las convocatorias</option>
          {convocatorias.map((convocatoria) => (
            <option key={convocatoria.id} value={convocatoria.id}>
              {convocatoria.titulo ?? convocatoria.deporte.nombre}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Chip activo={estado === ""} onClick={() => setEstado("")}>Todos · {listaBase.length}</Chip>
          {estados.map(([valor, etiqueta]) => (
            <Chip key={valor} activo={estado === valor} onClick={() => setEstado(estado === valor ? "" : valor)}>
              {etiqueta} · {listaBase.filter((postulante) => postulante.estado === valor).length}
            </Chip>
          ))}
        </div>
      </div>
      {falloConvocatorias ? <p role="alert" className="mb-4 text-sm text-danger">{falloConvocatorias}</p> : null}
      {gestion.error ? <p role="alert" className="mb-4 text-sm text-danger">{gestion.error}</p> : null}
      {gestion.mensaje ? (
        <p role="status" className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">
          {gestion.mensaje}
        </p>
      ) : null}
      {gestion.cargando ? <p role="status" className="py-4 text-sm text-muted">Cargando postulantes…</p> : null}
      {!gestion.cargando && lista.length === 0 ? (
        <EstadoVacio
          icono={Users}
          titulo="Sin postulantes"
          texto="No hay postulantes que coincidan con los filtros seleccionados."
        />
      ) : null}
      {!gestion.cargando && lista.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((postulante) => (
            <PostulanteCard
              key={postulante.id}
              p={postulante}
              convocatoria={postulante.convocatoriaTitulo}
              onVer={() => gestion.setAbierto(postulante.id)}
              onCambiar={(nuevo) => void gestion.cambiar(postulante.id, nuevo)}
            />
          ))}
        </div>
      ) : null}
      {seleccionado ? (
        <PerfilPostulante
          p={seleccionado}
          convocatoria={seleccionado.convocatoriaTitulo}
          onCerrar={() => gestion.setAbierto(null)}
          onCambiar={(nuevo) => void gestion.cambiar(seleccionado.id, nuevo)}
          onEscribir={() => void escribir()}
        />
      ) : null}
    </section>
  );
}
