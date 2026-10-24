import test from "node:test";
import assert from "node:assert/strict";
import {
  cantidadIntentos,
  claveIntentos,
  errorBff,
  falloLogin,
  limpiarIntentos,
  limitado,
  limitarPorIP,
  mapearRol,
  mensajeBackend,
  mensajeLogin,
  opcionesCookie,
  rutaGateway,
  rutasPermitidas,
  validarCSRF,
  validarLoginBody,
} from "../lib/servidor/core.mjs";

test("lista blanca del gateway incluye solo rutas pactadas", () => {
  assert.equal(rutasPermitidas("clubs/me"), true);
  assert.equal(rutasPermitidas("clubs/announcements"), true);
  assert.equal(rutasPermitidas("payments/plans"), true);
  assert.equal(rutasPermitidas("payments/subscription/me"), true);
  for (const route of ["users/me", "payments/webpay/initiate", "clubs/../users", "clubs//me", "clubs\\me"]) assert.equal(rutasPermitidas(route), false);
});
test("mapea roles permitidos y bloquea deportistas", () => {
  assert.equal(mapearRol("club_admin"), "club"); assert.equal(mapearRol("admin"), "admin"); assert.equal(mapearRol("player"), null);
});
test("la cookie de sesión es httpOnly, same-site y solo de la raíz", () => {
  assert.deepEqual(opcionesCookie(true, 3600), { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 3600 });
});
test("valida los campos de login antes de enviar", () => {
  assert.equal(validarLoginBody({ email: "a@b.cl", password: "x" }), true);
  assert.equal(validarLoginBody({ email: "invalido", password: "x" }), false);
  assert.equal(validarLoginBody({ email: "a@b.cl", password: "x".repeat(129) }), false);
});
test("CSRF requiere origen exacto o marcador de la web", () => {
  const req = (headers) => new Request("https://web.test/api/gw/clubs", { method: "POST", headers });
  assert.equal(validarCSRF(req({ origin: "https://web.test" })), true);
  assert.equal(validarCSRF(req({ origin: "https://evil.test" })), false);
  assert.equal(validarCSRF(req({ "x-requested-with": "sportmatch-web" })), true);
  assert.equal(validarCSRF(req({})), false);
});
test("aplica cinco intentos fallidos por ventana de 15 minutos", () => {
  const key = `test-${Date.now()}`;
  assert.equal(limitado(key, 1_000), false);
  for (let i = 0; i < 5; i++) falloLogin(key, 1_001 + i);
  assert.equal(limitado(key, 1_010), true);
  assert.equal(limitado(key, 901_002), false);
  limpiarIntentos(key);
});

test("usa el detalle breve del backend en errores 4xx y conserva el genérico para 5xx", () => {
  assert.equal(mensajeBackend(409, { detail: "El chat de esta actividad ya se cerró." }, "genérico"), "El chat de esta actividad ya se cerró.");
  assert.equal(mensajeBackend(403, { detail: "Verifica tu correo para iniciar sesión." }, "genérico"), "Verifica tu correo para iniciar sesión.");
  assert.equal(mensajeBackend(422, { detail: [{ msg: "inválido" }] }, "genérico"), "genérico");
  assert.equal(mensajeBackend(400, { detail: "x".repeat(301) }, "genérico"), "genérico");
  assert.equal(mensajeBackend(503, { detail: "dato interno" }, "genérico"), "genérico");
});

test("el login aplica sus mensajes específicos de estado", () => {
  assert.equal(mensajeLogin(401, { detail: "mensaje backend" }), "Correo o contraseña incorrectos");
  assert.equal(mensajeLogin(403, { detail: "Correo no verificado." }), "Correo no verificado.");
  assert.equal(mensajeLogin(423, { detail: "Cuenta bloqueada." }), "Cuenta bloqueada.");
  assert.equal(mensajeLogin(400, { detail: "Solicitud inválida." }), "Solicitud inválida.");
  assert.equal(mensajeLogin(400, { detail: [{ msg: "inválido" }] }), "No se pudo iniciar sesión.");
  assert.equal(mensajeLogin(500, { detail: "interno" }), "No se pudo iniciar sesión.");
});

test("apiGw prioriza el error que entrega el BFF", () => {
  assert.equal(errorBff({ error: "El chat de esta actividad ya se cerró." }, "genérico"), "El chat de esta actividad ya se cerró.");
  assert.equal(errorBff({ error: "x".repeat(301) }, "genérico"), "genérico");
});

test("codifica cada segmento de destino tras validar la ruta decodificada", () => {
  assert.equal(rutaGateway(["clubs", "dato?#%2F"]), "clubs/dato%3F%23%252F");
  assert.equal(rutaGateway(["payments", "plans"]), "payments/plans");
  assert.equal(rutaGateway(["users", "me"]), null);
});

test("solo usa x-forwarded-for cuando TRUST_PROXY está activado", () => {
  const request = new Request("https://web.test/api/sesion", {
    headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.2" },
  });
  assert.equal(limitarPorIP(request, "club@example.cl", false), "club@example.cl");
  assert.equal(limitarPorIP(request, "club@example.cl", true), "203.0.113.1:club@example.cl");
  assert.equal(claveIntentos("club@example.cl", "", true), "club@example.cl");
});

test("poda intentos vencidos al superar cinco mil claves", () => {
  for (let index = 0; index < 5001; index++) falloLogin(`prueba-poda-${index}`, 0);
  limitado("prueba-poda-activador", 900001);
  assert.equal(cantidadIntentos(), 1);
});
