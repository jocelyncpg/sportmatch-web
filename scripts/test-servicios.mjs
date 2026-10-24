import test from "node:test";
import assert from "node:assert/strict";
import { queryString, validarTexto } from "../lib/api/validaciones.mjs";

test("validación de campos de servicios respeta mínimos y máximos", () => {
  assert.equal(validarTexto("  Selección  ", "Nombre", 2, 20), "Selección");
  assert.throws(() => validarTexto(" x ", "El título", 3, 20), /al menos 3 caracteres/);
  assert.throws(() => validarTexto("a".repeat(21), "El título", 3, 20), /no puede superar 20 caracteres/);
  assert.equal(validarTexto(" ", "Descripción", 1, 10, true), "");
});
test("serializa filtros de página sin enviar valores indefinidos", () => {
  assert.equal(queryString({ page: 2, page_size: 20, estado: undefined, deporte: "Fútbol" }), "?page=2&page_size=20&deporte=F%C3%BAtbol");
  assert.equal(queryString({}), "");
});
test("tipos compartidos de la API solo muestran campos contractuales", () => {
  const club = { id: "id", nombre: "Club", deportes: [{ id: 1, nombre: "Fútbol", descripcion: null }] };
  const applicant = { usuario_id: "u", estado: "PENDIENTE", perfil_deportivo: { nombre: "Ana", apellido_inicial: "P", edad: null, foto_perfil: null, biografia: null, deportes: [] } };
  assert.deepEqual(Object.keys(club), ["id", "nombre", "deportes"]);
  assert.equal("rating" in applicant.perfil_deportivo, false);
});
