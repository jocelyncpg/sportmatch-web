import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decidirAcceso,
  metodosAdmin,
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
  assert.equal(rutasPermitidas("users/reports"), true);
  assert.equal(rutasPermitidas("payments/webpay/initiate"), true);
  assert.equal(rutasPermitidas("payments/webpay/commit"), true);
  for (const route of ["users/me", "users/reports/abc", "users/admin/reports", "users/reportsx", "payments/webpay/mock", "payments/webpay/commit/extra", "payments/plans/extra", "clubs/../users", "clubs//me", "clubs\\me"]) assert.equal(rutasPermitidas(route), false);
});

test("historial y comprobantes admiten solo GET, sesión y rutas exactas", () => {
  const id = "11111111-2222-3333-4444-555555555555";
  for (const path of ["payments/history/me", "payments/subscriptions/me/history", `payments/history/${id}/receipt`]) {
    assert.equal(rutasPermitidas(path), true);
    assert.deepEqual(decidirAcceso(path, "GET", "club"), { permitido: true, status: 200 });
    assert.deepEqual(decidirAcceso(path, "GET", null), { permitido: false, status: 401 });
    for (const method of ["POST", "PATCH", "DELETE"]) {
      assert.deepEqual(decidirAcceso(path, method, "club"), { permitido: false, status: 405 });
    }
  }
  for (const path of ["payments/history", "payments/history/otro/receipt", `payments/history/${id}/receipt/extra`,
    "payments/subscriptions/otro/history", "payments/history/../me"]) assert.equal(rutasPermitidas(path), false);
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
  assert.equal(validarCSRF(req({ origin: "null" })), false);
  assert.equal(validarCSRF(req({ origin: "%%%" })), false);
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

// -- Rutas de administración (HU-45, 47, 48 y 56) -----------------------------------------------------------------

const ID = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";
const RUTAS_ADMIN = [
  ["GET", "users/admin/reports"], ["PATCH", `users/admin/reports/${ID}`],
  ["GET", "users/admin/sanctions"], ["POST", "users/admin/sanctions"], ["GET", `users/admin/sanctions/${ID}`], ["POST", `users/admin/sanctions/${ID}/lift`],
  ["GET", "users/admin/audit-events"],
  ["GET", "payments/admin/plans"], ["POST", "payments/admin/plans"], ["PATCH", "payments/admin/plans/7"], ["POST", "payments/admin/plans/7/deactivate"],
  ["POST", "payments/admin/plans/7/reactivate"], ["GET", "payments/admin/plans/7/subscriptions"],
];

test("un administrador pasa por todas las rutas de administración con su método", () => {
  for (const [metodo, ruta] of RUTAS_ADMIN) {
    assert.deepEqual(decidirAcceso(ruta, metodo, "admin"), { permitido: true, status: 200 }, `${metodo} ${ruta}`);
    assert.ok(rutaGateway(ruta.split("/")), ruta);       // y el BFF las acepta como destino del gateway
  }
});

test("un club no pasa a las rutas de administración: 403 sin llegar al gateway", () => {
  for (const [metodo, ruta] of RUTAS_ADMIN) {
    assert.deepEqual(decidirAcceso(ruta, metodo, "club"), { permitido: false, status: 403 }, `${metodo} ${ruta}`);
  }
});

test("sin sesión (o con un rol desconocido) tampoco pasa: 401 o 403", () => {
  for (const [metodo, ruta] of RUTAS_ADMIN) {
    for (const rol of [null, undefined, ""]) assert.deepEqual(decidirAcceso(ruta, metodo, rol), { permitido: false, status: 401 }, `${metodo} ${ruta}`);
    for (const rol of ["player", "ADMIN", "administrador", "club_admin"]) {
      assert.equal(decidirAcceso(ruta, metodo, rol).permitido, false, `${rol} ${ruta}`);
    }
  }
});

test("en las rutas de administración solo valen los métodos que el panel necesita (405 aunque sea admin)", () => {
  for (const [metodo, ruta] of [["DELETE", "payments/admin/plans/7"], ["PUT", "payments/admin/plans/7"], ["DELETE", "payments/admin/plans"],
    ["POST", "users/admin/audit-events"], ["PATCH", "users/admin/audit-events"], ["DELETE", `users/admin/sanctions/${ID}`],
    ["POST", `users/admin/reports/${ID}`], ["GET", "payments/admin/plans/7/deactivate"], ["PUT", "users/admin/sanctions"],
    ["GET", "payments/admin/plans/7/reactivate"], ["DELETE", "payments/admin/plans/7/reactivate"], ["POST", "payments/admin/plans/7/subscriptions"],
    ["PUT", "payments/admin/plans/7/subscriptions"], ["DELETE", "payments/admin/plans/7/subscriptions"]]) {
    assert.deepEqual(decidirAcceso(ruta, metodo, "admin"), { permitido: false, status: 405 }, `${metodo} ${ruta}`);
  }
  assert.deepEqual(metodosAdmin("payments/admin/plans/7/deactivate"), ["POST"]);
  assert.deepEqual(metodosAdmin("payments/admin/plans/7/reactivate"), ["POST"]);
  assert.deepEqual(metodosAdmin("payments/admin/plans/7/subscriptions"), ["GET"]);
  assert.equal(metodosAdmin("payments/plans"), null);
});

test("no se abre nada fuera de lo pactado: ids mal formados, rutas vecinas y recorridos de carpeta", () => {
  for (const ruta of ["users/admin", "users/admin/", "users/admin/users", "users/admin/reports/no-es-uuid", `users/admin/reports/${ID}/otra`,
    "users/admin/sanctions/1", `users/admin/sanctions/${ID}/delete`, "users/admin/audit-events/1", "users/internal/x",
    "payments/admin", "payments/admin/plans/abc", "payments/admin/plans/-1", "payments/admin/plans/1234567890", "payments/admin/plans/7/otra", "payments/admin/plans/abc/reactivate", "payments/admin/plans/abc/subscriptions",
    "payments/admin/plans/7/reactivate/otra", "payments/admin/plans/7/subscriptions/x", "payments/admin/plans/../7/reactivate",
    "payments/admin/plans/../plans", "users/admin/../me", "users//admin/reports", "payments/admin\plans", "internal/v1/accounts/x/status",
    "users/admin/reportsx", "xusers/admin/reports"]) {
    for (const rol of ["admin", "club", null]) assert.equal(decidirAcceso(ruta, "GET", rol).permitido, false, `${rol} ${ruta}`);
    assert.equal(rutaGateway(ruta.split("/")), null, ruta);
  }
});

test("las rutas públicas y las del club siguen igual para cualquier sesión (y la lista blanca de club no cambió)", () => {
  for (const [metodo, ruta] of [["GET", "clubs/me"], ["POST", "clubs/announcements"], ["GET", "payments/plans"], ["GET", "payments/subscription/me"],
    ["POST", "payments/webpay/initiate"], ["POST", "payments/webpay/commit"], ["POST", "users/reports"]]) {
    for (const rol of ["club", "admin", null]) assert.deepEqual(decidirAcceso(ruta, metodo, rol), { permitido: true, status: 200 }, `${rol} ${metodo} ${ruta}`);
  }
  for (const ruta of ["users/me", "users/reports/abc", "payments/webpay/mock", "payments/admin/plans/extra/otra"]) {
    assert.deepEqual(decidirAcceso(ruta, "GET", "admin"), { permitido: false, status: 404 }, ruta);
  }
  assert.equal(rutasPermitidas("users/admin/reports"), false);      // la lista de club/pública sigue sin abrirlas
  assert.equal(rutasPermitidas("payments/admin/plans"), false);
});

test("el manejador de /api/gw decide el acceso con el rol de la cookie firmada del servidor, antes de llamar al gateway", () => {
  const fuente = readFileSync(new URL("../app/api/gw/[...ruta]/route.ts", import.meta.url), "utf8");
  assert.match(fuente, /leerUsuarioFirmado\(jar\.get\(COOKIE_USER\)/);
  assert.match(fuente, /decidirAcceso\(ruta\.join\("\/"\), method, rol\)/);
  assert.ok(fuente.indexOf("decidirAcceso(") < fuente.indexOf("await fetch("), "la decisión va antes de llamar al gateway");
  assert.doesNotMatch(fuente, /request\.headers\.get\(["']x-(rol|role)/i);   // el rol nunca viene de una cabecera del navegador
});

// HU-61: la foto de perfil de un postulante se pide a través del BFF, solo con GET y solo con una clave válida.
import { fotoWeb } from "../lib/datos-mapeo.mjs";

test("la foto de perfil pasa por el BFF solo para claves generadas por Ms_Users", () => {
  const clave = "0123456789abcdef0123456789abcdef";
  assert.equal(rutasPermitidas(`users/photos/${clave}.jpg`), true);
  assert.equal(rutasPermitidas(`users/photos/${clave}.png`), true);
  for (const mala of [`users/photos/${clave}.html`, "users/photos/../admin/audit-events", "users/photos/x.jpg", "users/photos", "users/photos/"]) {
    assert.equal(rutasPermitidas(mala), false, mala);
  }
  assert.equal(decidirAcceso(`users/photos/${clave}.jpg`, "GET", "club").permitido, true);
  assert.equal(rutaGateway(["users", "photos", `${clave}.jpg`]), `users/photos/${clave}.jpg`);
});

test("fotoWeb convierte la ruta del servidor en una ruta del propio sitio y descarta lo demás", () => {
  const clave = "0123456789abcdef0123456789abcdef.jpg";
  assert.equal(fotoWeb(`/api/v1/users/photos/${clave}`), `/api/gw/users/photos/${clave}`);
  for (const valor of [null, undefined, "", "file:///x.jpg", "http://evil.example/a.png", "/api/v1/users/photos/../../x.jpg", "javascript:alert(1)"]) {
    assert.equal(fotoWeb(valor), "", String(valor));
  }
});

// HU-68: editar una convocatoria (PATCH) pasa por el BFF con cualquier sesión de club, como publicar o cerrar.
test("el BFF deja pasar la edición de una convocatoria y no abre rutas vecinas", () => {
  const club = "10000000-0000-4000-8000-000000000002";
  const call = "10000000-0000-4000-8000-000000000003";
  assert.equal(rutasPermitidas(`clubs/${club}/announcements/${call}`), true);
  assert.equal(decidirAcceso(`clubs/${club}/announcements/${call}`, "PATCH", "club").permitido, true);
  assert.equal(rutaGateway(["clubs", club, "announcements", call]), `clubs/${club}/announcements/${call}`);
  assert.equal(rutasPermitidas(`clubs/${club}/announcements/../${call}`), false);
});

// HU-57: pagos de la plataforma para el administrador. Solo GET y solo con sesión de administrador.
test("pagos del administrador: solo admin, solo GET y sin rutas vecinas", () => {
  const ruta = "payments/admin/transactions";
  assert.deepEqual(decidirAcceso(ruta, "GET", "admin"), { permitido: true, status: 200 });
  assert.equal(rutaGateway(ruta.split("/")), ruta);
  assert.deepEqual(metodosAdmin(ruta), ["GET"]);
  assert.deepEqual(decidirAcceso(ruta, "GET", "club"), { permitido: false, status: 403 });
  for (const rol of [null, undefined, ""]) assert.deepEqual(decidirAcceso(ruta, "GET", rol), { permitido: false, status: 401 });
  for (const rol of ["player", "ADMIN", "club_admin"]) assert.equal(decidirAcceso(ruta, "GET", rol).permitido, false, rol);
  // No se puede modificar un pago: cualquier otro método es 405 aunque sea admin.
  for (const metodo of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.deepEqual(decidirAcceso(ruta, metodo, "admin"), { permitido: false, status: 405 }, metodo);
  }
  for (const vecina of [`${ruta}/${ID}`, `${ruta}/${ID}/refund`, `${ruta}x`, "payments/admin/transaction",
    "payments/admin/transactions/../plans", "payments/transactions", "payments/admin//transactions"]) {
    for (const rol of ["admin", "club", null]) assert.equal(decidirAcceso(vecina, "GET", rol).permitido, false, `${rol} ${vecina}`);
    assert.equal(rutaGateway(vecina.split("/")), null, vecina);
  }
  assert.equal(rutasPermitidas(ruta), false); // no entra a la lista de club/pública
});

test("el panel de pagos está en la navegación del administrador y no del club", () => {
  const layout = readFileSync(new URL("../app/(panel)/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /\{ href: "\/pagos", [^}]*roles: \["admin"\] \}/);
  const pagina = readFileSync(new URL("../app/(panel)/pagos/page.tsx", import.meta.url), "utf8");
  assert.match(pagina, /<SoloRol roles=\{\["admin"\]\}>/);
  const cliente = readFileSync(new URL("../lib/api/pagosAdmin.ts", import.meta.url), "utf8");
  assert.doesNotMatch(cliente, /method:\s*"(POST|PUT|PATCH|DELETE)"/); // solo lectura
});

// HU-67: a quien ya fue aceptado no se le ofrece "Preseleccionar"; las demás decisiones quedan como estaban.
import { decisionDisponible } from "../lib/datos-mapeo.mjs";

test("el botón de preselección no se ofrece a un postulante aceptado y el resto de las decisiones no cambia", () => {
  const estados = ["Pendiente", "Preseleccionado", "En espera", "Aceptado", "Rechazado"];
  const ofrecidas = (actual) => estados.filter((nuevo) => decisionDisponible(actual, nuevo));
  assert.equal(decisionDisponible("Aceptado", "Preseleccionado"), false);
  assert.deepEqual(ofrecidas("Aceptado"), ["Pendiente", "En espera", "Rechazado"]);
  for (const actual of ["Pendiente", "En espera", "Rechazado", "Preseleccionado"]) {
    assert.deepEqual(ofrecidas(actual), estados.filter((nuevo) => nuevo !== actual), actual);   // como antes: todos menos el actual
  }
});
