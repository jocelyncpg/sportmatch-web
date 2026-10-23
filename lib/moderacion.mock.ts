// MOCK de moderación: reportes (HU-47), sanciones (HU-45) y registro de auditoría (HU-48).
// Solo para desarrollo local (se guarda en localStorage).
// Cuando el Gateway esté listo, cada función de abajo se reemplaza por una llamada a la API.
// NO subir este archivo a main.

import { useSyncExternalStore } from "react";

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
  | "oferta_reactivada";

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
}

export type Resultado = { ok: true; aviso?: string } | { ok: false; motivo: string };

const ADMIN_SEMILLA = "admin@sportmatch.cl";

const SEMILLA: Moderacion = {
  reportes: [
    {
      id: "r1", tipo: "mensaje", referencia: "Chat grupal · Running Parque Araucano",
      usuarioId: "u-diego", usuarioNombre: "Diego Fuentes",
      motivo: "Acoso o lenguaje ofensivo",
      detalle: "Insultó a otra participante después de que cancelara su asistencia.",
      emitidoPor: "Camila Vera", creadoEn: "2026-10-21T18:40:00", estado: "pendiente",
    },
    {
      id: "r2", tipo: "usuario", referencia: "Perfil de Diego Fuentes",
      usuarioId: "u-diego", usuarioNombre: "Diego Fuentes",
      motivo: "Conducta peligrosa",
      detalle: "Me escribió por privado insistiendo en que fuera sola a un entrenamiento de noche.",
      emitidoPor: "Fernanda Díaz", creadoEn: "2026-10-22T09:15:00", estado: "pendiente",
    },
    {
      id: "r3", tipo: "actividad", referencia: "Fútbol 7 · sábado 24-10",
      usuarioId: "u-jorge", usuarioNombre: "Jorge Soto",
      motivo: "Spam o publicidad",
      detalle: "La actividad es una publicidad de una academia, no un encuentro deportivo.",
      emitidoPor: "Matías Rojas", creadoEn: "2026-10-22T20:05:00", estado: "pendiente",
    },
    {
      id: "r4", tipo: "usuario", referencia: "Perfil de Ignacia Muñoz",
      usuarioId: "u-ignacia", usuarioNombre: "Ignacia Muñoz",
      motivo: "Perfil falso o suplantación",
      detalle: "Usa fotos de una deportista profesional como si fueran suyas.",
      emitidoPor: "Camila Vera", creadoEn: "2026-10-20T12:30:00", estado: "revisado",
      resueltoEn: "2026-10-20T16:00:00", resueltoPor: ADMIN_SEMILLA,
      nota: "Se verificó con la usuaria; las fotos son propias.",
    },
  ],
  sanciones: [
    {
      id: "s1", usuarioId: "u-jorge", usuarioNombre: "Jorge Soto", tipo: "temporal", dias: 7,
      motivo: "Mensajes repetidos de publicidad en chats grupales.", reporteId: null,
      aplicadaPor: ADMIN_SEMILLA, aplicadaEn: "2026-09-20T11:00:00", terminaEn: "2026-09-27T11:00:00",
    },
  ],
  auditoria: [
    {
      id: "a1", fecha: "2026-09-20T11:00:00", admin: ADMIN_SEMILLA, accion: "sancion_aplicada",
      resumen: "Suspensión temporal por 7 días", recurso: "Jorge Soto",
      motivo: "Mensajes repetidos de publicidad en chats grupales.",
    },
    {
      id: "a2", fecha: "2026-10-20T16:00:00", admin: ADMIN_SEMILLA, accion: "reporte_revisado",
      resumen: "Reporte marcado como revisado", recurso: "Ignacia Muñoz · Perfil de Ignacia Muñoz",
      motivo: "Se verificó con la usuaria; las fotos son propias.",
    },
  ],
  notificaciones: [],
};

const KEY = "sportmatch_web_moderacion";
let estado: Moderacion = SEMILLA;
let cargado = false;
const oyentes = new Set<() => void>();

function cargar() {
  if (cargado || typeof window === "undefined") return;
  cargado = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) estado = JSON.parse(raw) as Moderacion;
  } catch {
    /* sin datos guardados: se usa la semilla */
  }
}

function guardar(siguiente: Moderacion) {
  estado = siguiente;
  try {
    localStorage.setItem(KEY, JSON.stringify(siguiente));
  } catch {
    /* sin almacenamiento disponible */
  }
  oyentes.forEach((o) => o());
}

function suscribir(o: () => void) {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
}

export function useModeracion(): Moderacion {
  return useSyncExternalStore(
    suscribir,
    () => {
      cargar();
      return estado;
    },
    () => SEMILLA
  );
}

/** Estado actual, para pruebas. */
export function getModeracion(): Moderacion {
  cargar();
  return estado;
}

