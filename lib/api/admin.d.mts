export const LIMITES: {
  motivoMin: number; motivoMax: number; diasMin: number; diasMax: number;
  nombreMin: number; nombreMax: number; descripcionMax: number; institucionMin: number; institucionMax: number;
  precioMax: number; duracionMin: number; duracionMax: number; beneficiosMax: number; beneficioMin: number; beneficioMax: number;
  paginaMax: number;
};

export function motivoOpcional(valor: unknown): string | undefined;

export type AccionAuditoria =
  | "REPORT_REVIEWED" | "REPORT_DISCARDED" | "REPORT_ESCALATED" | "USER_SUSPENDED" | "USER_REACTIVATED"
  | "SANCTION_APPLIED" | "SANCTION_LIFTED" | "PLAN_CREATED" | "PLAN_UPDATED" | "PLAN_DEACTIVATED"
  | "MEMBERSHIP_UPDATED" | "PAYMENT_REFUNDED";
export type RecursoAuditoria = "user" | "report" | "plan" | "membership" | "payment" | "club" | "activity" | "message";
export const ETIQUETA_ACCION: Record<AccionAuditoria, string>;
export const ETIQUETA_RECURSO: Record<RecursoAuditoria, string>;
export const ETIQUETA_RESULTADO: Record<"success" | "failure", string>;
export function etiquetaAccion(accion: string): string;
export function etiquetaRecurso(tipo: string | null | undefined): string;

export function queryReportes(f?: { estado?: string; limit?: number; pagina?: number }): string;
export function querySanciones(f?: { estado?: string; usuarioId?: string; limit?: number; pagina?: number }): string;
export function queryPlanes(f?: { estado?: string; tipo?: string; categoria?: string; limit?: number; pagina?: number }): string;
export function queryAuditoria(f?: {
  desde?: string; hasta?: string; adminId?: string; accion?: string; recursoTipo?: string; resultado?: string;
  pagina?: number; porPagina?: number;
}): string;
export function fechaAIso(aaaammdd: string | undefined, fin?: boolean): string | undefined;

export const TRANSICIONES: Record<"pendiente" | "revisado" | "descartado" | "escalado", ("revisado" | "descartado" | "escalado")[]>;
export const ETIQUETA_ESTADO_REPORTE: Record<"pendiente" | "revisado" | "descartado" | "escalado", string>;
export function hayMasPaginas(recibidos: number, limite: number): boolean;
export function cuerpoRevision(estado: string, motivo?: string): { estado: string; motivo?: string };
export function nombreCorto(persona: { nombre?: string | null; apellido_inicial?: string | null } | null | undefined): string;

export const ETIQUETA_TIPO_SANCION: Record<"temporal" | "permanente", string>;
export function cuerpoSancion(datos: {
  usuarioId: string; tipo: string; dias?: number | string | null; motivo: string; reporteId?: string | null;
}): { usuario_id: string; tipo: "temporal" | "permanente"; motivo: string; dias?: number; reporte_id?: string };
export function cuerpoLevantamiento(motivo: string): { motivo: string };
export function textoSancion(s: { tipo: string; fin: string | null }): string;

export const ETIQUETA_CATEGORIA: Record<"PLAN" | "CONVENIO", string>;
export const ETIQUETA_TIPO_PLAN: Record<"USUARIO" | "CLUB", string>;
export function formatearCLP(monto: number): string;
export function textoPrecio(precio: number): string;
export function duracionTexto(dias: number): string;
export function separarBeneficios(texto: string): string[];

export type DatosPlan = {
  nombre: string; tipo: "USUARIO" | "CLUB"; categoria?: "PLAN" | "CONVENIO"; descripcion?: string | null; institucion?: string | null;
  precio: number; duracionDias: number | null; beneficios?: string[]; motivo?: string;
};
export function cuerpoPlanNuevo(datos: DatosPlan): Record<string, unknown>;
export function cuerpoPlanCambios(
  original: { nombre: string; descripcion: string | null; precio: number; duracion_dias: number | null; beneficios: string[]; categoria: string; institucion?: string | null },
  datos: DatosPlan,
): Record<string, unknown>;
export function cuerpoReactivacion(motivo?: string): { motivo?: string };
export function cuerpoDesactivacion(motivo?: string): { motivo?: string };
