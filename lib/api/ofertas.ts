import { useEffect, useSyncExternalStore } from "react";
import {
  audienciaAlBackend, limpiarOferta as limpiar, ofertaDesdeApi as aOferta, suscripcionDesdeApi as aSuscripcion,
  tipoOfertaAlBackend, validarOferta as validar,
} from "./mapeo-admin.mjs";
import {
  crearPlan, desactivarPlan, editarPlan, LIMITE_SUSCRIPCIONES, listarPlanesAdmin, listarSuscripcionesPlan, reactivarPlan,
  type PlanAdmin,
} from "./planesAdmin";

// Planes y convenios (HU-56) para la pantalla de admin, tomados de Ms-club por el BFF (/payments/admin/plans).
// La pantalla sigue usando el modelo de siempre (plan o convenio, audiencia, activa...); los nombres del backend
// (categoria PLAN o CONVENIO, tipo USUARIO o CLUB, is_active...) se traducen solo aquí. No guarda nada en el navegador.
//
// Reglas de negocio (criterios de aceptación de la HU), que cumple el backend:
//  1. Cambiar el precio NO afecta a las suscripciones ya pagadas: cada suscripción guarda el precio que pagó.
//  2. Un plan desactivado deja de mostrarse en el catálogo, pero sus suscripciones vigentes siguen hasta su término.
//  3. Todo cambio queda en la auditoría (HU-48).

export type TipoOferta = "plan" | "convenio";
export type Audiencia = "deportista" | "club";

export const ETIQUETA_TIPO_OFERTA: Record<TipoOferta, string> = { plan: "Plan", convenio: "Convenio" };
export const ETIQUETA_AUDIENCIA: Record<Audiencia, string> = { deportista: "Deportistas", club: "Clubes" };

export interface Oferta {
  id: string;
  tipo: TipoOferta;
  audiencia: Audiencia;
  nombre: string;
  /** Solo convenios: la institución con la que se firmó. */
  institucion?: string;
  descripcion: string;
  /** Pesos chilenos por período (0 = gratis). */
  precio: number;
  /** Días que dura cada contratación. null = sin vencimiento (solo si es gratis). */
  duracionDias: number | null;
  beneficios: string[];
  activa: boolean;
  /** El plan base (Gratuito) no se puede desactivar: toda cuenta nueva parte ahí. */
  base?: boolean;
  creadaEn: string; // ISO
  actualizadaEn: string; // ISO
  desactivadaEn?: string; // ISO
  motivoDesactivacion?: string;
}

export interface Suscripcion {
  id: string;
  ofertaId: string;
  /** Nombre de la oferta al momento de contratar. */
  ofertaNombre: string;
  suscriptor: string;
  /** Lo que realmente pagó. No cambia aunque después cambie el precio del plan. */
  precioPagado: number;
  inicio: string; // ISO
  fin: string | null; // ISO; null = sin vencimiento
}

export interface Planes {
  ofertas: Oferta[];
  suscripciones: Suscripcion[];
  /** Mensaje si no se pudieron traer los datos (lo muestra la pantalla con su aviso de siempre). */
  error?: string;
}

export type DatosOferta = {
  tipo: TipoOferta;
  audiencia: Audiencia;
  nombre: string;
  institucion: string;
  descripcion: string;
  precio: number;
  duracionDias: number | null;
  beneficios: string[];
};

export type Resultado = { ok: true; aviso: string } | { ok: false; motivo: string };

// ---------- formato ----------

