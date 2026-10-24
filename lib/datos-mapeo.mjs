const fechaCorta = (value) => typeof value === "string" ? value.slice(0, 10) : "";

export function mapClub(club, id = club.id) {
  return {
    id,
    nombre: club.nombre ?? "",
    descripcion: club.descripcion ?? club.descripcion_corta ?? "",
    zona: club.ubicacion?.comuna ?? club.comuna ?? "",
    deportes: (club.deportes ?? []).map((deporte) => typeof deporte === "string" ? deporte : deporte.nombre),
    email: club.email_contacto ?? "",
    telefono: club.telefono ?? "",
    instagram: club.redes_sociales?.instagram ?? "",
    web: club.sitio_web ?? "",
    logoUrl: club.logo ?? "",
  };
}

export function mapConvocatoria(convocatoria, clubId = convocatoria.club?.id ?? "") {
  return {
    id: convocatoria.id,
    clubId,
    titulo: convocatoria.titulo ?? "",
    deporte: convocatoria.deporte?.nombre ?? "",
    categoria: convocatoria.categoria_edad ?? "",
    fecha: fechaCorta(convocatoria.fecha_prueba),
    requisitos: (convocatoria.requisitos ?? []).join(", "),
    cupos: convocatoria.cupos ?? 0,
    estado: convocatoria.estado === "ABIERTA" ? "abierta" : "cerrada",
  };
}

export function mapPostulante(postulacion, convocatoriaId = "") {
  const perfil = postulacion.perfil_deportivo ?? {};
  const niveles = (perfil.deportes ?? []).map((deporte) => Number(deporte.nivel) || 0);
  const nivel = Math.max(0, ...niveles);
  const nombre = `${perfil.nombre ?? ""} ${perfil.apellido_inicial ? `${perfil.apellido_inicial}.` : ""}`.trim();
  const estados = { PENDIENTE: "Pendiente", PRESELECCIONADO: "Preseleccionado", ACEPTADO: "Aceptado", RECHAZADO: "Rechazado" };
  return {
    id: postulacion.id,
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
