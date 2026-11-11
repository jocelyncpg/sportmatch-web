export function mapearRol(role) {
  return role === "club_admin" ? "club" : role === "admin" ? "admin" : null;
}

export function rutasPermitidas(path) {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const segments = clean.split("/");
  if (!clean || segments.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    return false;
  }
  // users/reports: solo la creación de reportes (POST); users/photos/<clave>: solo ver una foto de perfil (GET, HU-61);
  // el resto de users/* sigue fuera.
  return /^(clubs(?:\/|$)|payments\/(?:plans|subscription\/me|history\/me|subscriptions\/me\/history|history\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/receipt|webpay\/(?:initiate|commit))$|users\/reports$|users\/photos\/[0-9a-f]{32}\.(?:jpg|png)$)/.test(clean);
}

// Rutas de administración (HU-45 sanciones, HU-47 reportes, HU-48 auditoría, HU-56 planes y convenios), con los
// métodos que el panel necesita. El BFF solo las deja pasar a una SESIÓN de administrador (ver decidirAcceso).
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const RUTAS_ADMIN = [
  [/^users\/admin\/reports$/, ["GET"]],
  [new RegExp(`^users/admin/reports/${UUID}$`), ["PATCH"]],
  [/^users\/admin\/sanctions$/, ["GET", "POST"]],
  [new RegExp(`^users/admin/sanctions/${UUID}$`), ["GET"]],
  [new RegExp(`^users/admin/sanctions/${UUID}/lift$`), ["POST"]],
  [/^users\/admin\/audit-events$/, ["GET"]],
  [/^payments\/admin\/plans$/, ["GET", "POST"]],
  [/^payments\/admin\/plans\/[0-9]{1,9}$/, ["PATCH"]],
  [/^payments\/admin\/plans\/[0-9]{1,9}\/deactivate$/, ["POST"]],
  [/^payments\/admin\/plans\/[0-9]{1,9}\/reactivate$/, ["POST"]],
  [/^payments\/admin\/plans\/[0-9]{1,9}\/subscriptions$/, ["GET"]],
  // HU-57: pagos de la plataforma, solo lectura.
  [/^payments\/admin\/transactions$/, ["GET"]],
];

function rutaLimpia(path) {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const segments = clean.split("/");
  if (!clean || segments.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) return null;
  return clean;
}

/** Métodos permitidos de una ruta de administración, o null si la ruta no es de administración. */
export function metodosAdmin(path) {
  const clean = rutaLimpia(path);
  if (!clean) return null;
  const encontrada = RUTAS_ADMIN.find(([patron]) => patron.test(clean));
  return encontrada ? encontrada[1] : null;
}

export function rutaGateway(segments) {
  // La lista blanca se evalúa con los parámetros ya decodificados que entrega Next.js.
  const decodedPath = segments.join("/");
  if (!rutasPermitidas(decodedPath) && !metodosAdmin(decodedPath)) return null;
  return segments.map(encodeURIComponent).join("/");
}

/**
 * Decide si una petición puede pasar al gateway. `rol` es el de la SESIÓN del servidor (la cookie firmada con
 * HMAC que el BFF emitió al iniciar sesión), nunca un dato que mande el navegador.
 *  - Ruta de administración: solo el rol "admin". Sin sesión, 401. Con otro rol, 403 (no llega al gateway).
 *  - Ruta de club o pública de la lista blanca: igual que siempre (cualquier sesión válida).
 *  - Cualquier otra ruta: 404.
 */
export function decidirAcceso(path, metodo, rol) {
  const clean = rutaLimpia(path);
  if (clean && /^payments\/(?:history\/|subscriptions\/me\/history$)/.test(clean) && rutasPermitidas(clean)) {
    if (String(metodo).toUpperCase() !== "GET") return { permitido: false, status: 405 };
    if (!rol) return { permitido: false, status: 401 };
  }
  const metodos = metodosAdmin(path);
  if (metodos) {
    if (!metodos.includes(String(metodo).toUpperCase())) return { permitido: false, status: 405 };
    if (!rol) return { permitido: false, status: 401 };
    if (rol !== "admin") return { permitido: false, status: 403 };
    return { permitido: true, status: 200 };
  }
  return rutasPermitidas(path) ? { permitido: true, status: 200 } : { permitido: false, status: 404 };
}

