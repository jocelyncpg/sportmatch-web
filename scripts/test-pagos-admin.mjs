// HU-57: consulta y exportación CSV del panel de pagos del administrador (lib/api/pagos-admin.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import {
  CABECERA_CSV, celdaCsv, csvPagos, LIMITE_EXPORTACION, MAX_FILAS_EXPORTACION, nombreArchivoCsv, queryPagosAdmin,
  todasLasPaginas,
} from "../lib/api/pagos-admin.mjs";

const pago = (n, cambios = {}) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, estado: "APPROVED", monto: 4990,
  fecha: "2026-03-10T15:00:00+00:00", fecha_transbank: null, buy_order: `SM-${n}`, codigo_autorizacion: "123456",
  card_last4: "6623", tipo_pago: "VN", cuotas: 0,
  plan: { id: 1, nombre: "Pro Mensual", categoria: "PLAN", tipo: "USUARIO" }, tipo_suscriptor: "USUARIO",
  suscriptor_id: "11111111-1111-4111-8111-111111111111", suscriptor_nombre: "Ana P.",
  periodo: { id: "p", fecha_inicio: "2026-03-10T15:00:00+00:00", fecha_fin: "2026-04-09T15:00:00+00:00", vigente: false, estado: "TERMINADO" },
  ...cambios,
});

test("la consulta solo lleva filtros válidos", () => {
  assert.equal(queryPagosAdmin(), "");
  assert.equal(queryPagosAdmin({ estado: "", categoria: "", tipo: "", desde: "", hasta: "", page: 1 }), "");
  assert.equal(
    queryPagosAdmin({ estado: "APPROVED", desde: "2026-03-01", hasta: "2026-03-31", categoria: "CONVENIO", tipo: "CLUB", page: 3, limit: 20 }),
    "?estado=APPROVED&desde=2026-03-01&hasta=2026-03-31&categoria=CONVENIO&tipo=CLUB&page=3&limit=20",
  );
  assert.equal(queryPagosAdmin({ estado: "X", desde: "01-03-2026", tipo: "ADMIN", categoria: "toString", page: -1 }), "");
});

test("una celda CSV escapa comillas, separadores, saltos de línea y fórmulas", () => {
  assert.equal(celdaCsv('Club "Los Andes", Ñuñoa'), '"Club ""Los Andes"", Ñuñoa"');
  assert.equal(celdaCsv("línea 1\nlínea 2"), '"línea 1\nlínea 2"');
  for (const peligroso of ["=HYPERLINK(\"x\")", "+56 9", "-1+1", "@SUM(A1)", "\tx", "\rx"]) {
    assert.ok(celdaCsv(peligroso).startsWith(`"'`), peligroso);
  }
  assert.equal(celdaCsv(4990), "4990");
  assert.equal(celdaCsv(null), '""');
  assert.equal(celdaCsv(undefined), '""');
});

test("el CSV tiene BOM, cabecera, CRLF y una fila por pago con sus datos", () => {
  const csv = csvPagos([pago(1), pago(2, { estado: "REJECTED", codigo_autorizacion: null, card_last4: null, periodo: null,
    suscriptor_nombre: null, tipo_suscriptor: "CLUB", plan: { id: 2, nombre: '=cmd|"/c calc"!A1', categoria: "CONVENIO", tipo: "CLUB" } })]);
  assert.ok(csv.startsWith("﻿"));
  const lineas = csv.slice(1).split("\r\n");
  assert.equal(lineas.length, 4); // cabecera, dos filas y el fin de línea final
  assert.equal(lineas[0].split(",").length, CABECERA_CSV.length);
  assert.match(lineas[1], /"Aprobado",4990,"Deportista","Ana P\.",.*"Pro Mensual","Plan","SM-1","123456","6623"/);
  assert.match(lineas[2], /"Rechazado",4990,"Club","",.*"'=cmd\|""\/c calc""!A1","Convenio","SM-2","","","",""$/);
});

test("la exportación recorre todas las páginas del filtro sin repetir filas", async () => {
  const todos = Array.from({ length: 450 }, (_, i) => pago(i));
  const pedidas = [];
  const { filas, total, truncado } = await todasLasPaginas(async (page, limit) => {
    pedidas.push([page, limit]);
    return { items: todos.slice((page - 1) * limit, page * limit), total: todos.length };
  });
  assert.deepEqual(pedidas, [[1, LIMITE_EXPORTACION], [2, LIMITE_EXPORTACION], [3, LIMITE_EXPORTACION]]);
  assert.equal(filas.length, 450);
  assert.equal(new Set(filas.map((f) => f.id)).size, 450);
  assert.equal(total, 450);
  assert.equal(truncado, false);
});

test("la exportación no repite un pago si entra uno nuevo entre páginas, y se detiene en el tope", async () => {
  let todos = Array.from({ length: 5 }, (_, i) => pago(i));
  const r = await todasLasPaginas(async (page, limit) => {
    const items = todos.slice((page - 1) * limit, page * limit);
    if (page === 1) todos = [pago(99), ...todos]; // llega un pago nuevo arriba
    return { items, total: todos.length };
  }, 2);
  assert.equal(new Set(r.filas.map((f) => f.id)).size, r.filas.length);
  const enorme = await todasLasPaginas(async (_page, limit) => ({
    items: Array.from({ length: limit }, (_, i) => pago(Math.random() * 1e9 + i)), total: MAX_FILAS_EXPORTACION * 3 }));
  assert.equal(enorme.filas.length, MAX_FILAS_EXPORTACION);
  assert.equal(enorme.truncado, true);
});

test("el nombre del archivo refleja el rango de fechas", () => {
  assert.equal(nombreArchivoCsv(), "pagos-sportmatch.csv");
  assert.equal(nombreArchivoCsv({ desde: "2026-03-01", hasta: "2026-03-31" }), "pagos-sportmatch-2026-03-01_2026-03-31.csv");
  assert.equal(nombreArchivoCsv({ desde: "../x" }), "pagos-sportmatch.csv");
});
