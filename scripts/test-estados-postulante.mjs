// Defecto 5 de la verificación de HU-67: la web enviaba EN_ESPERA (que ms-club rechaza con 400) y bloqueaba
// «Pendiente» en el cliente aunque el backend sí lo permite. Estados que existen en ms-club:
// PENDIENTE, PRESELECCIONADO, ACEPTADO, RECHAZADO.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { estadoParaBackend } from "../lib/datos-mapeo.mjs";

const BACKEND = ["PENDIENTE", "PRESELECCIONADO", "ACEPTADO", "RECHAZADO"];
const ESTADOS_DE_LA_WEB = ["Pendiente", "Preseleccionado", "En espera", "Aceptado", "Rechazado"];

test("todo estado de la web se envía como un estado que existe en ms-club", () => {
  for (const estado of ESTADOS_DE_LA_WEB) assert.ok(BACKEND.includes(estadoParaBackend(estado)), estado);
});

test("«En espera» y «Pendiente» se envían como PENDIENTE; los demás, uno a uno", () => {
  assert.equal(estadoParaBackend("En espera"), "PENDIENTE");
  assert.equal(estadoParaBackend("Pendiente"), "PENDIENTE");
  assert.equal(estadoParaBackend("Preseleccionado"), "PRESELECCIONADO");
  assert.equal(estadoParaBackend("Aceptado"), "ACEPTADO");
  assert.equal(estadoParaBackend("Rechazado"), "RECHAZADO");
});

test("un estado desconocido no se envía", () => {
  assert.throws(() => estadoParaBackend("EN_ESPERA"), /estado/i);
  assert.throws(() => estadoParaBackend(""), /estado/i);
});

test("el código ya no envía EN_ESPERA ni bloquea «Pendiente» en el cliente", () => {
  const datos = readFileSync(new URL("../lib/datos.ts", import.meta.url), "utf8");
  const postulantes = readFileSync(new URL("../lib/api/postulantes.ts", import.meta.url), "utf8");
  assert.ok(!datos.includes("EN_ESPERA"));
  assert.ok(!datos.includes("El backend no permite volver una postulación a pendiente"));
  assert.ok(!postulantes.includes("EN_ESPERA"));
  const permitidos = postulantes.match(/\[("[A-Z_]+",?\s*)+\]\.includes\(estado\)/)?.[0] ?? "";
  for (const estado of BACKEND) assert.ok(permitidos.includes(`"${estado}"`), estado);
});
