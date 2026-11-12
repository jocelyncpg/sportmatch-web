/** A delayed return may only clear the attempt that it belongs to. */
export function limpiarPagoPendiente(storage, token) {
  const raw = storage.getItem("sportmatch_pago_pendiente");
  if (!raw) return;
  const saved = JSON.parse(raw);
  if ((saved.token_ws || saved.tbk_token) !== token) return;
  storage.removeItem("sportmatch_pago_pendiente");
  storage.removeItem("sportmatch_pago_checkout");
}

export async function recuperarPagoPendiente(storage, cancelar) {
  const raw = storage.getItem("sportmatch_pago_pendiente");
  if (!raw) return null;
  const saved = JSON.parse(raw);
  const token = saved.token_ws || saved.tbk_token;
  if (!token) throw new Error("Revisa el resultado del intento anterior antes de volver a pagar.");
  const result = await cancelar({ token_ws: token });
  if (!["APPROVED", "REJECTED", "CANCELLED"].includes(result.status)) {
    throw new Error("El pago aún se está verificando. Consulta el resultado antes de iniciar otro.");
  }
  limpiarPagoPendiente(storage, token);
  return result;
}
