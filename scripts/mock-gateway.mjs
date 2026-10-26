// Gateway simulado para probar la web sin el backend real.
// Uso:  node scripts/mock-gateway.mjs      (queda en http://localhost:8000, el valor por defecto de GATEWAY_URL)
// Los datos viven en memoria: al reiniciar este script vuelven a los de ejemplo.
// Usuarios de ejemplo (cualquier contraseña sirve):
//   club@demo.cl  -> rol club
//   admin@demo.cl -> rol admin
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 8000);
const dias = (n) => new Date(Date.now() + n * 86400000).toISOString().replace(/\.\d{3}Z$/, "-03:00");

const deportes = [
  [1, "Atletismo"], [2, "Básquetbol"], [3, "Ciclismo"], [4, "Fútbol"], [5, "Natación"],
  [6, "Running"], [7, "Tenis"], [8, "Trekking"], [9, "Vóleibol"], [10, "Yoga"],
].map(([id, nombre]) => ({ id, nombre, descripcion: null }));
const deporte = (id) => deportes.find((d) => d.id === id);

const MI_CLUB_ID = "11111111-1111-4111-8111-111111111111";
const clubes = [
  {
    id: MI_CLUB_ID, nombre: "Club Deportivo Demo", rut: null,
    descripcion: "Club de ejemplo para probar la plataforma.", historia: null,
    logo: null, portada: null,
    ubicacion: { direccion: null, comuna: "Ñuñoa", provincia: null, latitud: null, longitud: null },
    email_contacto: "contacto@demo.cl", telefono: "+56 9 1111 2222", sitio_web: null, redes_sociales: {},
    verificado: true, is_active: true, estado_verificacion: "VERIFICADO",
    fecha_creacion: dias(-90), fecha_actualizacion: dias(-1), mi_rol: "PRINCIPAL", deportes: [deporte(4), deporte(6)],
  },
  ...[
    ["22222222-2222-4222-8222-222222222222", "Club Ejemplo Norte", "Providencia", [deporte(2)]],
    ["33333333-3333-4333-8333-333333333333", "Club Ejemplo Sur", "Maipú", [deporte(9), deporte(5)]],
  ].map(([id, nombre, comuna, deps]) => ({
    id, nombre, rut: null, descripcion: "Club de ejemplo (datos simulados).", historia: null, logo: null, portada: null,
    ubicacion: { direccion: null, comuna, provincia: null, latitud: null, longitud: null },
    email_contacto: null, telefono: null, sitio_web: null, redes_sociales: {},
    verificado: false, is_active: true, estado_verificacion: "PENDIENTE",
    fecha_creacion: dias(-30), fecha_actualizacion: null, mi_rol: "PRINCIPAL", deportes: deps,
  })),
];

const convocatorias = [{
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", clubId: MI_CLUB_ID, deporte_id: 4, titulo: "Prueba de selección Sub-18",
  descripcion: null, categoria_edad: "Sub-18", edad_minima: null, edad_maxima: null, fecha_prueba: dias(20),
  requisitos: ["Ropa deportiva", "Cédula de identidad"], cupos: 12, cupos_disponibles: 12,
  direccion: "Ñuñoa", comuna: "Ñuñoa", estado: "ABIERTA", fecha_creacion: dias(-3), chat_postulantes_habilitado: true,
}];

const postulaciones = [
  ["bbbbbbbb-0000-4000-8000-000000000001", "Ana", "P", 17, "PENDIENTE", "Quiero entrenar con ustedes."],
  ["bbbbbbbb-0000-4000-8000-000000000002", "Matías", "R", 18, "PRESELECCIONADO", null],
].map(([id, nombre, ap, edad, estado, mensaje], i) => ({
  id, convocatoria_id: convocatorias[0].id, usuario_id: `cccccccc-0000-4000-8000-00000000000${i + 1}`, estado,
  perfil_deportivo: { nombre, apellido_inicial: ap, edad, foto_perfil: null, biografia: null, deportes: [{ deporte_codigo: "FUT", nivel: 3 }] },
  mensaje, antecedentes: [], comentario_club: null, fecha_postulacion: dias(-i - 1), fecha_actualizacion: dias(-i - 1),
}));

