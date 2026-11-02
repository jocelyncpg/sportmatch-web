import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_TOKEN, COOKIE_USER, leerUsuarioFirmado, opcionesCookie, origenSeguro } from "@/lib/servidor/bff";
import { decidirAcceso, mensajeBackend, rutaGateway } from "@/lib/servidor/core.mjs";

type Contexto = {
  params: Promise<{ ruta: string[] }>;
};

async function proxy(request: Request, context: Contexto) {
  const { ruta } = await context.params;
  const path = rutaGateway(ruta);
  if (!path) return NextResponse.json({ error: "Ruta no disponible." }, { status: 404 });
  const method = request.method.toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return NextResponse.json({ error: "Método no permitido." }, { status: 405 });
  }
  if (path === "users/reports" && method !== "POST") {
    return NextResponse.json({ error: "Método no permitido." }, { status: 405 });
  }
  // Las rutas de administración (users/admin/*, payments/admin/*) solo pasan con una sesión de administrador. El
  // rol sale de la cookie firmada que emite este servidor, nunca de algo que mande el navegador; quien no es admin
  // recibe 403 sin que la petición llegue al gateway.
  const jar = await cookies();
  const rol = leerUsuarioFirmado(jar.get(COOKIE_USER)?.value)?.rol ?? null;
  const acceso = decidirAcceso(ruta.join("/"), method, rol);
  if (!acceso.permitido) {
    const mensajes: Record<number, string> = {
      401: "La sesión expiró. Inicia sesión nuevamente.",
      403: "No tienes permiso para realizar esta acción.",
      405: "Método no permitido.",
    };
    return NextResponse.json(
      { error: mensajes[acceso.status] ?? "Ruta no disponible." },
      { status: acceso.status, headers: { "cache-control": "no-store" } },
    );
  }
  if (method !== "GET" && !origenSeguro(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  const token = jar.get(COOKIE_TOKEN)?.value;
  if (!token) {
    return NextResponse.json({ error: "La sesión expiró. Inicia sesión nuevamente." }, { status: 401 });
  }
  let body: string | undefined;
  if (method !== "GET") {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 1_000_000) {
      return NextResponse.json({ error: "El contenido supera el tamaño permitido." }, { status: 413 });
    }
    body = await request.text();
    if (body.length > 1_000_000) {
      return NextResponse.json({ error: "El contenido supera el tamaño permitido." }, { status: 413 });
    }
    if (body) {
      try {
        JSON.parse(body);
      } catch {
        return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
      }
    }
  }
  try {
    const target = new URL(`/api/v1/${path}`, process.env.GATEWAY_URL || "http://localhost:8000");
    target.search = new URL(request.url).search;
    const headers = new Headers({ authorization: `Bearer ${token}` });
    if (body) {
      const contentType = request.headers.get("content-type")?.includes("application/json")
        ? "application/json"
        : "text/plain";
      headers.set("content-type", contentType);
    }
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(path.startsWith("payments/webpay/") ? 40_000 : 15_000),
      cache: "no-store",
      redirect: "manual",
    });
    if (upstream.status === 401) {
      let payload: unknown;
      try {
        payload = await upstream.json();
      } catch {
        payload = null;
      }
      const message = mensajeBackend(upstream.status, payload, "La sesión expiró. Inicia sesión nuevamente.");
      const response = NextResponse.json({ error: message }, { status: 401 });
      const clear = opcionesCookie(process.env.NODE_ENV === "production", 0);
      response.cookies.set(COOKIE_TOKEN, "", clear);
      response.cookies.set(COOKIE_USER, "", clear);
      return response;
    }
    if (!upstream.ok) {
      const messages: Record<number, string> = {
        400: "Los datos enviados no son válidos.",
        403: "No tienes permiso para realizar esta acción.",
        404: "No se encontró la información solicitada.",
        409: "La solicitud entra en conflicto con el estado actual.",
        422: "Revisa los datos ingresados.",
        429: "Demasiadas solicitudes. Inténtalo más tarde.",
        503: "El servicio no está disponible. Inténtalo nuevamente.",
      };
      let payload: unknown;
      try {
        payload = await upstream.json();
      } catch {
        payload = null;
      }
      const fallback = messages[upstream.status] ?? "No se pudo completar la solicitud.";
      const error = mensajeBackend(upstream.status, payload, fallback);
      return NextResponse.json(
        { error },
        { status: upstream.status, headers: { "cache-control": "no-store" } },
      );
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "El servicio no está disponible. Inténtalo nuevamente." }, { status: 502 });
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
