/* eslint-disable @typescript-eslint/no-require-imports -- script de Node en CommonJS, no forma parte de la app */
// Recorrido de las pantallas de admin del panel web contra la API REAL (gateway local), con un Chrome real.
// Uso (solo entorno local): PW_DIR=<carpeta con node_modules/playwright-core> E2E_CONTEXT=<json> E2E_PASSWORD=<clave> \
//   node scripts/e2e-admin.cjs
// E2E_CONTEXT = { tag, admin:{email,id}, club:{email,id}, player:{email,id}, a,b,c,d:{email,id,nombre} } con cuentas
// desechables. La clave llega por variable de entorno y nunca se imprime ni se guarda. Las capturas van a evidencia-admin/.
const { createRequire } = require("module");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { chromium } = createRequire(path.join(process.env.PW_DIR, "package.json"))("playwright-core");

const WEB = "http://localhost:3000";
const API = "http://127.0.0.1:8000/api/v1";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const CTX = JSON.parse(process.env.E2E_CONTEXT);
const PW = process.env.E2E_PASSWORD;
const EVI = path.join(__dirname, "..", "evidencia-admin");
fs.mkdirSync(EVI, { recursive: true });
for (const f of fs.readdirSync(EVI)) if (/\.(png|json)$/.test(f)) fs.rmSync(path.join(EVI, f));

const resultados = [];
let n = 0;
const check = (nombre, ok, detalle = "") => {
  resultados.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 200) });
  console.log(`${ok ? "PASS" : "FAIL"} ${nombre}${detalle ? `  [${String(detalle).slice(0, 160)}]` : ""}`);
};
const shot = async (page, nombre) => {
  n += 1;
  // Una página muy larga (decenas de reportes de otras pruebas) no se lee entera: solo se captura la parte visible.
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: path.join(EVI, `${String(n).padStart(2, "0")}-${nombre}.png`), fullPage: alto <= 2600 });
};
const visible = async (loc, ms = 8000) => {
  try { await loc.first().waitFor({ state: "visible", timeout: ms }); return true; } catch { return false; }
};

async function login(page, email) {
  await page.goto(`${WEB}/?login=1`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PW);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/inicio", { timeout: 20000 });
}
// Llamada al BFF desde la página (con su sesión), como lo haría el panel.
const bff = (page, method, ruta, body) =>
  page.evaluate(async ([m, r, b]) => {
    const res = await fetch(`/api/gw/${r}`, {
      method: m, headers: { "x-requested-with": "sportmatch-web", ...(b ? { "content-type": "application/json" } : {}) },
      body: b ? JSON.stringify(b) : undefined, credentials: "same-origin",
    });
    let json = null;
    try { json = await res.json(); } catch { /* sin cuerpo */ }
    return { status: res.status, json };
  }, [method, ruta, body]);
const gw = async (method, ruta, body) => {
  const res = await fetch(`${API}/${ruta}`, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, json };
};
const card = (page, nombre, boton) =>
  page.locator("div.rounded-2xl").filter({ hasText: nombre, has: page.getByRole("button", { name: boton }) }).last();