const avisos = [];
let contador = 1;
const uuid = () => `dddddddd-0000-4000-8000-${String(contador++).padStart(12, "0")}`;

const json = (res, status, cuerpo) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(cuerpo === undefined ? "" : JSON.stringify(cuerpo));
};
const pagina = (items, url) => {
  const page = Number(url.searchParams.get("page") || 1);
  const size = Math.min(Number(url.searchParams.get("page_size") || 20), 50);
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, page_size: size };
};
const resumen = (c) => ({
  id: c.id, nombre: c.nombre, descripcion_corta: c.descripcion, logo: c.logo, direccion: c.ubicacion.direccion,
  comuna: c.ubicacion.comuna, verificado: c.verificado, deportes: c.deportes,
});
const conv = (c) => {
  const club = clubes.find((x) => x.id === c.clubId);
  const { clubId, deporte_id, ...resto } = c;
  return { ...resto, club: { id: club.id, nombre: club.nombre, logo: club.logo }, deporte: deporte(deporte_id) };
};
const leer = (req) => new Promise((ok) => {
  let texto = "";
  req.on("data", (parte) => { texto += parte; });
  req.on("end", () => { try { ok(texto ? JSON.parse(texto) : {}); } catch { ok({}); } });
});

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const ruta = url.pathname.replace(/^\/api\/v1\//, "").replace(/\/$/, "");
  const p = ruta.split("/");
  const m = req.method;
  const cuerpo = m === "GET" || m === "DELETE" ? {} : await leer(req);
  console.log(m, ruta);

  if (ruta === "users/auth/login" && m === "POST") {
    const email = String(cuerpo.email || "").toLowerCase();
    const rol = email === "club@demo.cl" ? "club_admin" : email === "admin@demo.cl" ? "admin" : null;
    if (!rol) return json(res, 401, { detail: "Credenciales inválidas" });
    return json(res, 200, {
      access_token: `mock-${rol}`, expires_in_seconds: 3600,
      user: { nombre: rol === "admin" ? "Administración" : "Club Deportivo Demo", apellido_paterno: "", email, role: rol },
    });
  }

  if (ruta === "clubs/me" && m === "GET") return json(res, 200, clubes[0]);
  if (ruta === "clubs/deportes" && m === "GET") return json(res, 200, deportes);
  if (ruta === "clubs" && m === "GET") return json(res, 200, pagina(clubes.map(resumen), url));
  if (ruta === "clubs/announcements" && m === "GET") {
    const club = url.searchParams.get("club_id");
    const estado = url.searchParams.get("estado") || "ABIERTA";
    return json(res, 200, pagina(convocatorias.filter((c) => (!club || c.clubId === club) && c.estado === estado).map(conv), url));
  }
  if (p[0] === "payments") {
    if (ruta === "payments/plans") return json(res, 200, []);
    return json(res, 404, { detail: "Sin suscripción (simulado)" });
  }

  // clubs/announcements/:id/applications  y  clubs/announcements/applications/:id
  if (p[0] === "clubs" && p[1] === "announcements") {
    if (p[2] === "applications" && p[3] && m === "PATCH") {
      const app = postulaciones.find((x) => x.id === p[3]);
      if (!app) return json(res, 404, { detail: "No encontrada" });
      app.estado = cuerpo.estado;
      if (cuerpo.comentario !== undefined) app.comentario_club = cuerpo.comentario;
      return json(res, 200, app);
    }
    if (p[3] === "applications" && m === "GET") {
      const c = convocatorias.find((x) => x.id === p[2]);
      if (!c) return json(res, 404, { detail: "No encontrada" });
      const lista = postulaciones.filter((x) => x.convocatoria_id === c.id);
      const conteo = {};
      lista.forEach((x) => { conteo[x.estado] = (conteo[x.estado] || 0) + 1; });
      return json(res, 200, { convocatoria: conv(c), ...pagina(lista, url), conteo_por_estado: conteo });
    }
    const c = convocatorias.find((x) => x.id === p[2]);
    return c ? json(res, 200, conv(c)) : json(res, 404, { detail: "No encontrada" });
  }

  if (p[0] === "clubs" && p[1]) {
    const club = clubes.find((x) => x.id === p[1]);
    if (!club) return json(res, 404, { detail: "Club no encontrado" });
    if (p.length === 2 && m === "GET") {
      return json(res, 200, { ...club, convocatorias_abiertas: convocatorias.filter((c) => c.clubId === club.id && c.estado === "ABIERTA").map((c) => ({ id: c.id, titulo: c.titulo, estado: c.estado })) });
    }
    if (p.length === 2 && m === "PATCH") {
      const ubicacionKeys = ["direccion", "comuna", "provincia", "latitud", "longitud"];
      for (const [k, v] of Object.entries(cuerpo)) {
        if (ubicacionKeys.includes(k)) club.ubicacion[k] = v;
        else if (k === "redes_sociales") club.redes_sociales = Object.fromEntries(Object.entries(v || {}).filter(([, x]) => x));
        else if (k !== "deporte_ids") club[k] = v;
      }
      club.fecha_actualizacion = new Date().toISOString();
      return json(res, 200, club);
    }
    if (p[2] === "deportes" && p[3]) {
      const d = deporte(Number(p[3]));
      if (m === "PUT" && d && !club.deportes.some((x) => x.id === d.id)) club.deportes.push(d);
      if (m === "DELETE") club.deportes = club.deportes.filter((x) => x.id !== Number(p[3]));
      return json(res, 204);
    }
    if (p[2] === "announcements" && m === "POST" && p.length === 3) {
      const nueva = {
        id: uuid(), clubId: club.id, deporte_id: cuerpo.deporte_id, titulo: cuerpo.titulo ?? null, descripcion: cuerpo.descripcion ?? null,
        categoria_edad: cuerpo.categoria_edad, edad_minima: cuerpo.edad_minima ?? null, edad_maxima: cuerpo.edad_maxima ?? null,
        fecha_prueba: cuerpo.fecha_prueba, requisitos: cuerpo.requisitos, cupos: cuerpo.cupos, cupos_disponibles: cuerpo.cupos,
        direccion: cuerpo.direccion, comuna: cuerpo.comuna ?? null, estado: "ABIERTA", fecha_creacion: new Date().toISOString(),
        chat_postulantes_habilitado: cuerpo.chat_postulantes_habilitado === true,
      };
      convocatorias.unshift(nueva);
      return json(res, 201, conv(nueva));
    }
    if (p[2] === "announcements" && p[4] === "close" && m === "POST") {
      const c = convocatorias.find((x) => x.id === p[3]);
      if (c) c.estado = "CERRADA";
      return json(res, 204);
    }
    if (p[2] === "notices") {
      if (m === "GET") return json(res, 200, pagina(avisos.filter((a) => a.club.id === club.id), url));
      if (m === "POST") {
        const aviso = {
          id: uuid(), club: { id: club.id, nombre: club.nombre, logo: club.logo }, titulo: cuerpo.titulo, contenido: cuerpo.contenido,
          audiencia: cuerpo.audiencia, prioridad: cuerpo.prioridad || "NORMAL", fecha_creacion: new Date().toISOString(), destinatarios: postulaciones.length,
        };
        avisos.unshift(aviso);
        return json(res, 201, aviso);
      }
    }
    if (p[2] === "consultas") return json(res, 200, []);
  }

  json(res, 404, { detail: "Ruta no simulada" });
}).listen(PORT, () => console.log(`Gateway simulado en http://localhost:${PORT}  (club@demo.cl / admin@demo.cl, cualquier contraseña)`));