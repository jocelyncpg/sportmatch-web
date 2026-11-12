import type { Comprobante } from "./pagos";
export function limpiarPagoPendiente(storage: Storage, token: string): void;
export function recuperarPagoPendiente(storage: Storage, cancelar: (body: { token_ws: string }) => Promise<Comprobante>): Promise<Comprobante | null>;
