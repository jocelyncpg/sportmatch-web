// MOCK de planes y convenios (HU-56) con sus suscripciones.
// Solo para desarrollo local (se guarda en localStorage).
// Cuando el Gateway esté listo, cada función de abajo se reemplaza por una llamada a Ms-club (/payments/plans).
// NO subir este archivo a main.
//
// Reglas de negocio (criterios de aceptación de la HU):
//  1. Cambiar el precio NO afecta a las suscripciones ya pagadas: cada suscripción guarda el precio que pagó.
//  2. Un plan desactivado deja de mostrarse en el catálogo, pero sus suscripciones vigentes siguen hasta su término.
//  3. Todo cambio queda en la auditoría (HU-48).

import { useSyncExternalStore } from "react";
import { registrarAccion } from "@/lib/moderacion.mock";

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

// ---------- datos de ejemplo ----------

const MES = 30;

const SEMILLA: Planes = {
  ofertas: [
    {
      id: "p-gratuito", tipo: "plan", audiencia: "deportista", nombre: "Gratuito",
      descripcion: "Para empezar a entrenar en comunidad.",
      precio: 0, duracionDias: null,
      beneficios: ["3 actividades al mes", "5 postulaciones activas a la vez", "Filtros de búsqueda básicos", "Chat con tus matches"],
      activa: true, base: true, creadaEn: "2026-09-01T10:00:00", actualizadaEn: "2026-09-01T10:00:00",
    },
    {
      id: "p-pro", tipo: "plan", audiencia: "deportista", nombre: "Pro",
      descripcion: "Para deportistas que entrenan seguido.",
      precio: 4990, duracionDias: MES,
      beneficios: [
        "Actividades sin límite", "Postulaciones sin límite", "Filtros de búsqueda avanzados",
        "Chat con tus matches", "Insignia de perfil destacado",
      ],
      activa: true, creadaEn: "2026-09-01T10:00:00", actualizadaEn: "2026-10-10T12:00:00",
    },
    {
      id: "p-club", tipo: "plan", audiencia: "club", nombre: "Club",
      descripcion: "Para clubes, escuelas y comunidades.",
      precio: 19990, duracionDias: MES,
      beneficios: [
        "Panel web para el club", "Convocatorias y gestión de postulantes", "Estadísticas de postulaciones",
        "Actividades y postulaciones sin límite",
      ],
      activa: true, creadaEn: "2026-09-01T10:00:00", actualizadaEn: "2026-09-01T10:00:00",
    },
    {
      id: "c-duoc", tipo: "convenio", audiencia: "deportista", nombre: "Convenio DuocUC", institucion: "DuocUC",
      descripcion: "Precio especial para estudiantes con correo institucional.",
      precio: 2990, duracionDias: MES,
      beneficios: ["Todo lo del plan Pro", "Insignia de estudiante"],
      activa: true, creadaEn: "2026-09-15T10:00:00", actualizadaEn: "2026-09-15T10:00:00",
    },
    {
      id: "c-aconcagua", tipo: "convenio", audiencia: "deportista", nombre: "Convenio Gimnasio Aconcagua",
      institucion: "Gimnasio Aconcagua",
      descripcion: "Descuento para socios del gimnasio.",
      precio: 3490, duracionDias: MES,
      beneficios: ["Todo lo del plan Pro", "Pase de invitado al gimnasio"],
      activa: false, creadaEn: "2026-09-20T10:00:00", actualizadaEn: "2026-10-15T09:00:00",
      desactivadaEn: "2026-10-15T09:00:00", motivoDesactivacion: "El gimnasio terminó el convenio.",
    },
  ],
  suscripciones: [
    { id: "su1", ofertaId: "p-pro", ofertaNombre: "Pro", suscriptor: "Camila Vera", precioPagado: 3990, inicio: "2026-10-05T10:00:00", fin: "2026-11-04T10:00:00" },
    { id: "su2", ofertaId: "p-pro", ofertaNombre: "Pro", suscriptor: "Matías Rojas", precioPagado: 4990, inicio: "2026-10-12T10:00:00", fin: "2026-11-11T10:00:00" },
    { id: "su3", ofertaId: "p-club", ofertaNombre: "Club", suscriptor: "Club Deportivo Los Cóndores", precioPagado: 19990, inicio: "2026-10-10T10:00:00", fin: "2026-11-09T10:00:00" },
    { id: "su4", ofertaId: "c-duoc", ofertaNombre: "Convenio DuocUC", suscriptor: "Fernanda Díaz", precioPagado: 2990, inicio: "2026-10-18T10:00:00", fin: "2026-11-17T10:00:00" },
    { id: "su5", ofertaId: "c-aconcagua", ofertaNombre: "Convenio Gimnasio Aconcagua", suscriptor: "Ignacio Torres", precioPagado: 3490, inicio: "2026-10-01T10:00:00", fin: "2026-10-31T10:00:00" },
    { id: "su6", ofertaId: "p-pro", ofertaNombre: "Pro", suscriptor: "Jorge Soto", precioPagado: 4990, inicio: "2026-09-01T10:00:00", fin: "2026-10-01T10:00:00" },
  ],
};

