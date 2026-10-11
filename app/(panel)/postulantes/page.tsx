"use client";

import { useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Avatar, BadgeEstado, Card, Chip, PageHeader, btnGhost, inputClass } from "@/components/ui";
import { CLUB_DEMO_ID, ESTADOS, cambiarEstadoPostulante, useDatos, type EstadoPostulante } from "@/lib/store.mock";

// HU-34: lista de postulantes con filtros y estados; avisa al postulante en cada cambio.
export default function PostulantesPage() {
  return (
    <SoloRol roles={["club"]}>
      <Contenido />
    </SoloRol>
  );
}

function Contenido() {
  const datos = useDatos();
  const [convocatoria, setConvocatoria] = useState("");
  const [estado, setEstado] = useState<EstadoPostulante | "">("");
  const [mensaje, setMensaje] = useState("");

  const mias = datos.convocatorias.filter((c) => c.clubId === CLUB_DEMO_ID);
  const idsMias = new Set(mias.map((c) => c.id));

  const lista = datos.postulantes.filter(
    (p) =>
      idsMias.has(p.convocatoriaId) &&
      (!convocatoria || p.convocatoriaId === convocatoria) &&
      (!estado || p.estado === estado)
  );

  function cambiar(id: string, convId: string, nuevo: EstadoPostulante) {
    const conv = mias.find((c) => c.id === convId);
    if (nuevo === "Aceptado" && conv) {
      const ocupados = datos.postulantes.filter((p) => p.convocatoriaId === convId && p.estado === "Aceptado").length;
      if (ocupados >= conv.cupos) {
        setMensaje(`No quedan cupos en "${conv.titulo}".`);
        return;
      }
    }
    setMensaje(cambiarEstadoPostulante(id, nuevo));
  }

  return (
    <section className="max-w-4xl">
      <PageHeader titulo="Postulantes" subtitulo="Evalúa perfiles y confirma a los seleccionados." />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <select className={inputClass} value={convocatoria} onChange={(e) => setConvocatoria(e.target.value)}>
          <option value="">Todas las convocatorias</option>
          {mias.map((c) => (
            <option key={c.id} value={c.id}>{c.titulo}</option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Chip activo={estado === ""} onClick={() => setEstado("")}>Todos</Chip>
          {ESTADOS.map((e) => (
            <Chip key={e} activo={estado === e} onClick={() => setEstado(e)}>{e}</Chip>
          ))}
        </div>
      </div>

      {mensaje ? (
        <p className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{mensaje}</p>
      ) : null}

      {lista.length === 0 ? (
        <p className="text-sm text-muted">No hay postulantes con estos filtros.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((p) => {
            const conv = mias.find((c) => c.id === p.convocatoriaId);
            return (
              <Card key={p.id} className="flex flex-wrap items-center gap-4">
                <Avatar nombre={p.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{p.nombre}</p>
                  <p className="text-xs text-muted">
                    {p.nivel} · {p.comuna} · {conv?.titulo}
                  </p>
                </div>
                <BadgeEstado estado={p.estado} />
                <div className="flex gap-2">
                  {p.estado !== "Preseleccionado" && p.estado !== "Aceptado" ? (
                    <button className={btnGhost} onClick={() => cambiar(p.id, p.convocatoriaId, "Preseleccionado")}>
                      Preseleccionar
                    </button>
                  ) : null}
                  {p.estado !== "Aceptado" ? (
                    <button className={btnGhost} onClick={() => cambiar(p.id, p.convocatoriaId, "Aceptado")}>
                      Aceptar
                    </button>
                  ) : null}
                  {p.estado !== "Rechazado" ? (
                    <button
                      className={`${btnGhost} text-danger`}
                      onClick={() => cambiar(p.id, p.convocatoriaId, "Rechazado")}
                    >
                      Rechazar
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