// HU-54: cuando una acción del club choca con un límite del plan gratuito (HTTP 402 LIMITE_PLAN), el panel muestra
// "Te quedan 0 de N … · Contrata un plan" con un enlace a Mi suscripción. Las acciones del panel sincronizan con el
// backend en segundo plano, así que el aviso se publica aquí y lo muestra AvisoLimitePlan (en el layout del panel).

export interface LimitePlan {
  recurso: string;
  limite: number;
  usado: number;
  /** Cuándo se libera un cupo (ventana móvil de 24 h); null si se libera al cerrar algo (convocatorias abiertas). */
  se_libera_en: string | null;
}

export const RUTA_PLANES_CLUB = "/suscripcion";

const RECURSOS: Record<string, string> = {
  convocatorias_abiertas: "convocatorias abiertas a la vez",
  comunicados: "comunicados hoy",
  canales: "canales",
  postulaciones_convocatorias: "postulaciones a convocatorias hoy",
};

export function leerLimitePlan(payload: unknown): LimitePlan | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.codigo !== "LIMITE_PLAN" || typeof p.limite !== "number") return null;
  return {
    recurso: typeof p.recurso === "string" ? p.recurso : "",
    limite: p.limite,
    usado: typeof p.usado === "number" ? p.usado : p.limite,
    se_libera_en: typeof p.se_libera_en === "string" ? p.se_libera_en : null,
  };
}

/** "Te quedan 0 de 4 comunicados hoy · Contrata un plan". */
export function mensajeLimitePlan(limite: LimitePlan): string {
  return `Te quedan 0 de ${limite.limite} ${RECURSOS[limite.recurso] ?? "usos"} · Contrata un plan`;
}

/** "Se libera un cupo el 9/11 a las 14:05." o null. */
export function textoSeLibera(limite: LimitePlan): string | null {
  if (!limite.se_libera_en) return null;
  const fecha = new Date(limite.se_libera_en);
  if (Number.isNaN(fecha.getTime())) return null;
  const hora = fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  return `Se libera un cupo el ${fecha.getDate()}/${fecha.getMonth() + 1} a las ${hora}.`;
}

/** Uso actual de un recurso (GET clubs/plan-usage/me). limite null = sin límite (o no se sabe). */
export interface UsoRecurso {
  recurso: string;
  limite: number | null;
  usado: number | null;
  ventana_horas: number | null;
  se_libera_en: string | null;
}
export interface UsoPlan { plan: "GRATIS" | "PRO" | null; items: UsoRecurso[] }

/** "Te quedan 3 de 4 comunicados hoy", "Canales: sin límite con tu plan" o null si no se sabe. */
export function textoUsoPlan(uso: UsoRecurso): string | null {
  const que = RECURSOS[uso.recurso] ?? "usos";
  if (uso.usado === null) return null;
  if (uso.limite === null) return `${que.charAt(0).toUpperCase()}${que.slice(1)}: sin límite con tu plan`;
  return `Te quedan ${Math.max(uso.limite - uso.usado, 0)} de ${uso.limite} ${que}`;
}

type Oyente = (limite: LimitePlan | null) => void;
const oyentes = new Set<Oyente>();
let actual: LimitePlan | null = null;

export function avisarLimitePlan(limite: LimitePlan | null): void {
  actual = limite;
  oyentes.forEach((oyente) => oyente(limite));
}

export function limitePlanActual(): LimitePlan | null {
  return actual;
}

export function alLlegarAlLimite(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => { oyentes.delete(oyente); };
}
