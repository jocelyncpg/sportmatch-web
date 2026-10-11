// MOCK de autenticación. Solo para desarrollo local.
// Cuando el Gateway esté listo, reemplazar login() por una llamada a su endpoint
// y NO subir este archivo a main.

export type Rol = "club" | "admin";

export interface Sesion {
  nombre: string;
  email: string;
  rol: Rol;
}

const CLAVE = "sportmatch_web_sesion";

const USUARIOS: (Sesion & { password: string })[] = [
  { nombre: "Club Demo", email: "club@sportmatch.cl", password: "demo1234", rol: "club" },
  { nombre: "Administración", email: "admin@sportmatch.cl", password: "demo1234", rol: "admin" },
];

export async function login(email: string, password: string): Promise<Sesion> {
  await new Promise((r) => setTimeout(r, 400));
  const u = USUARIOS.find(
    (x) => x.email === email.trim().toLowerCase() && x.password === password
  );
  if (!u) throw new Error("Correo o contraseña incorrectos");
  const { password: _omit, ...sesion } = u;
  void _omit;
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
  return sesion;
}

export function getSesion(): Sesion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(CLAVE);
}