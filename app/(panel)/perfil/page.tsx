"use client";

import { useState } from "react";
import { SoloRol } from "@/components/SesionContext";
import { Avatar, Campo, Card, Chip, PageHeader, btnGhost, btnPrimary, inputClass } from "@/components/ui";
import { CLUB_DEMO_ID, DEPORTES, actualizarClub, useDatos, type Club } from "@/lib/datos";

// HU-31: panel de edición exclusivo para usuarios con rol de club.
export default function MiClubPage() {
  return (
    <SoloRol roles={["club"]}>
      <Formulario />
    </SoloRol>
  );
}

function Formulario() {
  const datos = useDatos();
  const club = datos.clubes.find((c) => c.id === CLUB_DEMO_ID);
  if (!club) return null;
  // key: si cambian los datos guardados desde otra pestaña, se reinicia el formulario
  return <Editor key={JSON.stringify(club)} club={club} />;
}

function Editor({ club }: { club: Club }) {
  const [f, setF] = useState<Club>(club);
  const [guardado, setGuardado] = useState(false);

  const set = <K extends keyof Club>(k: K, v: Club[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setGuardado(false);
  };

  function alternarDeporte(d: string) {
    set("deportes", f.deportes.includes(d) ? f.deportes.filter((x) => x !== d) : [...f.deportes, d]);
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 500_000) {
      alert("El logotipo debe pesar menos de 500 KB.");
      return;
    }
    const lector = new FileReader();
    lector.onload = () => set("logoUrl", String(lector.result));
    lector.readAsDataURL(archivo);
  }

  function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nombre.trim() || f.deportes.length === 0) return;
    actualizarClub(club.id, f);
    setGuardado(true);
  }

  return (
    <section className="max-w-2xl">
      <PageHeader titulo="Mi club" subtitulo="Actualiza la información pública de tu entidad." />

      <form onSubmit={onGuardar} className="space-y-5">
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar nombre={f.nombre || "Club"} logoUrl={f.logoUrl} size={64} />
            <div className="space-y-1">
              <label className={`${btnGhost} inline-block cursor-pointer`}>
                Cambiar logotipo
                <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
              </label>
              {f.logoUrl ? (
                <button type="button" onClick={() => set("logoUrl", "")} className="ml-3 text-xs font-semibold text-danger">
                  Quitar
                </button>
              ) : null}
            </div>
          </div>

          <Campo label="Nombre del club">
            <input className={inputClass} required value={f.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </Campo>
          <Campo label="Descripción">
            <textarea
              className={`${inputClass} min-h-28`}
              value={f.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </Campo>
          <Campo label="Zona o comuna">
            <input className={inputClass} value={f.zona} onChange={(e) => set("zona", e.target.value)} />
          </Campo>
        </Card>

        <Card>
          <p className="mb-1 text-xs font-semibold text-muted">Deportes ofrecidos</p>
          <div className="flex flex-wrap gap-2">
            {DEPORTES.map((d) => (
              <Chip key={d} activo={f.deportes.includes(d)} onClick={() => alternarDeporte(d)}>
                {d}
              </Chip>
            ))}
          </div>
          {f.deportes.length === 0 ? (
            <p className="mt-2 text-xs text-danger">Selecciona al menos un deporte.</p>
          ) : null}
        </Card>

        <Card className="grid gap-4 md:grid-cols-2">
          <Campo label="Correo de contacto">
            <input type="email" className={inputClass} value={f.email} onChange={(e) => set("email", e.target.value)} />
          </Campo>
          <Campo label="Teléfono">
            <input className={inputClass} value={f.telefono} onChange={(e) => set("telefono", e.target.value)} />
          </Campo>
          <Campo label="Instagram">
            <input className={inputClass} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </Campo>
          <Campo label="Sitio web">
            <input className={inputClass} value={f.web} onChange={(e) => set("web", e.target.value)} />
          </Campo>
        </Card>

        <div className="flex items-center gap-4">
          <button type="submit" className={btnPrimary}>Guardar cambios</button>
          {guardado ? <p className="text-sm font-semibold text-success">Cambios guardados</p> : null}
        </div>
      </form>
    </section>
  );
}