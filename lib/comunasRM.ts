import { CENTRO_SANTIAGO, COMUNAS } from "./comunas";

// Comunas de la Región Metropolitana: es la zona donde opera el proyecto.
export const COMUNAS_RM = [
  "Alhué", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia", "Colina", "Conchalí", "Curacaví",
  "El Bosque", "El Monte", "Estación Central", "Huechuraba", "Independencia", "Isla de Maipo",
  "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Lampa", "Las Condes",
  "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "María Pinto", "Melipilla", "Ñuñoa",
  "Padre Hurtado", "Paine", "Pedro Aguirre Cerda", "Peñaflor", "Peñalolén", "Pirque", "Providencia",
  "Pudahuel", "Puente Alto", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo",
  "San Joaquín", "San José de Maipo", "San Miguel", "San Pedro", "San Ramón", "Santiago", "Talagante",
  "Tiltil", "Vitacura",
];

// Centros aproximados de algunas comunas más, además de las de lib/comunas.ts.
// Solo sirven para que el mapa abra cerca; la ubicación exacta la marca el club.
const CENTROS_EXTRA: Record<string, [number, number]> = {
  "Estación Central": [-33.456, -70.68],
  Independencia: [-33.417, -70.666],
  Recoleta: [-33.406, -70.64],
  Huechuraba: [-33.365, -70.637],
  "Lo Barnechea": [-33.35, -70.52],
  "La Reina": [-33.445, -70.538],
  "San Miguel": [-33.497, -70.651],
  Renca: [-33.403, -70.721],
  Quilicura: [-33.365, -70.73],
  "Puente Alto": [-33.612, -70.575],
  "San Bernardo": [-33.592, -70.699],
};

const sinTildes = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Nombre oficial de la comuna si el texto coincide (sin importar mayúsculas ni tildes); si no, null. */
export function comunaOficial(texto: string): string | null {
  const q = sinTildes(texto);
  return COMUNAS_RM.find((c) => sinTildes(c) === q) ?? null;
}

/** Punto hacia el que abre el mapa para una comuna; Santiago centro si no se conoce. */
export function centroDeComuna(texto: string): [number, number] {
  const oficial = comunaOficial(texto);
  if (!oficial) return CENTRO_SANTIAGO;
  return COMUNAS[oficial] ?? CENTROS_EXTRA[oficial] ?? CENTRO_SANTIAGO;
}

/** Formato que acepta el backend para comuna y provincia (solo letras, espacios, guiones, apóstrofos y puntos). */
export const FORMATO_COMUNA = /^[\p{L}.]+(?:[ '-][\p{L}.]+)*$/u;