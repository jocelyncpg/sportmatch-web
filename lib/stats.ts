import { ESTADOS, NIVELES, type Convocatoria, type Postulante } from "./store.mock";

const DIA = 86_400_000;
const aFecha = (t: number) => new Date(t).toISOString().slice(0, 10);

// Postulaciones por día en los últimos `dias` días, terminando en la última postulación recibida.
export function porDia(postulantes: Postulante[], dias = 14) {
  if (postulantes.length === 0) return [];
  const fin = Math.max(...postulantes.map((p) => Date.parse(`${p.fechaPostulacion}T12:00:00Z`)));
  const filas: { fecha: string; etiqueta: string; valor: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const f = aFecha(fin - i * DIA);
    filas.push({
      fecha: f,
      etiqueta: new Date(`${f}T12:00:00Z`).toLocaleDateString("es-CL", { day: "numeric", month: "short", timeZone: "UTC" }),
      valor: postulantes.filter((p) => p.fechaPostulacion === f).length,
    });
  }
  return filas;
}

export const porEstado = (ps: Postulante[]) =>
  ESTADOS.map((e) => ({ nombre: e, valor: ps.filter((p) => p.estado === e).length }));

export const porNivel = (ps: Postulante[]) =>
  NIVELES.map((n) => ({ nombre: n, valor: ps.filter((p) => p.nivel === n).length }));

export const porConvocatoria = (ps: Postulante[], convs: Convocatoria[]) =>
  convs.map((c) => ({
    nombre: c.titulo,
    valor: ps.filter((p) => p.convocatoriaId === c.id).length,
    cupos: c.cupos,
  }));

export function porComuna(ps: Postulante[]) {
  const m = new Map<string, number>();
  ps.forEach((p) => m.set(p.comuna, (m.get(p.comuna) ?? 0) + 1));
  return [...m.entries()].map(([comuna, valor]) => ({ comuna, valor })).sort((a, b) => b.valor - a.valor);
}