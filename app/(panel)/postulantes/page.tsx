"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import PerfilPostulante from "@/components/PerfilPostulante";
import PostulanteCard from "@/components/PostulanteCard";
import { useGestionPostulantes } from "@/components/useGestionPostulantes";
import { Chip, EstadoVacio, PageHeader, inputClass } from "@/components/ui";
import { CLUB_DEMO_ID, ESTADOS, useDatos, type EstadoPostulante } from "@/lib/datos";

// HU-34: postulantes con perfil, filtros y estados; avisa al postulante en cada cambio.
export default function PostulantesPage() {
  return (
    <SoloRol roles={["club"]}>
      <Contenido />
    </SoloRol>
  );
}

function Contenido() {
  const datos = useDatos();
  const { mensaje, abierto, setAbierto, cambiar } = useGestionPostulantes();
  const [convocatoria, setConvocatoria] = useState("");
  const [estado, setEstado] = useState<EstadoPostulante | "">("");

  const mias = datos.convocatorias.filter((c) => c.clubId === CLUB_DEMO_ID);
  const idsMias = new Set(mias.map((c) => c.id));
  const delClub = datos.postulantes.filter((p) => idsMias.has(p.convocatoriaId));
  const base = delClub.filter((p) => !convocatoria || p.convocatoriaId === convocatoria);
  const lista = base.filter((p) => !estado || p.estado === estado);
  const abiertoP = delClub.find((p) => p.id === abierto);
  const titulo = (id: string) => mias.find((c) => c.id === id)?.titulo;

  return (
    <section>
      <PageHeader titulo="Postulantes" subtitulo="Revisa los perfiles y confirma a los seleccionados." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          className={`${inputClass} max-w-xs`}
          value={convocatoria}
          onChange={(e) => setConvocatoria(e.target.value)}
        >
          <option value="">Todas las convocatorias</option>
          {mias.map((c) => (
            <option key={c.id} value={c.id}>{c.titulo}</option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Chip activo={estado === ""} onClick={() => setEstado("")}>Todos · {base.length}</Chip>
          {ESTADOS.map((e) => (
            <Chip key={e} activo={estado === e} onClick={() => setEstado(e)}>
              {e} · {base.filter((p) => p.estado === e).length}
            </Chip>
          ))}
        </div>
      </div>

      {mensaje ? (
        <p className="mb-4 rounded-[13px] bg-chip px-4 py-3 text-sm font-semibold text-accent">{mensaje}</p>
      ) : null}

      {lista.length === 0 ? (
        <EstadoVacio
          icono={Users}
          titulo="Sin postulantes"
          texto="No hay postulantes que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => (
            <PostulanteCard
              key={p.id}
              p={p}
              convocatoria={titulo(p.convocatoriaId)}
              onVer={() => setAbierto(p.id)}
              onCambiar={(n) => cambiar(p.id, n)}
            />
          ))}
        </div>
      )}

      {abiertoP ? (
        <PerfilPostulante
          key={abiertoP.id}
          p={abiertoP}
          convocatoria={titulo(abiertoP.convocatoriaId)}
          chatHabilitado={mias.find((c) => c.id === abiertoP.convocatoriaId)?.chatPostulantes ?? false}
          onCerrar={() => setAbierto(null)}
          onCambiar={(n) => cambiar(abiertoP.id, n)}
        />
      ) : null}
    </section>
  );
}