export function mensajeBackend(status, payload, fallback) {
  if (status < 400 || status >= 500 || !payload || typeof payload !== "object") return fallback;
  const detail = payload.detail;
  return typeof detail === "string" && detail.length <= 300 ? detail : fallback;
}

export function mensajeLogin(status, payload) {
  if (status === 401) return "Correo o contraseña incorrectos";
  if ([400, 403, 423].includes(status)) {
    return mensajeBackend(status, payload, "No se pudo iniciar sesión.");
  }
  return "No se pudo iniciar sesión.";
}

export function errorBff(payload, fallback) {
  if (!payload || typeof payload !== "object") return fallback;
  const error = payload.error;
  return typeof error === "string" && error.length <= 300 ? error : fallback;
}

export function validarLoginBody(value) {
  if (!value || typeof value !== "object") return false;
  return typeof value.email === "string" && value.email.length <= 100
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)
    && typeof value.password === "string" && value.password.length >= 1
    && value.password.length <= 128;
}

export function validarCSRF(request) {
  // El marcador solo sustituye al origen para las llamadas internas de la web.
  if (request.headers.get("x-requested-with") === "sportmatch-web") return true;
  const origin = request.headers.get("origin");
  try {
    return !!origin && new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

const attempts = new Map();
const windowMs = 15 * 60 * 1000;

function podarIntentos(ahora) {
  if (attempts.size <= 5000) return;
  for (const [key, value] of attempts) {
    if (value.until <= ahora) attempts.delete(key);
  }
}

export function claveIntentos(email, ip, trustProxy) {
  return trustProxy && ip ? `${ip}:${email}` : email;
}

export function limitarPorIP(request, email, trustProxy) {
  // Solo se confía en x-forwarded-for cuando el despliegue declara un proxy confiable.
  const ip = trustProxy ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : "";
  return claveIntentos(email, ip, trustProxy);
}

export function limitado(key, ahora = Date.now()) {
  const current = attempts.get(key);
  if (!current || current.until <= ahora) {
    attempts.set(key, { count: 0, until: ahora + windowMs });
    podarIntentos(ahora);
    return false;
  }
  return current.count >= 5;
}

export function falloLogin(key, ahora = Date.now()) {
  const current = attempts.get(key);
  if (!current || current.until <= ahora) {
    attempts.set(key, { count: 1, until: ahora + windowMs });
    podarIntentos(ahora);
  } else {
    current.count++;
  }
}

export function limpiarIntentos(key) {
  attempts.delete(key);
}

export function cantidadIntentos() {
  return attempts.size;
}

export function opcionesCookie(secure, maxAge) {
  return { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge };
}

// HU-54: un servicio respondió 402 {codigo: "LIMITE_PLAN", ...} porque el club o el deportista llegó a un límite del
// plan gratuito. El BFF lo deja pasar con esos campos (y solo esos) para que el panel ofrezca contratar un plan.
export function limitePlanBff(status, payload) {
  if (status !== 402 || !payload || typeof payload !== "object" || payload.codigo !== "LIMITE_PLAN") return null;
  const entero = (valor) => (Number.isInteger(valor) && valor >= 0 && valor <= 1_000_000 ? valor : null);
  const limite = entero(payload.limite);
  if (limite === null) return null;
  const recurso = typeof payload.recurso === "string" && /^[a-z_]{1,40}$/.test(payload.recurso) ? payload.recurso : "";
  const fecha = typeof payload.se_libera_en === "string" && payload.se_libera_en.length <= 40
    && !Number.isNaN(Date.parse(payload.se_libera_en)) ? payload.se_libera_en : null;
  return { codigo: "LIMITE_PLAN", recurso, limite, usado: entero(payload.usado) ?? limite, se_libera_en: fecha };
}
