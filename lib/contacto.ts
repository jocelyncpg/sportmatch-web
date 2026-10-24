// Datos de contacto y enlaces de la portada pública.
// PROVISORIO: por ahora llevan a la página principal de cada servicio.
// Cuando existan las cuentas reales, reemplaza cada enlace (o deja "" para ocultar ese icono).
export const CONTACTO = {
  instagram: "https://www.instagram.com", // luego: "https://instagram.com/TU_USUARIO"
  facebook: "https://www.facebook.com", // luego: "https://facebook.com/TU_PAGINA"
  whatsapp: "https://www.whatsapp.com", // luego: "https://wa.me/56912345678" (código de país + número)
  email: "https://mail.google.com", // luego: "mailto:contacto@sportmatch.cl"
  appStore: "", // enlace a la app en App Store
  playStore: "", // enlace a la app en Google Play
  descargaApp: "", // enlace que abre el código QR (por ejemplo, la página de descarga de la app)
} as const;