/** Pesos chilenos con punto de miles: 4990 → "$4.990". */
export const formatearCLP = (monto: number) => `$${String(Math.round(monto)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

export function duracionTexto(dias: number | null): string {
  if (dias === null) return "Sin vencimiento";
  if (dias === 365) return "1 año";
  if (dias % 30 === 0 && dias < 360) return dias === 30 ? "1 mes" : `${dias / 30} meses`;
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}

export const precioTexto = (o: Pick<Oferta, "precio" | "duracionDias">) =>
  o.precio === 0 ? "Gratis" : `${formatearCLP(o.precio)} por ${duracionTexto(o.duracionDias).toLowerCase()}`;

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });

// ---------- store ----------

const VACIO: Planes = { ofertas: [], suscripciones: [] };
let estado: Planes = VACIO;
const crudos = new Map<string, PlanAdmin>();
let pedido = 0;
const oyentes = new Set<() => void>();
const emitir = () => oyentes.forEach((o) => o());
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
};

const MAX_PAGINAS = 5;

/** Las suscripciones de un plan (hasta 5 páginas de 100: las vigentes primero). */
async function suscripcionesDe(plan: PlanAdmin): Promise<Suscripcion[]> {
  const salida: Suscripcion[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const r = await listarSuscripcionesPlan(plan.id, pagina);
    salida.push(...r.items.map((s) => aSuscripcion(s, plan.id)));
    if (r.items.length < LIMITE_SUSCRIPCIONES || salida.length >= r.total) break;
  }
  return salida;
}

/** Trae de la API todos los planes y convenios, activos e inactivos, y las suscripciones de cada uno. */
export async function cargarOfertas(): Promise<void> {
  const mio = ++pedido;
  try {
    const todos: PlanAdmin[] = [];
    for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
      const r = await listarPlanesAdmin({ estado: "todos", pagina, limit: 50 });
      todos.push(...r.items);
      if (r.items.length < 50) break;
    }
    // De a pocos planes a la vez, para no saturar el servicio.
    const suscripciones: Suscripcion[] = [];
    for (let i = 0; i < todos.length; i += 6) {
      const lotes = await Promise.all(todos.slice(i, i + 6).map(suscripcionesDe));
      for (const lote of lotes) suscripciones.push(...lote);
    }
    if (mio !== pedido) return;
    crudos.clear();
    for (const p of todos) crudos.set(String(p.id), p);
    estado = { ofertas: todos.map(aOferta), suscripciones };
  } catch (e) {
    if (mio !== pedido) return;
    estado = { ...estado, error: e instanceof Error && e.message ? e.message : "No se pudo cargar la información." };
  }
  emitir();
}

export function usePlanes(): Planes {
  const datos = useSyncExternalStore(suscribir, () => estado, () => VACIO);
  useEffect(() => {
    void cargarOfertas();
  }, []);
  return datos;
}

/** Estado actual, para pruebas. */
export function getPlanes(): Planes {
  return estado;
}

// ---------- consultas derivadas ----------

export function estaVigente(s: Suscripcion, ahora: number = Date.now()): boolean {
  return s.fin === null || new Date(s.fin).getTime() > ahora;
}

export function vigentesDe(suscripciones: Suscripcion[], ofertaId: string, ahora: number = Date.now()): Suscripcion[] {
  return suscripciones.filter((s) => s.ofertaId === ofertaId && estaVigente(s, ahora));
}

/** Fecha (ISO) en que termina la última suscripción vigente, o null si no hay (o ninguna vence). */
export function ultimoVencimiento(vigentes: Suscripcion[]): string | null {
  const fechas = vigentes.flatMap((s) => (s.fin ? [s.fin] : []));
  if (fechas.length === 0) return null;
  return fechas.reduce((a, b) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b));
}

/** Lo que ven los usuarios al contratar: solo las ofertas activas de su tipo de cuenta, de menor a mayor precio. */
export function catalogoPublico(ofertas: Oferta[], audiencia: Audiencia): Oferta[] {
  return ofertas.filter((o) => o.activa && o.audiencia === audiencia).sort((a, b) => a.precio - b.precio);
}

const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

// ---------- acciones del administrador (el backend deja el registro de auditoría) ----------

export async function crearOferta(datos: DatosOferta, admin: string): Promise<Resultado> {
  void admin;
  const d = limpiar(datos);
  const error = validar(d);
  if (error) return { ok: false, motivo: error };
  try {
    await crearPlan({
      nombre: d.nombre, tipo: audienciaAlBackend(d.audiencia), categoria: tipoOfertaAlBackend(d.tipo),
      descripcion: d.descripcion, institucion: d.tipo === "convenio" ? d.institucion : "", precio: d.precio,
      duracionDias: d.duracionDias, beneficios: d.beneficios,
    });
  } catch (e) {
    return { ok: false, motivo: mensajeDe(e, "No se pudo crear.") };
  }
  await cargarOfertas();
  const nombreTipo = ETIQUETA_TIPO_OFERTA[d.tipo];
  return { ok: true, aviso: `${nombreTipo} "${d.nombre}" creado. Ya aparece en el catálogo.` };
}

/** Describe qué cambió. */
function cambios(antes: Oferta, d: DatosOferta): string[] {
  const c: string[] = [];
  if (antes.nombre !== d.nombre) c.push(`nombre "${antes.nombre}" → "${d.nombre}"`);
  if (antes.tipo === "convenio" && (antes.institucion ?? "") !== d.institucion) {
    c.push(`institución "${antes.institucion ?? ""}" → "${d.institucion}"`);
  }
  if (antes.precio !== d.precio) c.push(`precio ${formatearCLP(antes.precio)} → ${formatearCLP(d.precio)}`);
  if (antes.duracionDias !== d.duracionDias) {
    c.push(`duración ${duracionTexto(antes.duracionDias)} → ${duracionTexto(d.duracionDias)}`);
  }
  if (antes.descripcion !== d.descripcion) c.push("descripción actualizada");
  if (JSON.stringify(antes.beneficios) !== JSON.stringify(d.beneficios)) c.push("beneficios actualizados");
  return c;
}

/**
 * Edita una oferta. El tipo y la audiencia no cambian.
 * El precio nuevo vale solo para contrataciones futuras: las suscripciones existentes no se tocan.
 */
export async function editarOferta(id: string, datos: DatosOferta, admin: string): Promise<Resultado> {
  void admin;
  const antes = estado.ofertas.find((o) => o.id === id);
  const crudo = crudos.get(id);
  if (!antes || !crudo) return { ok: false, motivo: "No encontramos este plan o convenio." };
  const d = limpiar({ ...datos, tipo: antes.tipo, audiencia: antes.audiencia });
  const error = validar(d);
  if (error) return { ok: false, motivo: error };
  const lista = cambios(antes, d);
  if (lista.length === 0) return { ok: false, motivo: "No hay cambios para guardar." };
  try {
    await editarPlan(crudo, {
      nombre: d.nombre, tipo: crudo.tipo, categoria: crudo.categoria, descripcion: d.descripcion,
      institucion: antes.tipo === "convenio" ? d.institucion : "", precio: d.precio, duracionDias: d.duracionDias, beneficios: d.beneficios,
    });
  } catch (e) {
    return { ok: false, motivo: mensajeDe(e, "No se pudo guardar.") };
  }
  const vigentes = vigentesDe(estado.suscripciones, id).length;
  await cargarOfertas();
  let aviso = `"${d.nombre}" actualizado.`;
  if (antes.precio !== d.precio && vigentes > 0) {
    aviso += ` El nuevo precio vale solo para nuevas contrataciones: ${vigentes} ${
      vigentes === 1 ? "suscripción vigente conserva" : "suscripciones vigentes conservan"
    } el precio que pagaron.`;
  }
  return { ok: true, aviso };
}

/** Quita la oferta del catálogo. Las suscripciones vigentes siguen hasta su término. */
export async function desactivarOferta(id: string, admin: string, motivo: string): Promise<Resultado> {
  void admin;
  const o = estado.ofertas.find((x) => x.id === id);
  if (!o) return { ok: false, motivo: "No encontramos este plan o convenio." };
  if (o.base) return { ok: false, motivo: `"${o.nombre}" es el plan base: toda cuenta nueva parte ahí, no se puede desactivar.` };
  if (!o.activa) return { ok: false, motivo: "Ya está desactivado." };
  const limpio = motivo.trim();
  if (limpio.length < 5) return { ok: false, motivo: "Escribe el motivo de la desactivación (mínimo 5 letras)." };
  const vigentes = vigentesDe(estado.suscripciones, id);
  const hasta = ultimoVencimiento(vigentes);
  try {
    await desactivarPlan(Number(id), limpio);
  } catch (e) {
    return { ok: false, motivo: mensajeDe(e, "No se pudo desactivar.") };
  }
  await cargarOfertas();
  const nota =
    vigentes.length === 0
      ? "No tenía suscripciones vigentes."
      : `${vigentes.length} ${vigentes.length === 1 ? "suscripción vigente sigue" : "suscripciones vigentes siguen"} activa${
          vigentes.length === 1 ? "" : "s"
        }${hasta ? ` hasta el ${fechaLarga(hasta)}` : ""}.`;
  return { ok: true, aviso: `"${o.nombre}" ya no aparece en el catálogo. ${nota}` };
}

/** Vuelve al catálogo una oferta desactivada. Si otro plan activo tomó su nombre, el backend responde 409 con el motivo. */
export async function reactivarOferta(id: string, admin: string): Promise<Resultado> {
  void admin;
  const o = estado.ofertas.find((x) => x.id === id);
  if (!o) return { ok: false, motivo: "No encontramos este plan o convenio." };
  if (o.activa) return { ok: false, motivo: "Ya está activo." };
  try {
    await reactivarPlan(Number(id));
  } catch (e) {
    return { ok: false, motivo: mensajeDe(e, "No se pudo reactivar.") };
  }
  await cargarOfertas();
  return { ok: true, aviso: `"${o.nombre}" vuelve a mostrarse en el catálogo.` };
}