const mensaje = (page, texto) => page.getByText(texto, { exact: false });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const errores = [];
  const nuevoContexto = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "es-CL" });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errores.push(`pageerror: ${e.message.slice(0, 120)}`));
    page.on("console", (m) => { if (m.type() === "error" && !/401|403|404|409|503|Failed to load resource/.test(m.text())) errores.push(`console: ${m.text().slice(0, 120)}`); });
    return { ctx, page };
  };

  try {
    // ---------------------------------------------------------------- 1. quien no es admin
    console.log("== 1. Una cuenta que no es admin");
    {
      const { ctx, page } = await nuevoContexto();
      await login(page, CTX.club.email);
      for (const ruta of ["reportes", "sanciones", "auditoria", "planes"]) {
        await page.goto(`${WEB}/${ruta}`);
        check(`club: /${ruta} muestra que es solo para administración`, await visible(mensaje(page, "solo para la administración de la plataforma")));
        if (ruta === "reportes") await shot(page, "club-reportes-bloqueado");
      }
      const rutas = [
        ["GET", "users/admin/reports?estado=todos"], ["PATCH", `users/admin/reports/${CTX.club.id}`, { estado: "revisado" }],
        ["GET", "users/admin/sanctions"], ["POST", "users/admin/sanctions", { usuario_id: CTX.b.id, tipo: "permanente", motivo: "Intento de club" }],
        ["POST", `users/admin/sanctions/${CTX.club.id}/lift`, { motivo: "Intento de club" }], ["GET", "users/admin/audit-events"],
        ["GET", "payments/admin/plans"], ["POST", "payments/admin/plans", { nombre: "Intento", tipo: "USUARIO", precio: 1, duracion_dias: 1 }],
        ["PATCH", "payments/admin/plans/1", { precio: 1 }], ["POST", "payments/admin/plans/1/deactivate", {}],
      ];
      const codigos = [];
      for (const [m, r, b] of rutas) codigos.push((await bff(page, m, r, b)).status);
      check("club: las 10 rutas de administración del BFF -> 403 (no llegan al gateway)", codigos.every((c) => c === 403), codigos.join(","));
      const publico = await bff(page, "GET", "payments/plans?tipo=CLUB");
      check("club: sus rutas siguen igual (payments/plans -> 200)", publico.status === 200, publico.status);
      // Cookie de usuario falsificada: el rol admin con la firma del club
      const cookies = await ctx.cookies();
      const usuario = cookies.find((c) => c.name === "sm_usuario");
      const [, firma] = usuario.value.split(".");
      const falso = Buffer.from(JSON.stringify({ nombre: "Falso", email: CTX.club.email, rol: "admin" })).toString("base64url");
      await ctx.addCookies([{ ...usuario, value: `${falso}.${firma}` }]);
      const forjado = await bff(page, "GET", "users/admin/reports");
      check("cookie de rol falsificada (firma ajena) -> 401, no pasa", forjado.status === 401, forjado.status);
      await ctx.addCookies([{ ...usuario, value: "admin" }]);
      check("cookie de rol sin firma -> 401", (await bff(page, "GET", "payments/admin/plans")).status === 401);
      await ctx.close();
    }
    {
      const { ctx, page } = await nuevoContexto();
      await page.goto(`${WEB}/`);
      const sinSesion = [(await bff(page, "GET", "users/admin/reports")).status, (await bff(page, "GET", "payments/admin/plans")).status,
        (await bff(page, "POST", "users/admin/sanctions", {})).status];
      check("sin sesión: rutas de administración -> 401", sinSesion.every((c) => c === 401), sinSesion.join(","));
      const login = await fetch(`${WEB}/api/sesion`, { method: "POST", headers: { "content-type": "application/json", "x-requested-with": "sportmatch-web" }, body: JSON.stringify({ email: CTX.player.email, password: PW }) });
      check("un deportista no puede entrar a la web (403)", login.status === 403, login.status);
      await ctx.close();
    }

    // ---------------------------------------------------------------- 2. el admin
    const { ctx, page } = await nuevoContexto();
    console.log("== 2. Administrador: inicio y reportes");
    await login(page, CTX.admin.email);
    await page.goto(`${WEB}/inicio`);
    check("inicio: tira de moderación con los textos de siempre", await visible(mensaje(page, "Reportes por atender")) && await visible(mensaje(page, "Cuentas suspendidas")) && await visible(mensaje(page, "Acciones registradas")));
    await page.waitForFunction(() => /(Reportes por atender\s*[1-9]\d*|[1-9]\d*\s*Reportes por atender)/.test(document.body.innerText.replace(/\n/g, " ")), null, { timeout: 10000 }).catch(() => {});
    await shot(page, "admin-inicio");
    const textoInicio = (await page.locator("section").first().innerText()).replace(/\s+/g, " ");
    check("inicio: los números reales llegaron, sin '+'", /([1-9]\d*\s*Reportes por atender|Reportes por atender\s*[1-9]\d*)/.test(textoInicio) && !/\d\+/.test(textoInicio), textoInicio.slice(60, 200));

    await page.goto(`${WEB}/reportes`);
    check("reportes: lista pendientes con la persona reportada y quién emitió", await visible(mensaje(page, CTX.b.nombre)) && await visible(mensaje(page, "Emitido por")));
    await shot(page, "reportes-pendientes");
    // B: marcar como revisado
    await card(page, CTX.b.nombre, "Marcar como revisado").getByRole("button", { name: "Marcar como revisado" }).click();
    await page.locator("textarea").fill("Se revisó y no hay sanción");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await page.getByRole("button", { name: "Revisados", exact: true }).click();
    check("reportes: marcar como revisado -> pasa a Revisados", await visible(mensaje(page, CTX.b.nombre)));
    await shot(page, "reportes-revisado");
    await page.getByRole("button", { name: "Pendientes", exact: true }).click();
    // D: escalar a sanción (temporal, 7 días)
    await card(page, CTX.d.nombre, "Escalar a sanción").getByRole("button", { name: "Escalar a sanción" }).click();
    check("reportes: 'Escalar a sanción' abre el formulario de suspensión de siempre", await visible(page.getByRole("button", { name: "Aplicar suspensión" })) && await visible(page.getByRole("button", { name: "Definitiva", exact: true })));
    await page.locator("textarea").last().fill("Reincidente, pasa a sanción");
    await page.getByRole("button", { name: "Aplicar suspensión" }).click();
    check("reportes: aplicar suspensión -> aviso con motivo y duración", await visible(mensaje(page, "su cuenta quedó suspendida (7 días)")));
    await shot(page, "reportes-escalado-sancionado");
    await page.getByRole("button", { name: "Escalados", exact: true }).click();
    check("reportes: el reporte quedó en Escalados", await visible(mensaje(page, CTX.d.nombre)));
    // 409 del backend: transición inválida
    const lista = (await bff(page, "GET", "users/admin/reports?estado=todos&limit=100")).json;
    const repD = lista.find((r) => r.objetivo_id === CTX.d.id);
    const invalida = await bff(page, "PATCH", `users/admin/reports/${repD.id}`, { estado: "revisado" });
    check("reportes: transición inválida en el backend -> 409 con mensaje claro", invalida.status === 409 && typeof invalida.json?.error === "string", `${invalida.status} ${invalida.json?.error}`);

    // ---------------------------------------------------------------- 3. sanciones
    console.log("== 3. Sanciones");
    await page.goto(`${WEB}/sanciones`);
    check("sanciones: 'Personas con reportes' ofrece Suspender", await visible(card(page, CTX.c.nombre, "Suspender").getByRole("button", { name: "Suspender", exact: true })));
    check("sanciones: D figura como suspendida (7 días) y en Suspensiones vigentes", await visible(mensaje(page, "Suspendida (7 días)")) && await visible(card(page, CTX.d.nombre, "Levantar suspensión")));
    await shot(page, "sanciones-vigentes-d");
    const login403 = await gw("POST", "users/auth/login", { email: CTX.d.email, password: PW });
    check("sanciones: la cuenta sancionada no puede iniciar sesión (403 account_suspended)", login403.status === 403 && login403.json?.code === "account_suspended", login403.status);
    const dup = await bff(page, "POST", "users/admin/sanctions", { usuario_id: CTX.d.id, tipo: "temporal", dias: 3, motivo: "Segunda sanción sobre la misma cuenta" });
    check("sanciones: sanción duplicada -> 409 con mensaje", dup.status === 409 && typeof dup.json?.error === "string", `${dup.status} ${dup.json?.error}`);
    const auto = await bff(page, "POST", "users/admin/sanctions", { usuario_id: CTX.admin.id, tipo: "temporal", dias: 3, motivo: "Intento de auto sanción" });
    check("sanciones: no se puede sancionar a un admin ni a sí mismo (422)", auto.status === 422, auto.status);
    // C: definitiva desde 'Personas con reportes'
    await card(page, CTX.c.nombre, "Suspender").getByRole("button", { name: "Suspender", exact: true }).click();
    await page.getByRole("button", { name: "Definitiva", exact: true }).click();
    await page.locator("textarea").last().fill("Conducta grave comprobada");
    await page.getByRole("button", { name: "Aplicar suspensión" }).click();
    check("sanciones: la web dice 'definitiva' (el backend 'permanente')", await visible(mensaje(page, "su cuenta quedó suspendida (definitiva)")) && await visible(mensaje(page, "Suspendida (definitiva)")));
    const enBackend = (await bff(page, "GET", "users/admin/sanctions?estado=activa&limit=100")).json;
    check("sanciones: en el backend quedó como 'permanente'", enBackend.some((s) => s.usuario.user_id === CTX.c.id && s.tipo === "permanente"));
    await shot(page, "sanciones-definitiva");
    // levantar D
    await card(page, CTX.d.nombre, "Levantar suspensión").getByRole("button", { name: "Levantar suspensión" }).click();
    await page.locator("textarea").last().fill("Apelación aceptada");
    await page.getByRole("button", { name: "Confirmar" }).click();
    const loginOk = await (async () => { for (let i = 0; i < 10; i++) { const r = await gw("POST", "users/auth/login", { email: CTX.d.email, password: PW }); if (r.status === 200) return r; await new Promise((x) => setTimeout(x, 500)); } return gw("POST", "users/auth/login", { email: CTX.d.email, password: PW }); })();
    check("sanciones: levantar -> la cuenta vuelve a entrar al instante", loginOk.status === 200, loginOk.status);
    check("sanciones: la suspensión levantada pasa al Historial con su motivo", await visible(mensaje(page, "Apelación aceptada")));
    await shot(page, "sanciones-historial");

    // ---------------------------------------------------------------- 4. auditoría
    console.log("== 4. Auditoría");
    await page.goto(`${WEB}/auditoria`);
    check("auditoría: etiquetas de siempre en la tabla", await visible(mensaje(page.locator("tbody"), "Sanción aplicada")) && await visible(mensaje(page.locator("tbody"), "Reporte revisado")));
    const cuerpo = await page.locator("section").innerText();
    check("auditoría: sin códigos crudos del backend ni botones de editar o borrar", !/SANCTION_|REPORT_|PLAN_/.test(cuerpo) && !/\b(Editar|Borrar|Eliminar)\b/.test(cuerpo));
    await shot(page, "auditoria-todo");
    await page.getByRole("button", { name: "Sanción aplicada", exact: true }).click();
    const filas = await page.locator("tbody tr").allInnerTexts();
    check("auditoría: el chip 'Sanción aplicada' deja solo esas filas", filas.length >= 2 && filas.every((f) => f.includes("Sanción aplicada")), `${filas.length} filas`);
    await page.getByRole("button", { name: "Todas", exact: true }).click();
    await page.getByPlaceholder("Buscar por recurso, motivo o admin…").fill("Apelación aceptada");
    check("auditoría: la búsqueda encuentra el motivo de la sanción levantada", (await page.locator("tbody tr").count()) >= 1);
    await shot(page, "auditoria-busqueda");
    const lectura = await page.evaluate(async () => (await fetch("/api/gw/users/admin/audit-events", { method: "DELETE", headers: { "x-requested-with": "sportmatch-web" } })).status);
    check("auditoría: el BFF no admite borrar ni editar (405)", lectura === 405, lectura);

    // ---------------------------------------------------------------- 5. planes y convenios
    console.log("== 5. Planes y convenios");
    await page.goto(`${WEB}/planes`);
    check("planes: lista los planes reales (activos e inactivos)", await visible(mensaje(page, "Demo Deportista Mensual")));
    check("planes: la tabla de suscripciones por persona sigue visible", await visible(mensaje(page, "Suscripciones")));
    await shot(page, "planes-inicial");
    const nombrePlan = `HUW Plan ${CTX.tag}`;
    const nombreConv = `HUW Convenio ${CTX.tag}`;
    await page.getByRole("button", { name: "Nuevo plan o convenio" }).click();
    await page.getByPlaceholder("Ej: Pro Anual").fill(nombrePlan);
    await page.getByPlaceholder("4990").fill("4990");
    await page.getByRole("button", { name: "1 mes" }).click();
    await page.locator("textarea").last().fill("Actividades sin límite\nFiltros avanzados");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    check("planes: crear plan -> aviso y aparece", await visible(mensaje(page, "creado. Ya aparece en el catálogo")) && await visible(mensaje(page, nombrePlan)));
    await shot(page, "planes-creado");
    await page.getByRole("button", { name: "Nuevo plan o convenio" }).click();
    await page.getByRole("button", { name: "Convenio", exact: true }).click();
    await page.getByRole("button", { name: "Clubes", exact: true }).click();
    await page.getByPlaceholder("Ej: Convenio Universidad X").fill(nombreConv);
    await page.getByPlaceholder("Con quién se firmó el convenio").fill("Universidad Demo");
    await page.getByPlaceholder("4990").fill("2990");
    await page.getByRole("button", { name: "3 meses" }).click();
    await page.locator("textarea").last().fill("Cupos para el club");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    check("planes: crear convenio -> aparece", await visible(mensaje(page, nombreConv)));
    // validación del formulario de siempre
    await page.getByRole("button", { name: "Nuevo plan o convenio" }).click();
    await page.getByPlaceholder("Ej: Pro Anual").fill(`HUW Malo ${CTX.tag}`);
    await page.getByPlaceholder("4990").fill("49.9");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    check("planes: precio con decimales -> mensaje del formulario, no se envía", await visible(mensaje(page, "El precio debe ser un monto entero en pesos")));
    await page.getByRole("button", { name: "Cancelar" }).last().click();
    // nombre duplicado -> 409 del backend, por el mensaje del formulario
    await page.getByRole("button", { name: "Nuevo plan o convenio" }).click();
    await page.getByPlaceholder("Ej: Pro Anual").fill(nombrePlan.toUpperCase());
    await page.getByPlaceholder("4990").fill("100");
    await page.getByRole("button", { name: "1 mes" }).click();
    await page.locator("textarea").last().fill("Algo");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    check("planes: nombre duplicado -> mensaje del backend en el formulario", await visible(mensaje(page, "Ya existe un plan activo con ese nombre")));
    await shot(page, "planes-duplicado-409");
    await page.getByRole("button", { name: "Cancelar" }).last().click();
    // editar precio
    await card(page, nombrePlan, "Editar").getByRole("button", { name: "Editar" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    check("planes: guardar sin cambios -> 'No hay cambios para guardar.'", await visible(mensaje(page, "No hay cambios para guardar")));
    await page.getByPlaceholder("4990").fill("5990");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    check("planes: cambiar el precio -> 'actualizado' y se ve $5.990", await visible(mensaje(page, "actualizado")) && await visible(mensaje(page, "$5.990")));
    await shot(page, "planes-precio-cambiado");
    const catalogo = await page.locator("section").innerText();
    check("planes: 'Así se ve en el catálogo' lista plan y convenio", catalogo.includes(nombrePlan) && catalogo.includes(nombreConv));
    // desactivar el convenio
    await card(page, nombreConv, "Desactivar").getByRole("button", { name: "Desactivar" }).click();
    await page.locator("textarea").last().fill("Se terminó el convenio");
    await page.getByRole("button", { name: "Confirmar" }).click();
    check("planes: desactivar -> 'ya no aparece en el catálogo'", await visible(mensaje(page, "ya no aparece en el catálogo")));
    await page.getByRole("button", { name: "Desactivados", exact: true }).click();
    check("planes: aparece en 'Desactivados' con el botón Reactivar visible", await visible(mensaje(page, nombreConv)) && await visible(card(page, nombreConv, "Reactivar").getByRole("button", { name: "Reactivar" })));
    await card(page, nombreConv, "Reactivar").getByRole("button", { name: "Reactivar" }).click();
    check("planes: Reactivar no tiene respaldo en el backend -> 'Esta función aún no está disponible'", await visible(mensaje(page, "Esta función aún no está disponible")));
    await shot(page, "planes-desactivado");
    const cat2 = await bff(page, "GET", "payments/plans?tipo=CLUB");
    check("planes: el convenio desactivado ya no está en el catálogo público", Array.isArray(cat2.json) && !cat2.json.some((p) => p.nombre === nombreConv));
    const idConv = (await bff(page, "GET", "payments/admin/plans?estado=inactivo&limit=50")).json.items.find((p) => p.nombre === nombreConv).id;
    const otraVez = await bff(page, "POST", `payments/admin/plans/${idConv}/deactivate`, {});
    check("planes: desactivar de nuevo -> 409", otraVez.status === 409, otraVez.status);
    const noDelete = await bff(page, "DELETE", "payments/admin/plans/1");
    check("planes: no existe borrar (el BFF responde 405)", noDelete.status === 405, noDelete.status);

    // ---------------------------------------------------------------- 6. seguridad del navegador
    console.log("== 6. Sesión y datos en el navegador");
    const almacen = await page.evaluate(() => ({
      local: Object.keys(localStorage), sesion: Object.entries(sessionStorage).map(([k, v]) => [k, String(v)]),
      cookieVisible: document.cookie,
    }));
    const todo = JSON.stringify(almacen);
    check("el navegador no guarda token (ni JWT) en storage ni en cookies visibles", !/eyJ[\w-]{8,}\.[\w-]{8,}/.test(todo) && !/sm_sesion/.test(almacen.cookieVisible), `local=[${almacen.local.join(",")}] session=[${almacen.sesion.map(([k]) => k).join(",")}]`);
    check("localStorage no guarda datos de moderación ni de planes", !almacen.local.some((k) => /moder|plan|sancion|report|audit/i.test(k)), almacen.local.join(","));
    const cookies = await ctx.cookies();
    const tokenCookie = cookies.find((c) => c.name === "sm_sesion");
    check("la cookie de sesión es httpOnly y SameSite", tokenCookie?.httpOnly === true && /lax|strict/i.test(tokenCookie?.sameSite ?? ""), `${tokenCookie?.httpOnly} ${tokenCookie?.sameSite}`);
    const cabeceras = (await page.request.get(`${WEB}/inicio`)).headers();
    check("se mantienen las cabeceras de seguridad del panel", cabeceras["x-content-type-options"] === "nosniff" && cabeceras["x-frame-options"] === "DENY" && !!cabeceras["referrer-policy"]);

    // ---------------------------------------------------------------- 7. 503 y 401
    console.log("== 7. Servicio caído (503) y sesión vencida (401)");
    try {
      execSync("docker stop sportmatch-backend-ms_users-1", { stdio: "ignore" });
      await page.goto(`${WEB}/auditoria`);
      check("503: auditoría con Ms_Users caído muestra un mensaje claro y sin detalles internos", await visible(mensaje(page, "El servicio no está disponible"), 15000));
      const texto503 = await page.locator("section").innerText();
      check("503: el mensaje no deja ver rutas, hosts ni trazas", !/ms_users|127\.0\.0\.1|Traceback|httpx|ECONN/i.test(texto503));
      await shot(page, "auditoria-503");
    } finally {
      execSync("docker start sportmatch-backend-ms_users-1", { stdio: "ignore" });
    }
    for (let i = 0; i < 40; i++) {
      const estado = execSync("docker inspect -f {{.State.Health.Status}} sportmatch-backend-ms_users-1").toString().trim();
      if (estado === "healthy") break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    await ctx.clearCookies();
    await page.goto(`${WEB}/reportes`);
    check("401: sin sesión del servidor, el panel vuelve al inicio de sesión", await page.waitForURL(/login=1/, { timeout: 15000 }).then(() => true, () => false), page.url());
    await shot(page, "sesion-vencida-login");
    check("sin errores de JavaScript en las pantallas", errores.length === 0, errores.slice(0, 3).join(" | "));
    await ctx.close();
  } finally {
    await browser.close();
    const ok = resultados.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(EVI, "resultado.json"), JSON.stringify({ fecha: new Date().toISOString(), pass: ok, fail: resultados.length - ok, resultados }, null, 1));
    console.log(`\nRESUMEN: ${ok} PASS, ${resultados.length - ok} FAIL`);
    for (const r of resultados.filter((x) => !x.ok)) console.log(`  FAIL: ${r.nombre} [${r.detalle}]`);
    process.exitCode = resultados.some((r) => !r.ok) ? 1 : 0;
  }
})().catch((e) => { console.error("ERROR del recorrido:", e.message); process.exitCode = 2; });
