import test from 'node:test';
import assert from 'node:assert/strict';
import { limpiarPagoPendiente, recuperarPagoPendiente } from '../lib/api/pago-pendiente.mjs';
import { decidirAcceso, rutasPermitidas } from '../lib/servidor/core.mjs';

function storage() {
  const data = new Map([['sportmatch_pago_pendiente', JSON.stringify({ token_ws: 'anterior' })], ['sportmatch_pago_checkout', 'enlace-antiguo']]);
  return { getItem: (key) => data.get(key) ?? null, removeItem: (key) => data.delete(key), setItem: (key, value) => data.set(key, value) };
}

test('cerrar el intento consulta el backend y quita el enlace antiguo solo después del resultado', async () => {
  for (const status of ['CANCELLED', 'REJECTED', 'APPROVED']) {
    const state = storage();
    const result = await recuperarPagoPendiente(state, async (body) => {
      assert.deepEqual(body, { token_ws: 'anterior' });
      assert.ok(state.getItem('sportmatch_pago_checkout'));
      return { status };
    });
    assert.equal(result.status, status);
    assert.equal(state.getItem('sportmatch_pago_pendiente'), null);
    assert.equal(state.getItem('sportmatch_pago_checkout'), null);
  }
});

test('los errores de conexión y los estados no definitivos conservan el intento', async () => {
  const state = storage();
  await assert.rejects(recuperarPagoPendiente(state, async () => { throw new Error('Sin conexión'); }));
  await assert.rejects(recuperarPagoPendiente(state, async () => ({ status: 'PENDING' })));
  assert.ok(state.getItem('sportmatch_pago_pendiente'));
});

test('un resultado tardío no elimina el intento nuevo ni su enlace', () => {
  const state = storage();
  limpiarPagoPendiente(state, 'otro-token');
  assert.ok(state.getItem('sportmatch_pago_pendiente'));
  assert.equal(state.getItem('sportmatch_pago_checkout'), 'enlace-antiguo');
});

test('cancelar requiere sesión, POST y una ruta exacta del BFF', () => {
  assert.equal(rutasPermitidas('payments/webpay/cancel'), true);
  assert.deepEqual(decidirAcceso('payments/webpay/cancel', 'POST', 'club'), { permitido: true, status: 200 });
  assert.deepEqual(decidirAcceso('payments/webpay/cancel', 'POST', null), { permitido: false, status: 401 });
  for (const method of ['GET', 'PATCH', 'DELETE']) assert.equal(decidirAcceso('payments/webpay/cancel', method, 'club').status, 405);
  assert.equal(rutasPermitidas('payments/webpay/cancel/extra'), false);
});
