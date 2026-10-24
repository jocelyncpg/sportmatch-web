"use client";

import { useEffect, useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { ChartCard, GraficoBarras, GraficoLinea } from "@/components/Graficos";
import { useClub } from "@/components/club/useClub";
import {
  Card,
  Chip,
  EstadoVacio,
  PageHeader,
  StatStrip,
  fechaHora,
} from "@/components/ui";
import { listarAvisos, type Aviso } from "@/lib/api/avisos";
import { listarConvocatoriasClub, type Convocatoria } from "@/lib/api/convocatorias";
import { listarPostulantes, type Candidato } from "@/lib/api/postulantes";
import { ClubState } from "./useClub";

const ESTADOS: Record<string, string> = {
  ABIERTA: "Abierta",
  CERRADA: "Cerrada",
  FINALIZADA: "Finalizada",
};

export default function InicioClub() {
  const { club, cargando, error } = useClub();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [postulantes, setPostulantes] = useState<Candidato[]>([]);
  const [postulantesPorConvocatoria, setPostulantesPorConvocatoria] = useState<
    { nombre: string; valor: number }[]
  >([]);
  const [conteos, setConteos] = useState({
    PENDIENTE: 0,
    PRESELECCIONADO: 0,
    ACEPTADO: 0,
    RECHAZADO: 0,
  });
  const [fallo, setFallo] = useState("");

  useEffect(() => {
    if (!club) return;
    let vigente = true;
    const clubId = club.id;

    async function cargarResumen() {
      try {
        const [paginaConvocatorias, paginaAvisos] = await Promise.all([
          listarConvocatoriasClub(clubId),
          listarAvisos(clubId, { page_size: 5 }),
        ]);
        const paginasPostulantes = await Promise.all(
          paginaConvocatorias.items.map((convocatoria) =>
            listarPostulantes(convocatoria.id, { page_size: 1 })
          )
        );
        if (!vigente) return;

        const total = {
          PENDIENTE: 0,
          PRESELECCIONADO: 0,
          ACEPTADO: 0,
          RECHAZADO: 0,
        };
        paginasPostulantes.forEach((pagina) => {
          for (const estado of Object.keys(total) as (keyof typeof total)[]) {
            total[estado] += pagina.conteo_por_estado[estado] ?? 0;
          }
        });

        setConvocatorias(paginaConvocatorias.items);
        setAvisos(paginaAvisos.items);
        setPostulantes(paginasPostulantes.flatMap((pagina) => pagina.items));
        setPostulantesPorConvocatoria(
          paginasPostulantes.map((pagina) => ({
            nombre: pagina.convocatoria.titulo ?? pagina.convocatoria.deporte.nombre,
            valor: pagina.total,
          }))
        );
        setConteos(total);
      } catch (desconocido) {
        if (vigente) {
          setFallo(
            desconocido instanceof Error
              ? desconocido.message
              : "No se pudo cargar el resumen del club."
          );
        }
      }
    }

    void cargarResumen();
    return () => {
      vigente = false;
    };
  }, [club]);

  if (cargando || error || fallo || !club) {
    return (
      <section>
        <PageHeader titulo="Inicio" subtitulo="Resumen de tu club." />
        <ClubState cargando={cargando} error={error || fallo} sinClub={!club} />
      </section>
    );
  }

  const postulacionesPorDia = [...postulantes.reduce((mapa, postulante) => {
    const fecha = postulante.fecha_postulacion.slice(0, 10);
    mapa.set(fecha, (mapa.get(fecha) ?? 0) + 1);
    return mapa;
  }, new Map<string, number>())]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([etiqueta, valor]) => ({ etiqueta, valor }));
  const postulacionesPorEstado = Object.entries(conteos).map(([nombre, valor]) => ({
    nombre,
    valor,
  }));

  return (
    <section>
      <PageHeader titulo="Inicio" subtitulo={club.nombre} />
      <StatStrip
        items={[
          {
            valor: convocatorias.filter((c) => c.estado === "ABIERTA").length,
            etiqueta: "Convocatorias abiertas",
          },
          { valor: conteos.PENDIENTE, etiqueta: "Pendientes" },
          { valor: conteos.PRESELECCIONADO, etiqueta: "Preseleccionados" },
          { valor: conteos.ACEPTADO, etiqueta: "Aceptados" },
          { valor: conteos.RECHAZADO, etiqueta: "Rechazados" },
        ]}
      />

      {postulantes.length > 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard
            titulo="Postulaciones por día"
            columnas={["Día", "Postulaciones"]}
            filas={postulacionesPorDia.map((dato) => [dato.etiqueta, dato.valor])}
          >
            <GraficoLinea datos={postulacionesPorDia} />
          </ChartCard>
          <ChartCard
            titulo="Estado de las postulaciones"
            columnas={["Estado", "Postulantes"]}
            filas={postulacionesPorEstado.map((dato) => [dato.nombre, dato.valor])}
          >
            <GraficoBarras datos={postulacionesPorEstado} alto={200} />
          </ChartCard>
          <ChartCard
            titulo="Postulantes por convocatoria"
            columnas={["Convocatoria", "Postulantes"]}
            filas={postulantesPorConvocatoria.map((dato) => [dato.nombre, dato.valor])}
          >
            <GraficoBarras datos={postulantesPorConvocatoria} />
          </ChartCard>
        </div>
      ) : null}

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Avisos recientes</h2>
          {avisos.length ? (
            <ul className="space-y-3">
              {avisos.map((aviso) => (
                <li key={aviso.id} className="border-b border-border pb-3">
                  <p className="font-semibold">{aviso.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{aviso.contenido}</p>
                  <time className="text-xs text-muted">{fechaHora(aviso.fecha_creacion)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <EstadoVacio
              icono={Bell}
              titulo="Sin avisos"
              texto="Los avisos publicados aparecerán aquí."
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Convocatorias</h2>
          {convocatorias.length ? (
            <ul className="space-y-3">
              {convocatorias.map((convocatoria) => (
                <li
                  key={convocatoria.id}
                  className="flex justify-between gap-3 border-b border-border pb-3"
                >
                  <span>{convocatoria.titulo ?? convocatoria.deporte.nombre}</span>
                  <Chip>{ESTADOS[convocatoria.estado]}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <EstadoVacio
              icono={Megaphone}
              titulo="Sin convocatorias"
              texto="Publica una convocatoria para recibir postulaciones."
            />
          )}
        </Card>
      </div>
    </section>
  );
}
