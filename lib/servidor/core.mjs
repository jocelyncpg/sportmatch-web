export function mapearRol(role) {
  return role === "club_admin" ? "club" : role === "admin" ? "admin" : null;
}

export function rutasPermitidas(path) {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const segments = clean.split("/");
  if (!clean || segments.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    return false;
  }
  return /^(clubs(?:\/|$)|payments\/(?:plans|subscription\/me)(?:\/|$))/.test(clean);
}

export function rutaGateway(segments) {
  // La lista blanca se evalúa con los parámetros ya decodificados que entrega Next.js.
  const decodedPath = segments.join("/");
  if (!rutasPermitidas(decodedPath)) return null;
  return segments.map(encodeURIComponent).join("/");
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
  return !!origin && new URL(origin).origin === new URL(request.url).origin;
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
