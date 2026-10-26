const fechaCorta = (value) => typeof value === "string" ? value.slice(0, 10) : "";
// La API entrega fecha_prueba en UTC (…Z): cortar el texto daría otro día después de las 21:00 en Chile.
const diaLocal = (value) => {
  if (typeof value !== "string") return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return fechaCorta(value);
  const dos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
};

export function mapClub(club, id = club.id) {
  return {
    id,
    nombre: club.nombre ?? "",
    descripcion: club.descripcion ?? club.descripcion_corta ?? "",
    zona: club.ubicacion?.comuna ?? club.comuna ?? "",
    deportes: (club.deportes ?? []).map((deporte) => typeof deporte === "string" ? deporte : deporte.nombre),
    email: club.email_contacto ?? "",
    telefono: club.telefono ?? "",
    instagram: instagramAMostrar(club.redes_sociales?.instagram),
    web: club.sitio_web ?? "",
    logoUrl: club.logo ?? "",
    portadaUrl: club.portada ?? "",
    direccion: club.ubicacion?.direccion ?? club.direccion ?? "",
    latitud: club.ubicacion?.latitud ?? null,
    longitud: club.ubicacion?.longitud ?? null,
  };
}

export function mapConvocatoria(convocatoria, clubId = convocatoria.club?.id ?? "") {
  return {
    id: convocatoria.id,
    clubId,
    titulo: convocatoria.titulo ?? "",
    deporte: convocatoria.deporte?.nombre ?? "",
    categoria: convocatoria.categoria_edad ?? "",
    fecha: diaLocal(convocatoria.fecha_prueba),
    requisitos: (convocatoria.requisitos ?? []).join(", "),
    cupos: convocatoria.cupos ?? 0,
    estado: convocatoria.estado === "ABIERTA" ? "abierta" : "cerrada",
    chatPostulantes: convocatoria.chat_postulantes_habilitado === true,
  };
}

export function mapPostulante(postulacion, convocatoriaId = "") {
  const perfil = postulacion.perfil_deportivo ?? {};
  const niveles = (perfil.deportes ?? []).map((deporte) => Number(deporte.nivel) || 0);
  const nivel = Math.max(0, ...niveles);
  const nombre = `${perfil.nombre ?? ""} ${perfil.apellido_inicial ? `${perfil.apellido_inicial}.` : ""}`.trim();
  const estados = { PENDIENTE: "Pendiente", PRESELECCIONADO: "Preseleccionado", EN_ESPERA: "En espera", ACEPTADO: "Aceptado", RECHAZADO: "Rechazado" };
  return {
    id: postulacion.id,
    usuarioId: postulacion.usuario_id ?? "",
    convocatoriaId,
    nombre,
    edad: perfil.edad ?? 0,
    nivel: nivel >= 4 ? "Avanzado" : nivel >= 3 ? "Intermedio" : "Principiante",
    comuna: "",
    estado: estados[postulacion.estado] ?? "Pendiente",
    fechaPostulacion: fechaCorta(postulacion.fecha_postulacion),
    deportes: (perfil.deportes ?? []).map((deporte) => deporte.deporte_codigo),
    bio: perfil.biografia ?? "",
    disponibilidad: "",
    objetivo: postulacion.mensaje ?? "",
    rating: 0,
    resenas: 0,
    foto: perfil.foto_perfil ?? "",
  };
}

export function mapAviso(aviso, clubId, convocatoriaId = null) {
  return {
    id: aviso.id,
    clubId,
    convocatoriaId,
    titulo: aviso.titulo,
    mensaje: aviso.contenido,
    fecha: aviso.fecha_creacion,
  };
}

// El formulario usa "@usuario"; Ms-club guarda el enlace https://instagram.com/usuario.
export function instagramAMostrar(valor) {
  if (!valor) return "";
  const usuario = /^https:\/\/(?:www\.)?instagram\.com\/([^/?#]+)/i.exec(valor);
  return usuario ? `@${usuario[1]}` : valor;
}

export function instagramAGuardar(valor) {
  const texto = (valor ?? "").trim();
  if (!texto) return null;
  if (/^https:\/\//i.test(texto)) return texto;
  const sinPrefijo = texto.replace(/^@/, "").replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, "");
  return `https://instagram.com/${sinPrefijo}`;
}

// Ms-club exige http(s):// en el sitio web; si falta se asume https.
export function webAGuardar(valor) {
  const texto = (valor ?? "").trim();
  if (!texto) return null;
  return /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
}

// Campos opcionales: vacío se envía como null para que el backend lo acepte (o lo borre).
export function opcional(valor) {
  const texto = (valor ?? "").trim();
  return texto ? texto : null;
}