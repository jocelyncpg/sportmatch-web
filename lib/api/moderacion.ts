import { useEffect, useSyncExternalStore } from "react";
import { SIN_SOPORTE, registroDesdeApi, reporteDesdeApi, sancionDesdeApi, tipoSancionAlBackend } from "./mapeo-admin.mjs";
import { listarAuditoria } from "./auditoria";
import { listarReportesAdmin, resolverReporte } from "./reportes";
import {
  aplicarSancion as aplicarSancionApi,
  levantarSancion as levantarSancionApi,
  listarSanciones,

} from "./sanciones";

// Datos de moderación para las pantallas de admin (reportes HU-47, sanciones HU-45 y auditoría HU-48), tomados de la
// API real por el BFF. Las pantallas siguen usando el mismo modelo de siempre; los nombres de la web y los del backend
// se traducen solo aquí (por ejemplo "definitiva" <-> "permanente", y un reporte "descartado" cuenta como "revisado").
// No guarda nada en el navegador.

export type TipoReporte = "usuario" | "actividad" | "mensaje";
export type EstadoReporte = "pendiente" | "revisado" | "escalado";
export type TipoSancion = "temporal" | "definitiva";
export type AccionAdmin =
  | "reporte_revisado"
  | "sancion_aplicada"
  | "sancion_levantada"
  | "oferta_creada"
  | "oferta_editada"
  | "oferta_desactivada"
  | "oferta_reactivada"
  | "membresia_modificada"
  | "pago_reembolsado";

export const MOTIVOS_REPORTE = [
  "Acoso o lenguaje ofensivo",
  "Perfil falso o suplantación",
  "Spam o publicidad",
  "Contenido inapropiado",
  "Conducta peligrosa",
  "Otro",
];

export const ETIQUETA_TIPO: Record<TipoReporte, string> = {
  usuario: "Perfil",
  actividad: "Actividad",
  mensaje: "Mensaje de chat",
};

export const ETIQUETA_ACCION: Record<AccionAdmin, string> = {
  reporte_revisado: "Reporte revisado",
  sancion_aplicada: "Sanción aplicada",
  sancion_levantada: "Sanción levantada",
  oferta_creada: "Plan o convenio creado",
  oferta_editada: "Plan o convenio editado",
  oferta_desactivada: "Plan o convenio desactivado",
  oferta_reactivada: "Plan o convenio reactivado",
  membresia_modificada: "Membresía modificada",
  pago_reembolsado: "Pago reembolsado",
};

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  /** Dónde ocurrió: nombre de la actividad, del chat, etc. */
  referencia: string;
  /** Persona a la que se sancionaría (autora del perfil, actividad o mensaje reportado). */
  usuarioId: string;
  usuarioNombre: string;
  motivo: string;
  detalle: string;
  emitidoPor: string;
  creadoEn: string; // ISO
  estado: EstadoReporte;
  resueltoEn?: string; // ISO
  resueltoPor?: string;
  nota?: string;
  sancionId?: string;
}

export interface Sancion {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  tipo: TipoSancion;
  dias: number | null; // null = definitiva
  motivo: string;
  reporteId: string | null;
  aplicadaPor: string;
  aplicadaEn: string; // ISO
  terminaEn: string | null; // ISO; null = definitiva
  levantadaEn?: string; // ISO
}

export interface RegistroAuditoria {
  id: string;
  fecha: string; // ISO
  admin: string;
  accion: AccionAdmin;
  resumen: string;
  recurso: string;
  motivo: string;
}

export interface NotificacionSancion {
  id: string;
  texto: string;
  fecha: string; // ISO
}

export interface Moderacion {
  reportes: Reporte[];
  sanciones: Sancion[];
  auditoria: RegistroAuditoria[];
  notificaciones: NotificacionSancion[];
  /** Mensaje si no se pudieron traer los datos (lo muestra la pantalla con su aviso de siempre). */
  error?: string;
}

export type Resultado = { ok: true; aviso?: string } | { ok: false; motivo: string };

