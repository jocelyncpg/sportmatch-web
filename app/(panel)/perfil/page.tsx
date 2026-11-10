"use client";

import { ImagePlus, LocateFixed } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import MapaUbicacion from "@/components/MapaUbicacion";
import type { Coord } from "@/components/MapaUbicacionLeaflet";
import { SoloRol } from "@/components/SesionContext";
import { Avatar, Campo, Card, Chip, PageHeader, btnGhost, btnPrimary, inputClass } from "@/components/ui";
import { COMUNAS_RM, FORMATO_COMUNA, centroDeComuna, comunaOficial } from "@/lib/comunasRM";
import { CLUB_DEMO_ID, DEPORTES, actualizarClub, useDatos, type Club } from "@/lib/datos";

const MAX_LOGO = 500_000;
const MAX_PORTADA = 2_000_000;

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
  // El aviso "Cambios guardados" vive aquí: al guardar, el club cambia y el formulario se vuelve a armar.
  const [guardado, setGuardado] = useState(false);
  const club = datos.clubes.find((c) => c.id === CLUB_DEMO_ID);
  if (!club) return null;
  // key: si cambian los datos guardados (por ejemplo desde otra pestaña), se reinicia el formulario
  return <Editor key={JSON.stringify(club)} club={club} guardado={guardado} onGuardado={setGuardado} />;
}