// ---------- store ----------

const KEY = "sportmatch_web_planes";
let estado: Planes = SEMILLA;
let cargado = false;
const oyentes = new Set<() => void>();

function cargar() {
  if (cargado || typeof window === "undefined") return;
  cargado = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) estado = JSON.parse(raw) as Planes;
  } catch {
    /* sin datos guardados: se usa la semilla */
  }
}

function guardar(siguiente: Planes) {
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

export function usePlanes(): Planes {
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
export function getPlanes(): Planes {
  cargar();
  return estado;
}

let contador = 0;
const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${(contador++).toString(36)}`;

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

// ---------- validación ----------

function limpiar(d: DatosOferta): DatosOferta {
  const beneficios = d.beneficios.map((b) => b.trim()).filter((b, i, todos) => b !== "" && todos.indexOf(b) === i);
  return {
    ...d,
    nombre: d.nombre.trim(),
    institucion: d.institucion.trim(),
    descripcion: d.descripcion.trim(),
    beneficios,
  };
}

function validar(d: DatosOferta, ofertas: Oferta[], idActual?: string): string | null {
  if (d.nombre.length < 3 || d.nombre.length > 60) return "El nombre debe tener entre 3 y 60 letras.";
  const repetido = ofertas.some(
    (o) =>
      o.id !== idActual &&
      o.tipo === d.tipo &&
      o.audiencia === d.audiencia &&
      o.nombre.toLowerCase() === d.nombre.toLowerCase()
  );
  if (repetido) return `Ya existe un ${d.tipo === "plan" ? "plan" : "convenio"} con el nombre "${d.nombre}" para esa audiencia.`;
  if (d.tipo === "convenio" && (d.institucion.length < 3 || d.institucion.length > 80)) {
    return "Indica la institución del convenio (entre 3 y 80 letras).";
  }
  if (d.descripcion.length > 200) return "La descripción puede tener hasta 200 letras.";
  if (!Number.isInteger(d.precio) || d.precio < 0 || d.precio > 1_000_000) {
    return "El precio debe ser un monto entero en pesos, entre $0 y $1.000.000.";
  }
  if (d.duracionDias === null) {
    if (d.precio > 0) return "Un plan de pago necesita una duración (entre 1 y 365 días).";
  } else if (!Number.isInteger(d.duracionDias) || d.duracionDias < 1 || d.duracionDias > 365) {
    return "La duración debe ser de 1 a 365 días.";
  }
  if (d.beneficios.length < 1) return "Agrega al menos un beneficio.";
  if (d.beneficios.length > 10) return "Puedes agregar hasta 10 beneficios.";
  if (d.beneficios.some((b) => b.length > 80)) return "Cada beneficio puede tener hasta 80 letras.";
  return null;
}

// ---------- acciones del administrador (todas dejan registro de auditoría) ----------

export function crearOferta(datos: DatosOferta, admin: string, ahora: Date = new Date()): Resultado {
  cargar();
  const d = limpiar(datos);
  const error = validar(d, estado.ofertas);
  if (error) return { ok: false, motivo: error };
  const iso = ahora.toISOString();
  const oferta: Oferta = {
    id: nuevoId(d.tipo === "plan" ? "p" : "c"),
    tipo: d.tipo, audiencia: d.audiencia, nombre: d.nombre,
    institucion: d.tipo === "convenio" ? d.institucion : undefined,
    descripcion: d.descripcion, precio: d.precio, duracionDias: d.duracionDias, beneficios: d.beneficios,
    activa: true, creadaEn: iso, actualizadaEn: iso,
  };
  guardar({ ...estado, ofertas: [...estado.ofertas, oferta] });
  const nombreTipo = ETIQUETA_TIPO_OFERTA[d.tipo];
  registrarAccion(
    {
      admin, accion: "oferta_creada", resumen: `${nombreTipo} creado · ${precioTexto(oferta)}`,
      recurso: oferta.nombre, motivo: `Alta en el catálogo para ${ETIQUETA_AUDIENCIA[d.audiencia].toLowerCase()}.`,
    },
    ahora
  );
  return { ok: true, aviso: `${nombreTipo} "${oferta.nombre}" creado. Ya aparece en el catálogo.` };
}

/** Describe qué cambió, para la auditoría. */
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
export function editarOferta(id: string, datos: DatosOferta, admin: string, ahora: Date = new Date()): Resultado {
  cargar();
  const antes = estado.ofertas.find((o) => o.id === id);
  if (!antes) return { ok: false, motivo: "No encontramos este plan o convenio." };
  const d = limpiar({ ...datos, tipo: antes.tipo, audiencia: antes.audiencia });
  const error = validar(d, estado.ofertas, id);
  if (error) return { ok: false, motivo: error };
  const lista = cambios(antes, d);
  if (lista.length === 0) return { ok: false, motivo: "No hay cambios para guardar." };

  const iso = ahora.toISOString();
  guardar({
    ...estado,
    // Las suscripciones no se modifican: conservan el precio pagado.
    ofertas: estado.ofertas.map((o) =>
      o.id === id
        ? {
            ...o, nombre: d.nombre, institucion: o.tipo === "convenio" ? d.institucion : undefined,
            descripcion: d.descripcion, precio: d.precio, duracionDias: d.duracionDias,
            beneficios: d.beneficios, actualizadaEn: iso,
          }
        : o
    ),
  });

  const vigentes = vigentesDe(estado.suscripciones, id, ahora.getTime()).length;
  const cambioPrecio = antes.precio !== d.precio;
  let aviso = `"${d.nombre}" actualizado.`;
  if (cambioPrecio && vigentes > 0) {
    aviso += ` El nuevo precio vale solo para nuevas contrataciones: ${vigentes} ${
      vigentes === 1 ? "suscripción vigente conserva" : "suscripciones vigentes conservan"
    } el precio que pagaron.`;
  }
  registrarAccion(
    {
      admin, accion: "oferta_editada", resumen: `${ETIQUETA_TIPO_OFERTA[antes.tipo]} editado`,
      recurso: d.nombre,
      motivo: lista.join("; ") + (cambioPrecio && vigentes > 0 ? `. ${vigentes} suscripciones vigentes no cambian de precio.` : "."),
    },
    ahora
  );
  return { ok: true, aviso };
}

/** Quita la oferta del catálogo. Las suscripciones vigentes siguen hasta su término. */
export function desactivarOferta(id: string, admin: string, motivo: string, ahora: Date = new Date()): Resultado {
  cargar();
  const o = estado.ofertas.find((x) => x.id === id);
  if (!o) return { ok: false, motivo: "No encontramos este plan o convenio." };
  if (o.base) return { ok: false, motivo: `"${o.nombre}" es el plan base: toda cuenta nueva parte ahí, no se puede desactivar.` };
  if (!o.activa) return { ok: false, motivo: "Ya está desactivado." };
  const limpio = motivo.trim();
  if (limpio.length < 5) return { ok: false, motivo: "Escribe el motivo de la desactivación (mínimo 5 letras)." };

  const iso = ahora.toISOString();
  guardar({
    ...estado,
    ofertas: estado.ofertas.map((x) =>
      x.id === id ? { ...x, activa: false, desactivadaEn: iso, motivoDesactivacion: limpio, actualizadaEn: iso } : x
    ),
  });

  const vigentes = vigentesDe(estado.suscripciones, id, ahora.getTime());
  const hasta = ultimoVencimiento(vigentes);
  const nota =
    vigentes.length === 0
      ? "No tenía suscripciones vigentes."
      : `${vigentes.length} ${vigentes.length === 1 ? "suscripción vigente sigue" : "suscripciones vigentes siguen"} activa${
          vigentes.length === 1 ? "" : "s"
        }${hasta ? ` hasta el ${fechaLarga(hasta)}` : ""}.`;
  registrarAccion(
    {
      admin, accion: "oferta_desactivada", resumen: `${ETIQUETA_TIPO_OFERTA[o.tipo]} quitado del catálogo`,
      recurso: o.nombre, motivo: `${limpio} ${nota}`,
    },
    ahora
  );
  return { ok: true, aviso: `"${o.nombre}" ya no aparece en el catálogo. ${nota}` };
}

export function reactivarOferta(id: string, admin: string, ahora: Date = new Date()): Resultado {
  cargar();
  const o = estado.ofertas.find((x) => x.id === id);
  if (!o) return { ok: false, motivo: "No encontramos este plan o convenio." };
  if (o.activa) return { ok: false, motivo: "Ya está activo." };
  const iso = ahora.toISOString();
  guardar({
    ...estado,
    ofertas: estado.ofertas.map((x) =>
      x.id === id ? { ...x, activa: true, desactivadaEn: undefined, motivoDesactivacion: undefined, actualizadaEn: iso } : x
    ),
  });
  registrarAccion(
    {
      admin, accion: "oferta_reactivada", resumen: `${ETIQUETA_TIPO_OFERTA[o.tipo]} vuelve al catálogo`,
      recurso: o.nombre, motivo: "Reactivado por el administrador.",
    },
    ahora
  );
  return { ok: true, aviso: `"${o.nombre}" vuelve a mostrarse en el catálogo.` };
}

/** Solo para pruebas y para reiniciar la demo. */
export function reiniciarPlanes() {
  guardar(SEMILLA);
}