// ---------- traducción API -> modelo de las pantallas ----------

// ---------- store ----------

const VACIO: Moderacion = { reportes: [], sanciones: [], auditoria: [], notificaciones: [] };
let estado: Moderacion = VACIO;
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
async function todas<T>(pedir: (pagina: number) => Promise<T[]>, limite: number): Promise<T[]> {
  const salida: T[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const lote = await pedir(pagina);
    salida.push(...lote);
    if (lote.length < limite) break;
  }
  return salida;
}

/** Trae de la API los reportes, las sanciones y la auditoría (hasta 5 páginas de cada una, lo más reciente primero). */
export async function cargarModeracion(): Promise<void> {
  const mio = ++pedido;
  try {
    const [reportes, sanciones, auditoria] = await Promise.all([
      todas((p) => listarReportesAdmin("todos", p, 100), 100),
      todas((p) => listarSanciones("todas", p, 100), 100),
      (async () => {
        const salida: RegistroAuditoria[] = [];
        for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
          const r = await listarAuditoria({ pagina, porPagina: 100 });
          salida.push(...r.items.map(registroDesdeApi));
          if (pagina >= r.total_paginas) break;
        }
        return salida;
      })(),
    ]);
    if (mio !== pedido) return;
    estado = { reportes: reportes.map(reporteDesdeApi), sanciones: sanciones.map(sancionDesdeApi), auditoria, notificaciones: [] };
  } catch (e) {
    if (mio !== pedido) return;
    estado = { ...estado, error: e instanceof Error && e.message ? e.message : "No se pudo cargar la información." };
  }
  emitir();
}

export function useModeracion(habilitado = true): Moderacion {
  const datos = useSyncExternalStore(suscribir, () => estado, () => VACIO);
  useEffect(() => {
    if (habilitado) void cargarModeracion();
  }, [habilitado]);
  return habilitado ? datos : VACIO;
}

/** Estado actual, para pruebas. */
export function getModeracion(): Moderacion {
  return estado;
}

// ---------- consultas derivadas ----------

/** Una sanción está vigente si no se levantó y todavía no termina (las definitivas nunca terminan). */
export function estaActiva(s: Sancion, ahora: number = Date.now()): boolean {
  if (s.levantadaEn) return false;
  return s.terminaEn === null || new Date(s.terminaEn).getTime() > ahora;
}

export function sancionVigenteDe(sanciones: Sancion[], usuarioId: string, ahora: number = Date.now()): Sancion | undefined {
  return sanciones.find((s) => s.usuarioId === usuarioId && estaActiva(s, ahora));
}

/** Cuántos reportes ha recibido cada persona (sin contar los ya revisados como infundados). */
export function reportesPorUsuario(reportes: Reporte[]): { usuarioId: string; usuarioNombre: string; total: number; pendientes: number }[] {
  const mapa = new Map<string, { usuarioId: string; usuarioNombre: string; total: number; pendientes: number }>();
  for (const r of reportes) {
    if (r.estado === "revisado") continue;
    // Un reporte de una actividad o un mensaje cuyo autor no se pudo averiguar no tiene a quién nombrar aquí.
    if (r.usuarioId === "") continue;
    const fila = mapa.get(r.usuarioId) ?? { usuarioId: r.usuarioId, usuarioNombre: r.usuarioNombre, total: 0, pendientes: 0 };
    fila.total += 1;
    if (r.estado === "pendiente") fila.pendientes += 1;
    mapa.set(r.usuarioId, fila);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total || a.usuarioNombre.localeCompare(b.usuarioNombre));
}

export const textoDuracion = (s: Pick<Sancion, "tipo" | "dias">) =>
  s.tipo === "definitiva" ? "definitiva" : `${s.dias} ${s.dias === 1 ? "día" : "días"}`;

// ---------- acciones del administrador (el backend deja el registro de auditoría) ----------