function Editor({
  club,
  guardado,
  onGuardado,
}: {
  club: Club;
  guardado: boolean;
  onGuardado: (v: boolean) => void;
}) {
  const [f, setF] = useState<Club>(club);
  const [error, setError] = useState("");
  const [errorImagen, setErrorImagen] = useState("");
  // Hacia dónde mira el mapa: la marca del club si la tiene; si no, el centro de su comuna.
  const [foco, setFoco] = useState<Coord>(() =>
    club.latitud != null && club.longitud != null ? [club.latitud, club.longitud] : centroDeComuna(club.zona)
  );

  const pin: Coord | null = f.latitud != null && f.longitud != null ? [f.latitud, f.longitud] : null;

  const set = <K extends keyof Club>(k: K, v: Club[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    onGuardado(false);
    setError("");
  };

  function alternarDeporte(d: string) {
    set("deportes", f.deportes.includes(d) ? f.deportes.filter((x) => x !== d) : [...f.deportes, d]);
  }

  function leerImagen(
    e: React.ChangeEvent<HTMLInputElement>,
    campo: "logoUrl" | "portadaUrl",
    max: number,
    etiqueta: string
  ) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setErrorImagen("El archivo debe ser una imagen.");
      return;
    }
    if (archivo.size > max) {
      setErrorImagen(`${etiqueta} debe pesar menos de ${Math.round(max / 1000)} KB.`);
      return;
    }
    setErrorImagen("");
    const lector = new FileReader();
    lector.onload = () => set(campo, String(lector.result));
    lector.readAsDataURL(archivo);
  }

  function cambiarComuna(valor: string) {
    set("zona", valor);
    // Si escribe una comuna conocida y aún no marca el punto exacto, el mapa se acerca a esa comuna.
    if (!pin && comunaOficial(valor)) setFoco(centroDeComuna(valor));
  }

  function marcar(c: Coord) {
    setF((p) => ({ ...p, latitud: c[0], longitud: c[1] }));
    onGuardado(false);
    setError("");
  }

  function usarCentroDeLaComuna() {
    const c = centroDeComuna(f.zona);
    marcar(c);
    setFoco(c);
  }

  function quitarMarca() {
    setF((p) => ({ ...p, latitud: null, longitud: null }));
    onGuardado(false);
  }

  function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    const zona = f.zona.trim();
    if (!f.nombre.trim()) return setError("Escribe el nombre del club.");
    if (f.deportes.length === 0) return setError("Selecciona al menos un deporte.");
    if (zona && !FORMATO_COMUNA.test(zona)) {
      return setError("La comuna solo puede tener letras, espacios, guiones o apóstrofos.");
    }
    setError("");
    actualizarClub(club.id, { ...f, zona, direccion: f.direccion.trim() });
    onGuardado(true);
  }

  return (
    <section className="max-w-3xl">
      <PageHeader titulo="Mi club" subtitulo="Actualiza la información pública de tu club: imagen, ubicación y contacto." />

      <form onSubmit={onGuardar} className="space-y-5">
        <Card className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Portada</p>
            <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-border bg-subtle">
              {f.portadaUrl ? (
                <Image
                  src={f.portadaUrl}
                  alt="Portada del club"
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 672px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">Sin portada</div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className={`${btnGhost} inline-flex cursor-pointer items-center gap-2`}>
                <ImagePlus size={16} />
                {f.portadaUrl ? "Cambiar portada" : "Subir portada"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => leerImagen(e, "portadaUrl", MAX_PORTADA, "La portada")}
                />
              </label>
              {f.portadaUrl ? (
                <button type="button" onClick={() => set("portadaUrl", "")} className="text-xs font-semibold text-danger">
                  Quitar
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-5">
            <Avatar nombre={f.nombre || "Club"} logoUrl={f.logoUrl} size={64} />
            <div className="flex flex-wrap items-center gap-3">
              <label className={`${btnGhost} inline-flex cursor-pointer items-center gap-2`}>
                <ImagePlus size={16} />
                {f.logoUrl ? "Cambiar logotipo" : "Subir logotipo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => leerImagen(e, "logoUrl", MAX_LOGO, "El logotipo")}
                />
              </label>
              {f.logoUrl ? (
                <button type="button" onClick={() => set("logoUrl", "")} className="text-xs font-semibold text-danger">
                  Quitar
                </button>
              ) : null}
            </div>
          </div>

          {errorImagen ? <p className="text-xs font-semibold text-danger">{errorImagen}</p> : null}
          <p className="text-xs text-muted">
            La imagen se previsualiza aquí. Para publicarla en el perfil público falta habilitar la subida de
            archivos en el servidor: por ahora solo se guardan imágenes con dirección HTTPS.
          </p>
        </Card>

        <Card className="space-y-4">
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

        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-bold">Ubicación</h2>
            <p className="mt-0.5 text-xs text-muted">
              Así te encuentran los deportistas. Toca el mapa para marcar dónde está tu club.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Comuna">
              <input
                className={inputClass}
                list="comunas-rm"
                autoComplete="off"
                placeholder="Ej: Ñuñoa"
                value={f.zona}
                onChange={(e) => cambiarComuna(e.target.value)}
              />
              <datalist id="comunas-rm">
                {COMUNAS_RM.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Campo>
            <Campo label="Dirección">
              <input
                className={inputClass}
                placeholder="Calle y número"
                value={f.direccion}
                onChange={(e) => set("direccion", e.target.value)}
              />
            </Campo>
          </div>

          <MapaUbicacion foco={foco} pin={pin} onElegir={marcar} alto={320} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={usarCentroDeLaComuna}
              disabled={!comunaOficial(f.zona)}
              className={`${btnGhost} inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <LocateFixed size={16} />
              Usar el centro de la comuna
            </button>
            {pin ? (
              <button type="button" onClick={quitarMarca} className="text-xs font-semibold text-danger">
                Quitar marca
              </button>
            ) : null}
            <p className="text-xs text-muted">
              {pin
                ? `Marcado: ${pin[0].toFixed(5)}, ${pin[1].toFixed(5)}`
                : "Aún no marcas la ubicación del club."}
            </p>
          </div>
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

        {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
        <div className="flex items-center gap-4">
          <button type="submit" className={btnPrimary}>Guardar cambios</button>
          {guardado ? <p className="text-sm font-semibold text-success">Cambios guardados</p> : null}
        </div>
      </form>
    </section>
  );
}