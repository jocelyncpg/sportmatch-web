import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_TOKEN,
  COOKIE_USER,
  falloLogin,
  firmarUsuario,
  limitado,
  limpiarIntentos,
  leerUsuarioFirmado,
  mapearRol,
  opcionesCookie,
  origenSeguro,
  validarLoginBody,
} from "@/lib/servidor/bff";
import { limitarPorIP, mensajeLogin } from "@/lib/servidor/core.mjs";

const maxAge = (seconds: number) => Math.max(1, Math.min(Math.floor(seconds), 31_536_000));

function clearCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(COOKIE_TOKEN, "", options);
  response.cookies.set(COOKIE_USER, "", options);
}

export async function POST(request: Request) {
  if (!origenSeguro(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) throw new Error();
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Datos de inicio de sesión inválidos." }, { status: 400 });
  }
  if (!validarLoginBody(body)) {
    return NextResponse.json({ error: "Ingresa un correo y una contraseña válidos." }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  // El proxy solo participa en la clave cuando TRUST_PROXY está habilitada explícitamente.
  const key = limitarPorIP(request, email, process.env.TRUST_PROXY === "1");
  if (limitado(key)) {
    return NextResponse.json({ error: "Demasiados intentos. Inténtalo en 15 minutos." }, { status: 429 });
  }
  try {
    const gateway = (process.env.GATEWAY_URL || "http://localhost:8000").replace(/\/$/, "");
    const response = await fetch(`${gateway}/api/v1/users/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: body.password }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok) {
      falloLogin(key);
      if ([400, 403, 423].includes(response.status)) {
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        return NextResponse.json({ error: mensajeLogin(response.status, payload) }, { status: response.status });
      }
      return NextResponse.json(
        { error: mensajeLogin(response.status, null) },
        { status: response.status === 401 ? 401 : 502 },
      );
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 502 });
    }
    const result = data as {
      access_token?: unknown;
      expires_in_seconds?: unknown;
      user?: {
        nombre?: unknown;
        apellido_paterno?: unknown;
        email?: unknown;
        role?: unknown;
      };
    };
    const rol = mapearRol(result.user?.role);
    if (result.user?.role === "player") {
      return NextResponse.json({ error: "La web es solo para clubes y administración." }, { status: 403 });
    }
    const accessToken = result.access_token;
    const expiresInSeconds = result.expires_in_seconds;
    if (
      !rol
      || typeof accessToken !== "string"
      || typeof expiresInSeconds !== "number"
      || !Number.isFinite(expiresInSeconds)
    ) {
      return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 502 });
    }
    const nombreCompleto = [result.user?.nombre, result.user?.apellido_paterno]
      .filter((value): value is string => typeof value === "string" && !!value)
      .join(" ");
    const user = {
      nombre: nombreCompleto || String(result.user?.nombre ?? ""),
      email: typeof result.user?.email === "string" ? result.user.email : email,
      rol,
    } as const;
    const seconds = maxAge(expiresInSeconds);
    const cookiesStore = await cookies();
    const options = opcionesCookie(process.env.NODE_ENV === "production", seconds);
    cookiesStore.set(COOKIE_TOKEN, accessToken, options);
    cookiesStore.set(COOKIE_USER, firmarUsuario(user), options);
    limpiarIntentos(key);
    return NextResponse.json(user, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el servicio de inicio de sesión." }, { status: 502 });
  }
}
export async function GET() {
  const store = await cookies();
  const user = leerUsuarioFirmado(store.get(COOKIE_USER)?.value);
  if (!user || !store.get(COOKIE_TOKEN)?.value) {
    return NextResponse.json(
      { error: "No hay una sesión activa." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }
  return NextResponse.json(user, { headers: { "cache-control": "no-store" } });
}
export async function DELETE(request: Request) {
  if (!origenSeguro(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  clearCookies(response);
  return response;
}
