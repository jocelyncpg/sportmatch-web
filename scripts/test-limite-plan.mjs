import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { limitePlanBff } from "../lib/servidor/core.mjs";

// HU-54: el 402 LIMITE_PLAN de Ms-club cruza el BFF con sus datos para que el panel ofrezca un plan.

const LIMITE = { codigo: "LIMITE_PLAN", recurso: "comunicados", limite: 4, usado: 4,
  se_libera_en: "2026-11-09T15:30:00Z", detail: "Te quedan 0 de 4 comunicados cada 24 h en el plan gratuito." };

test("el BFF deja pasar solo los campos del límite del plan", () => {
  assert.deepEqual(limitePlanBff(402, { ...LIMITE, token: "secreto", extra: { a: 1 } }), {
    codigo: "LIMITE_PLAN", recurso: "comunicados", limite: 4, usado: 4, se_libera_en: "2026-11-09T15:30:00Z",
  });
  assert.equal(limitePlanBff(402, { ...LIMITE, se_libera_en: null }).se_libera_en, null);
  assert.equal(limitePlanBff(402, { ...LIMITE, se_libera_en: "no es fecha" }).se_libera_en, null);
  assert.equal(limitePlanBff(402, { ...LIMITE, recurso: "<script>" }).recurso, "");
});

test("otros errores no se tratan como límite del plan", () => {
  assert.equal(limitePlanBff(409, LIMITE), null);
  assert.equal(limitePlanBff(402, { detail: "Pago requerido" }), null);
  assert.equal(limitePlanBff(402, { ...LIMITE, limite: "4" }), null);
  assert.equal(limitePlanBff(402, null), null);
});

test("el proxy, el cliente y el panel usan el aviso con enlace a Mi suscripción", () => {
  const ruta = readFileSync(new URL("../app/api/gw/[...ruta]/route.ts", import.meta.url), "utf8");
  assert.match(ruta, /limitePlanBff\(upstream\.status, payload\)/);
  const cliente = readFileSync(new URL("../lib/api/cliente.ts", import.meta.url), "utf8");
  assert.match(cliente, /avisarLimitePlan\(limite\)/);
  const limite = readFileSync(new URL("../lib/limitePlan.ts", import.meta.url), "utf8");
  assert.match(limite, /Te quedan 0 de \$\{limite\.limite\}/);
  assert.match(limite, /RUTA_PLANES_CLUB = "\/suscripcion"/);
  const layout = readFileSync(new URL("../app/(panel)/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /<AvisoLimitePlan \/>/);
});

test("Mi suscripción muestra el uso del plan del club", () => {
  const pagina = readFileSync(new URL("../app/(panel)/suscripcion/page.tsx", import.meta.url), "utf8");
  assert.match(pagina, /usoPlanClub\(\)/);
  assert.match(pagina, /textoUsoPlan\(item\)/);
  const pagos = readFileSync(new URL("../lib/api/pagos.ts", import.meta.url), "utf8");
  assert.match(pagos, /"clubs\/plan-usage\/me"/);
  const limite = readFileSync(new URL("../lib/limitePlan.ts", import.meta.url), "utf8");
  assert.match(limite, /Te quedan \$\{Math\.max\(uso\.limite - uso\.usado, 0\)\} de \$\{uso\.limite\}/);
});