const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** HU-47: el reporte no amerita sanción. Solo se puede resolver un reporte pendiente. */
export async function marcarRevisado(reporteId: string, admin: string, nota: string = ""): Promise<Resultado> {
  void admin;
  const r = estado.reportes.find((x) => x.id === reporteId);
  if (!r) return { ok: false, motivo: "No encontramos este reporte." };
  if (r.estado !== "pendiente") return { ok: false, motivo: "Este reporte ya fue resuelto." };
  try {
    await resolverReporte(reporteId, "revisado", nota.trim() || undefined);
  } catch (e) {
    return { ok: false, motivo: mensajeDe(e, "No se pudo actualizar el reporte.") };
  }
  await cargarModeracion();
  return { ok: true };
}

export type DatosSancion = {
  usuarioId: string;
  usuarioNombre: string;
  tipo: TipoSancion;
  /** Obligatorio si es temporal (1 a 365). */
  dias?: number;
  motivo: string;
  /** Si viene de un reporte, el reporte queda "escalado". */
  reporteId?: string;
};

/** HU-45: suspende a la persona (temporal o definitiva) y deja registrada la notificación con motivo y duración. */
export async function aplicarSancion(d: DatosSancion, admin: string): Promise<Resultado> {
  void admin;
  const motivo = d.motivo.trim();
  if (motivo.length < 5) return { ok: false, motivo: "Escribe el motivo (mínimo 5 letras): la persona lo recibirá." };
  if (d.tipo === "temporal") {
    if (!Number.isInteger(d.dias) || (d.dias as number) < 1 || (d.dias as number) > 365) {
      return { ok: false, motivo: "La suspensión temporal debe durar entre 1 y 365 días." };
    }
  }
  if (sancionVigenteDe(estado.sanciones, d.usuarioId)) {
    return { ok: false, motivo: `${d.usuarioNombre} ya tiene una sanción vigente.` };
  }
  // Un reporte de una actividad o de un mensaje cuyo autor no se pudo averiguar no trae la cuenta: sin ese dato no hay a quién sancionar.
  if (!UUID.test(d.usuarioId)) return { ok: false, motivo: SIN_SOPORTE };
  const reporte = d.reporteId ? estado.reportes.find((x) => x.id === d.reporteId) : undefined;
  if (d.reporteId) {
    if (!reporte) return { ok: false, motivo: "No encontramos este reporte." };
    if (reporte.estado !== "pendiente") return { ok: false, motivo: "Este reporte ya fue resuelto." };
  }
  try {
    // El backend pide que el reporte esté escalado antes de asociarlo a una sanción.
    if (reporte) await resolverReporte(reporte.id, "escalado", motivo);
    await aplicarSancionApi({ usuarioId: d.usuarioId, tipo: tipoSancionAlBackend(d.tipo), dias: d.dias, motivo, reporteId: reporte?.id });
  } catch (e) {
    await cargarModeracion();
    return { ok: false, motivo: mensajeDe(e, "No se pudo aplicar la suspensión.") };
  }
  await cargarModeracion();
  const duracion = textoDuracion({ tipo: d.tipo, dias: d.tipo === "temporal" ? (d.dias as number) : null });
  return { ok: true, aviso: `Se notificó a ${d.usuarioNombre}: su cuenta quedó suspendida (${duracion}). Motivo: ${motivo}` };
}

/** El administrador devuelve el acceso antes de tiempo. Queda registrado con su motivo. */
export async function levantarSancion(sancionId: string, admin: string, motivo: string): Promise<Resultado> {
  void admin;
  const s = estado.sanciones.find((x) => x.id === sancionId);
  if (!s) return { ok: false, motivo: "No encontramos esta sanción." };
  if (!estaActiva(s)) return { ok: false, motivo: "Esta sanción ya no está vigente." };
  const limpio = motivo.trim();
  if (limpio.length < 5) return { ok: false, motivo: "Escribe por qué se levanta la sanción (mínimo 5 letras)." };
  try {
    await levantarSancionApi(sancionId, limpio);
  } catch (e) {
    return { ok: false, motivo: mensajeDe(e, "No se pudo levantar la suspensión.") };
  }
  await cargarModeracion();
  return { ok: true };
}
