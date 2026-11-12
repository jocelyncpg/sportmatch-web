export type EstadoPago = "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
export type CategoriaPago = "PLAN" | "CONVENIO";
export type TipoSuscriptor = "USUARIO" | "CLUB";

export type FiltroPagos = {
  estado?: EstadoPago | "";
  /** AAAA-MM-DD, día de Chile, incluido. */
  desde?: string;
  /** AAAA-MM-DD, día de Chile, incluido. */
  hasta?: string;
  categoria?: CategoriaPago | "";
  tipo?: TipoSuscriptor | "";
  page?: number;
  limit?: number;
};

export type PagoAdmin = {
  id: string;
  estado: EstadoPago;
  /** Pesos chilenos enteros. */
  monto: number;
  /** Cuándo se inició el pago (ISO). */
  fecha: string;
  fecha_transbank: string | null;
  buy_order: string;
  codigo_autorizacion: string | null;
  card_last4: string | null;
  tipo_pago: string | null;
  cuotas: number | null;
  /** El plan como se pagó: el nombre es el de ese momento. */
  plan: { id: number; nombre: string; categoria: CategoriaPago; tipo: TipoSuscriptor };
  tipo_suscriptor: TipoSuscriptor;
  suscriptor_id: string;
  /** null si Ms_Users o Ms-club no respondieron. */
  suscriptor_nombre: string | null;
  /** El período que compró (solo pagos aprobados). */
  periodo: {
    id: string; fecha_inicio: string; fecha_fin: string; vigente: boolean;
    /** PROGRAMADO: una renovación pagada por adelantado, empieza cuando termina el período actual. */
    estado: "VIGENTE" | "PROGRAMADO" | "TERMINADO";
  } | null;
};

export type PaginaPagosAdmin = { items: PagoAdmin[]; page: number; limit: number; total: number };

export const LIMITE_EXPORTACION: number;
export const MAX_FILAS_EXPORTACION: number;
export const ETIQUETA_ESTADO_PAGO: Record<EstadoPago, string>;
export const ETIQUETA_CATEGORIA: Record<CategoriaPago, string>;
export const ETIQUETA_TIPO: Record<TipoSuscriptor, string>;
export const CABECERA_CSV: string[];

export function queryPagosAdmin(f?: FiltroPagos): string;
export function todasLasPaginas<T extends { id: string }>(
  listar: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  limite?: number,
  maximo?: number,
): Promise<{ filas: T[]; total: number; truncado: boolean }>;
export function celdaCsv(valor: unknown): string;
export function csvPagos(filas: PagoAdmin[]): string;
export function nombreArchivoCsv(f?: FiltroPagos): string;
