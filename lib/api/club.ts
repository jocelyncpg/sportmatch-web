import { apiGw } from "./cliente";
import { queryString, validarTexto } from "./validaciones.mjs";

export interface Deporte {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Ubicacion {
  direccion: string | null;
  comuna: string | null;
  provincia: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface ClubSummary {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  logo: string | null;
  direccion: string | null;
  comuna: string | null;
  verificado: boolean;
  deportes: Deporte[];
}

export interface ClubPage {
  items: ClubSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface ClubProfile {
  id: string;
  nombre: string;
  rut: string | null;
  descripcion: string | null;
  historia: string | null;
  logo: string | null;
  portada: string | null;
  ubicacion: Ubicacion;
  email_contacto: string | null;
  telefono: string | null;
  sitio_web: string | null;
  redes_sociales: Record<string, string>;
  verificado: boolean;
  deportes: Deporte[];
  convocatorias_abiertas: ConvocatoriaResumen[];
}

export interface ClubMio extends Omit<ClubProfile, "convocatorias_abiertas"> {
  is_active: boolean;
  estado_verificacion: string;
  fecha_creacion: string | null;
  fecha_actualizacion: string | null;
  mi_rol: "PRINCIPAL" | "ADMIN";
}

export interface ConvocatoriaResumen {
  id: string;
  titulo: string | null;
  estado: "ABIERTA" | "CERRADA" | "FINALIZADA";
}

export interface ClubUpdate {
  nombre?: string;
  descripcion?: string | null;
  historia?: string | null;
  direccion?: string | null;
  comuna?: string | null;
  provincia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  email_contacto?: string | null;
  sitio_web?: string | null;
  logo?: string | null;
  portada?: string | null;
  redes_sociales?: Record<string, string | null> | null;
  deporte_ids?: number[];
}

function validarOpcional(
  valor: string | null | undefined,
  etiqueta: string,
  max: number,
  min = 1
) {
  if (valor != null && valor.trim()) {
    validarTexto(valor, etiqueta, min, max);
  }
}

export async function miClub(): Promise<ClubMio> {
  return apiGw("clubs/me");
}

export async function editarMiClub(clubId: string, datos: ClubUpdate): Promise<ClubMio> {
  if (!Object.keys(datos).length) {
    throw new Error("Envía al menos un campo para actualizar.");
  }
  if (datos.nombre !== undefined) {
    validarTexto(datos.nombre, "El nombre del club", 2, 100);
  }
  validarOpcional(datos.descripcion, "La descripción", 500);
  validarOpcional(datos.historia, "La historia", 3000);
  validarOpcional(datos.direccion, "La dirección", 255);
  validarOpcional(datos.comuna, "La comuna", 80, 2);
  validarOpcional(datos.provincia, "La provincia", 80, 2);
  validarOpcional(datos.telefono, "El teléfono", 20);
  validarOpcional(datos.email_contacto, "El correo de contacto", 100);
  validarOpcional(datos.sitio_web, "El sitio web", 300);
  validarOpcional(datos.logo, "El logo", 255);
  validarOpcional(datos.portada, "La portada", 255);
  if (datos.telefono && !/^\+?[0-9][0-9 ()-]{6,19}$/.test(datos.telefono.trim())) {
    throw new Error("El teléfono no tiene un formato válido.");
  }
  if (
    datos.email_contacto &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email_contacto.trim())
  ) {
    throw new Error("El correo de contacto no tiene un formato válido.");
  }
  if (datos.sitio_web && !/^https?:\/\/\S+$/.test(datos.sitio_web.trim())) {
    throw new Error("El sitio web debe comenzar con http:// o https://.");
  }
  const imagenSegura = (url: string | null | undefined) => !url || /^https:\/\/\S+$/.test(url.trim());
  if (!imagenSegura(datos.logo) || !imagenSegura(datos.portada)) {
    throw new Error("El logo y la portada deben usar una dirección HTTPS.");
  }
  if (datos.redes_sociales) {
    for (const [red, url] of Object.entries(datos.redes_sociales)) {
      if (!["instagram", "facebook", "x", "tiktok", "youtube"].includes(red)) {
        throw new Error("La red social indicada no es válida.");
      }
      if (url != null && url.trim() && (!imagenSegura(url) || url.length > 300)) {
        throw new Error(`El enlace de ${red} debe ser HTTPS y no superar 300 caracteres.`);
      }
    }
  }
  for (const [campo, valor] of [["comuna", datos.comuna], ["provincia", datos.provincia]] as const) {
    if (valor?.trim() && !/^[\p{L}.]+(?:[ '-][\p{L}.]+)*$/u.test(valor.trim())) {
      throw new Error(`El campo ${campo} contiene caracteres no válidos.`);
    }
  }
  if (
    datos.deporte_ids &&
    (datos.deporte_ids.length > 30 ||
      new Set(datos.deporte_ids).size !== datos.deporte_ids.length ||
      datos.deporte_ids.some((id) => !Number.isInteger(id) || id < 1))
  ) {
    throw new Error("La lista de deportes no es válida.");
  }
  if ((datos.latitud == null) !== (datos.longitud == null)) {
    throw new Error("La latitud y la longitud deben enviarse juntas.");
  }
  if (datos.latitud != null && (datos.latitud < -90 || datos.latitud > 90)) {
    throw new Error("La latitud debe estar entre -90 y 90.");
  }
  if (datos.longitud != null && (datos.longitud < -180 || datos.longitud > 180)) {
    throw new Error("La longitud debe estar entre -180 y 180.");
  }
  return apiGw(`clubs/${encodeURIComponent(clubId)}`, { method: "PATCH", body: datos });
}

export async function listarDeportes(): Promise<Deporte[]> {
  return apiGw("clubs/deportes");
}

export async function agregarDeporte(clubId: string, deporteId: number): Promise<void> {
  await apiGw(`clubs/${encodeURIComponent(clubId)}/deportes/${deporteId}`, { method: "PUT" });
}

export async function quitarDeporte(clubId: string, deporteId: number): Promise<void> {
  await apiGw(`clubs/${encodeURIComponent(clubId)}/deportes/${deporteId}`, { method: "DELETE" });
}

export async function listarClubes(
  filtros: {
    nombre?: string;
    deporte?: string;
    deporte_id?: number;
    zona?: string;
    page?: number;
    page_size?: number;
  } = {}
): Promise<ClubPage> {
  return apiGw(`clubs${queryString(filtros)}`);
}

export async function obtenerClub(clubId: string): Promise<ClubProfile> {
  return apiGw(`clubs/${encodeURIComponent(clubId)}`);
}
