"use client";

import { useEffect, useState } from "react";
import { Avatar, Campo, Card, Chip, PageHeader, btnPrimary, inputClass } from "@/components/ui";
import { agregarDeporte, editarMiClub, listarDeportes, quitarDeporte, type Deporte } from "@/lib/api/club";
import { ClubState, useClub } from "./useClub";

const errorDe = (error: unknown) => error instanceof Error ? error.message : "No se pudo guardar el club.";

export default function PerfilClub() {
  const { club, cargando, error, cargar } = useClub();
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    void listarDeportes().then(setDeportes).catch((fallo) => setMensaje(errorDe(fallo)));
  }, []);

  if (cargando || error || !club) {
    return (
      <section>
        <PageHeader titulo="Mi club" />
        <ClubState cargando={cargando} error={error} sinClub={!cargando && !error && !club} />
      </section>
    );
  }
  const clubActual = club;

  async function guardar(formulario: FormData) {
    setGuardando(true);
    setMensaje("");
    try {
      await editarMiClub(clubActual.id, {
        nombre: String(formulario.get("nombre")),
        descripcion: String(formulario.get("descripcion")) || null,
        historia: String(formulario.get("historia")) || null,
        direccion: String(formulario.get("direccion")) || null,
        comuna: String(formulario.get("comuna")) || null,
        provincia: String(formulario.get("provincia")) || null,
        telefono: String(formulario.get("telefono")) || null,
        email_contacto: String(formulario.get("email")) || null,
        sitio_web: String(formulario.get("web")) || null,
        logo: String(formulario.get("logo")) || null,
        portada: String(formulario.get("portada")) || null,
        redes_sociales: Object.fromEntries(
          ["instagram", "facebook", "x", "tiktok", "youtube"].map((red) => [
            red,
            String(formulario.get(red)) || null,
          ])
        ),
      });
      setMensaje("Cambios guardados.");
      await cargar();
    } catch (fallo) {
      setMensaje(errorDe(fallo));
    } finally {
      setGuardando(false);
    }
  }

  async function alternarDeporte(id: number, activo: boolean) {
    try {
      if (activo) {
        await quitarDeporte(clubActual.id, id);
      } else {
        await agregarDeporte(clubActual.id, id);
      }
      await cargar();
    } catch (fallo) {
      setMensaje(errorDe(fallo));
    }
  }

  return (
    <section className="max-w-3xl">
      <PageHeader titulo="Mi club" subtitulo="Actualiza la información pública de tu entidad." />
      <form action={guardar} className="space-y-5">
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar nombre={club.nombre} logoUrl={club.logo ?? undefined} size={64} />
            <div className="space-y-1">
              <Campo label="URL del logotipo">
                <input name="logo" type="url" defaultValue={club.logo ?? ""} className={inputClass} />
              </Campo>
            </div>
          </div>
          <Campo label="Nombre del club">
            <input
              name="nombre"
              required
              minLength={2}
              maxLength={100}
              defaultValue={club.nombre}
              className={inputClass}
            />
          </Campo>
          <Campo label="Descripción">
            <textarea
              name="descripcion"
              maxLength={500}
              defaultValue={club.descripcion ?? ""}
              className={`${inputClass} min-h-28`}
            />
          </Campo>
          <Campo label="Historia">
            <textarea
              name="historia"
              maxLength={3000}
              defaultValue={club.historia ?? ""}
              className={`${inputClass} min-h-28`}
            />
          </Campo>
          <Campo label="Dirección">
            <input name="direccion" defaultValue={club.ubicacion.direccion ?? ""} className={inputClass} />
          </Campo>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Comuna">
              <input name="comuna" defaultValue={club.ubicacion.comuna ?? ""} className={inputClass} />
            </Campo>
            <Campo label="Provincia">
              <input name="provincia" defaultValue={club.ubicacion.provincia ?? ""} className={inputClass} />
            </Campo>
            <Campo label="Correo de contacto">
              <input type="email" name="email" defaultValue={club.email_contacto ?? ""} className={inputClass} />
            </Campo>
            <Campo label="Teléfono">
              <input name="telefono" defaultValue={club.telefono ?? ""} className={inputClass} />
            </Campo>
            <Campo label="Sitio web">
              <input type="url" name="web" defaultValue={club.sitio_web ?? ""} className={inputClass} />
            </Campo>
            <Campo label="URL de portada">
              <input type="url" name="portada" defaultValue={club.portada ?? ""} className={inputClass} />
            </Campo>
            {["instagram", "facebook", "x", "tiktok", "youtube"].map((red) => (
              <Campo key={red} label={`URL ${red}`}>
                <input type="url" name={red} defaultValue={club.redes_sociales[red] ?? ""} className={inputClass} />
              </Campo>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-1 text-xs font-semibold text-muted">Deportes ofrecidos</p>
          <div className="flex flex-wrap gap-2">
            {deportes.map((deporte) => {
              const activo = club.deportes.some((item) => item.id === deporte.id);
              return (
                <Chip key={deporte.id} activo={activo} onClick={() => void alternarDeporte(deporte.id, activo)}>
                  {deporte.nombre}
                </Chip>
              );
            })}
          </div>
          {deportes.length === 0 ? <p className="mt-2 text-xs text-muted">No hay deportes disponibles.</p> : null}
        </Card>
        <div className="flex items-center gap-4">
          <button disabled={guardando} type="submit" className={btnPrimary}>Guardar cambios</button>
          {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
        </div>
      </form>
    </section>
  );
}