let contador = 0;
const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${(contador++).toString(36)}`;

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
    const fila = mapa.get(r.usuarioId) ?? { usuarioId: r.usuarioId, usuarioNombre: r.usuarioNombre, total: 0, pendientes: 0 };
    fila.total += 1;
    if (r.estado === "pendiente") fila.pendientes += 1;
    mapa.set(r.usuarioId, fila);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total || a.usuarioNombre.localeCompare(b.usuarioNombre));
}

export const textoDuracion = (s: Pick<Sancion, "tipo" | "dias">) =>
  s.tipo === "definitiva" ? "definitiva" : `${s.dias} ${s.dias === 1 ? "día" : "días"}`;

// ---------- acciones del administrador (todas dejan registro de auditoría) ----------

function registro(d: Omit<RegistroAuditoria, "id" | "fecha">, ahora: string): RegistroAuditoria {
  return { ...d, id: nuevoId("a"), fecha: ahora };
}

/**
 * Deja una acción administrativa en la auditoría (HU-48). La usan otros módulos del panel admin,
 * por ejemplo la gestión de planes y convenios (HU-56).
 */
export function registrarAccion(
  d: Omit<RegistroAuditoria, "id" | "fecha">,
  ahora: Date = new Date()
): void {
  cargar();
  guardar({ ...estado, auditoria: [registro(d, ahora.toISOString()), ...estado.auditoria] });
}

/** HU-47: el reporte no amerita sanción. Solo se puede resolver un reporte pendiente. */
export function marcarRevisado(reporteId: string, admin: string, nota: string = "", ahora: Date = new Date()): Resultado {
  cargar();
  const r = estado.reportes.find((x) => x.id === reporteId);
  if (!r) return { ok: false, motivo: "No encontramos este reporte." };
  if (r.estado !== "pendiente") return { ok: false, motivo: "Este reporte ya fue resuelto." };
  const iso = ahora.toISOString();
  const limpia = nota.trim();
  guardar({
    ...estado,
    reportes: estado.reportes.map((x) =>
      x.id === reporteId ? { ...x, estado: "revisado", resueltoEn: iso, resueltoPor: admin, nota: limpia || undefined } : x
    ),
    auditoria: [
      registro(
        {
          admin, accion: "reporte_revisado", resumen: "Reporte marcado como revisado",
          recurso: `${r.usuarioNombre} · ${r.referencia}`, motivo: limpia || `Reporte por "${r.motivo}" sin sanción.`,
        },
        iso
      ),
      ...estado.auditoria,
    ],
  });
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
export function aplicarSancion(d: DatosSancion, admin: string, ahora: Date = new Date()): Resultado {
  cargar();
  const motivo = d.motivo.trim();
  if (motivo.length < 5) return { ok: false, motivo: "Escribe el motivo (mínimo 5 letras): la persona lo recibirá." };
  if (d.tipo === "temporal") {
    if (!Number.isInteger(d.dias) || (d.dias as number) < 1 || (d.dias as number) > 365) {
      return { ok: false, motivo: "La suspensión temporal debe durar entre 1 y 365 días." };
    }
  }
  if (sancionVigenteDe(estado.sanciones, d.usuarioId, ahora.getTime())) {
    return { ok: false, motivo: `${d.usuarioNombre} ya tiene una sanción vigente.` };
  }
  let reporte: Reporte | undefined;
  if (d.reporteId) {
    reporte = estado.reportes.find((x) => x.id === d.reporteId);
    if (!reporte) return { ok: false, motivo: "No encontramos este reporte." };
    if (reporte.estado !== "pendiente") return { ok: false, motivo: "Este reporte ya fue resuelto." };
  }

  const iso = ahora.toISOString();
  const dias = d.tipo === "temporal" ? (d.dias as number) : null;
  const termina = dias === null ? null : new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000).toISOString();
  const id = nuevoId("s");
  const sancion: Sancion = {
    id, usuarioId: d.usuarioId, usuarioNombre: d.usuarioNombre, tipo: d.tipo, dias, motivo,
    reporteId: d.reporteId ?? null, aplicadaPor: admin, aplicadaEn: iso, terminaEn: termina,
  };
  const duracion = textoDuracion(sancion);
  const aviso = `Se notificó a ${d.usuarioNombre}: su cuenta quedó suspendida (${duracion}). Motivo: ${motivo}`;

  guardar({
    ...estado,
    sanciones: [sancion, ...estado.sanciones],
    reportes: estado.reportes.map((x) =>
      x.id === d.reporteId
        ? { ...x, estado: "escalado", resueltoEn: iso, resueltoPor: admin, sancionId: id }
        : x
    ),
    auditoria: [
      registro(
        {
          admin, accion: "sancion_aplicada",
          resumen: d.tipo === "definitiva" ? "Suspensión definitiva" : `Suspensión temporal por ${duracion}`,
          recurso: reporte ? `${d.usuarioNombre} · ${reporte.referencia}` : d.usuarioNombre,
          motivo,
        },
        iso
      ),
      ...estado.auditoria,
    ],
    notificaciones: [{ id: nuevoId("n"), texto: aviso, fecha: iso }, ...estado.notificaciones],
  });
  return { ok: true, aviso };
}

/** El administrador devuelve el acceso antes de tiempo. Queda registrado con su motivo. */
export function levantarSancion(sancionId: string, admin: string, motivo: string, ahora: Date = new Date()): Resultado {
  cargar();
  const s = estado.sanciones.find((x) => x.id === sancionId);
  if (!s) return { ok: false, motivo: "No encontramos esta sanción." };
  if (!estaActiva(s, ahora.getTime())) return { ok: false, motivo: "Esta sanción ya no está vigente." };
  const limpio = motivo.trim();
  if (limpio.length < 5) return { ok: false, motivo: "Escribe por qué se levanta la sanción (mínimo 5 letras)." };
  const iso = ahora.toISOString();
  guardar({
    ...estado,
    sanciones: estado.sanciones.map((x) => (x.id === sancionId ? { ...x, levantadaEn: iso } : x)),
    auditoria: [
      registro(
        {
          admin, accion: "sancion_levantada", resumen: "Se devolvió el acceso a la cuenta",
          recurso: s.usuarioNombre, motivo: limpio,
        },
        iso
      ),
      ...estado.auditoria,
    ],
    notificaciones: [
      { id: nuevoId("n"), texto: `Se notificó a ${s.usuarioNombre}: su cuenta volvió a estar activa.`, fecha: iso },
      ...estado.notificaciones,
    ],
  });
  return { ok: true };
}

/** Solo para pruebas y para reiniciar la demo. */
export function reiniciarModeracion() {
  guardar(SEMILLA);
}