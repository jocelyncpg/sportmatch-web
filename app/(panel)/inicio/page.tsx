"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useSesion } from "@/components/SesionContext";
import { ChartCard, GraficoBarras, GraficoLinea } from "@/components/Graficos";
import Mapa from "@/components/Mapa";
import PerfilPostulante from "@/components/PerfilPostulante";
import { useGestionPostulantes } from "@/components/useGestionPostulantes";
import {
  Avatar,
  BadgeEstado,
  Card,
  COLOR_ESTADO,
  EstadoVacio,
  PageHeader,
  StatStrip,
} from "@/components/ui";
import { CENTRO_SANTIAGO, COMUNAS } from "@/lib/comunas";
import { porComuna, porConvocatoria, porDia, porEstado, porNivel } from "@/lib/stats";
import { estaActiva, useModeracion } from "@/lib/moderacion.mock";
import { CLUB_DEMO_ID, useDatos } from "@/lib/store.mock";
import InicioClub from "@/components/club/InicioClub";
import type { Candidato } from "@/lib/api/postulantes";

export default function InicioPage() {
  const sesion = useSesion();
  return sesion.rol === "admin" ? <AdminInicio /> : <InicioClub />;
}

function AdminInicio() {
  const sesion = useSesion();
  const datos = useDatos();
  const { mensaje, abierto, setAbierto, cambiar } = useGestionPostulantes();
  const mod = useModeracion();

  if (sesion.rol === "admin") {
    return (
      <section>
        <PageHeader titulo="Inicio" subtitulo="Resumen de la plataforma." />
        <StatStrip
          items={[
            { valor: datos.clubes.length, etiqueta: "Clubes registrados" },
            {
              valor: datos.convocatorias.filter((c) => c.estado === "abierta").length,
              etiqueta: "Convocatorias abiertas",
            },
            { valor: datos.postulantes.length, etiqueta: "Postulaciones" },
          ]}
        />

        <div className="mb-3 mt-8 flex items-center justify-between">
          <h2 className="text-sm font-bold">Moderación</h2>
          <Link href="/reportes" className="text-xs font-semibold text-accent hover:underline">
            Ir a reportes
          </Link>
        </div>
        <StatStrip
          items={[
            {
              valor: mod.reportes.filter((r) => r.estado === "pendiente").length,
              etiqueta: "Reportes por atender",
            },
            { valor: mod.sanciones.filter((s) => estaActiva(s)).length, etiqueta: "Cuentas suspendidas" },
            { valor: mod.auditoria.length, etiqueta: "Acciones registradas", nota: "Ver detalle en Auditoría" },
          ]}
        />

        <h2 className="mb-3 mt-8 text-sm font-bold">Clubes en el mapa</h2>
        <Mapa
          centro={CENTRO_SANTIAGO}
          zoom={11}
          puntos={datos.clubes.flatMap((c) =>
            COMUNAS[c.zona] ? [{ id: c.id, nombre: c.nombre, detalle: c.zona, coord: COMUNAS[c.zona] }] : []
          )}
        />
      </section>
    );
  }

  const club = datos.clubes.find((c) => c.id === CLUB_DEMO_ID);
  const mias = datos.convocatorias.filter((c) => c.clubId === CLUB_DEMO_ID);
  const idsMias = new Set(mias.map((c) => c.id));
  const postulantes = datos.postulantes.filter((p) => idsMias.has(p.convocatoriaId));
  const abiertas = mias.filter((c) => c.estado === "abierta");
  const pendientes = postulantes.filter((p) => p.estado === "Pendiente");
  const aceptados = postulantes.filter((p) => p.estado === "Aceptado").length;
  const resueltos = postulantes.filter((p) => p.estado === "Aceptado" || p.estado === "Rechazado").length;
  const cupos = abiertas.reduce((s, c) => s + c.cupos, 0);

  const dias = porDia(postulantes);
  const estados = porEstado(postulantes);
  const niveles = porNivel(postulantes);
  const convs = porConvocatoria(postulantes, mias);
  const comunas = porComuna(postulantes);
  const abiertoP = postulantes.find((p) => p.id === abierto);

  return (
    <section>
      <PageHeader titulo={club?.nombre ?? sesion.nombre} subtitulo="Resumen de postulaciones de tu club." />

      {mensaje ? (
        <p className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{mensaje}</p>
      ) : null}

      <StatStrip
        items={[
          { valor: postulantes.length, etiqueta: "Postulaciones", nota: `${abiertas.length} convocatorias abiertas` },
          { valor: pendientes.length, etiqueta: "Por revisar" },
          { valor: `${aceptados}/${cupos}`, etiqueta: "Cupos ocupados" },
          {
            valor: resueltos ? `${Math.round((aceptados / resueltos) * 100)}%` : "—",
            etiqueta: "Tasa de aceptación",
            nota: "Sobre postulaciones resueltas",
          },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          titulo="Postulaciones por día"
          subtitulo="Últimos 14 días"
          columnas={["Día", "Postulaciones"]}
          filas={dias.map((d) => [d.etiqueta, d.valor])}
        >
          <GraficoLinea datos={dias} />
        </ChartCard>

        <ChartCard
          titulo="Estado de las postulaciones"
          columnas={["Estado", "Postulantes"]}
          filas={estados.map((e) => [e.nombre, e.valor])}
        >
          <GraficoBarras datos={estados} colores={COLOR_ESTADO} alto={200} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          titulo="Postulantes por convocatoria"
          columnas={["Convocatoria", "Postulantes"]}
          filas={convs.map((c) => [`${c.nombre} (${c.cupos} cupos)`, c.valor])}
        >
          <GraficoBarras datos={convs} />
        </ChartCard>
        <ChartCard
          titulo="Postulantes por nivel"
          columnas={["Nivel", "Postulantes"]}
          filas={niveles.map((n) => [n.nombre, n.valor])}
        >
          <GraficoBarras datos={niveles} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="text-sm font-bold">¿De dónde vienen tus postulantes?</h2>
          <p className="mb-4 mt-0.5 text-xs text-muted">Cada círculo agrupa a los postulantes de una comuna.</p>
          <Mapa
            alto={300}
            centro={CENTRO_SANTIAGO}
            zoom={11}
            puntos={comunas.flatMap((c) =>
              COMUNAS[c.comuna]
                ? [
                    {
                      id: c.comuna,
                      nombre: c.comuna,
                      detalle: `${c.valor} ${c.valor === 1 ? "postulante" : "postulantes"}`,
                      coord: COMUNAS[c.comuna],
                      peso: 0.8 + c.valor * 0.45,
                    },
                  ]
                : []
            )}
          />
        </Card>

        <Card flush className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-bold">Por revisar</h2>
            <Link href="/postulantes" className="text-xs font-semibold text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          {pendientes.length === 0 ? (
            <div className="p-5">
              <EstadoVacio icono={Users} titulo="Todo al día" texto="No hay postulantes pendientes de revisión." />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {pendientes.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setAbierto(p.id)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle"
                  >
                    <Avatar nombre={p.nombre} foto={p.foto} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{p.nombre}</p>
                      <p className="truncate text-xs text-muted">
                        {p.nivel} · {p.comuna}
                      </p>
                    </div>
                    <BadgeEstado estado={p.estado} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {abiertoP ? (
        <PerfilPostulante
          p={abiertoP as unknown as Candidato}
          convocatoria={mias.find((c) => c.id === abiertoP.convocatoriaId)?.titulo}
          onCerrar={() => setAbierto(null)}
          onCambiar={(n) => cambiar(abiertoP.id, n)}
        />
      ) : null}
    </section>
  );
}
