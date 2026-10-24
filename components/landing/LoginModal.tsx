"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { login } from "@/lib/auth.mock";

interface Ctx {
  abrir: () => void;
}
const LoginModalCtx = createContext<Ctx>({ abrir: () => {} });
export const useLoginModal = () => useContext(LoginModalCtx);

const input =
  "w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-text outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20";

// Botón que abre el modal de inicio de sesión. Recibe las mismas clases que un enlace o botón.
export function BotonIniciarSesion({
  className,
  children,
  alAbrir,
}: {
  className?: string;
  children: React.ReactNode;
  alAbrir?: () => void;
}) {
  const { abrir } = useLoginModal();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        alAbrir?.();
        abrir();
      }}
    >
      {children}
    </button>
  );
}

export function LoginModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const abrir = useCallback(() => {
    setError("");
    setAbierto(true);
  }, []);
  const cerrar = useCallback(() => setAbierto(false), []);

  // /login y las páginas protegidas redirigen a "/?login=1": abrimos el modal automáticamente.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbierto(true);
      window.history.replaceState(null, "", "/");
    }
  }, []);

  // Sincroniza el estado con el <dialog> nativo (da foco atrapado y cierre con Esc).
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  function cerrarDialogo() {
    dialogo.current?.close();
    document.body.style.overflow = "";
    setAbierto(false);
  }

  // Next conserva la portada oculta al navegar al panel: aseguramos que el modal no quede abierto.
  useEffect(() => {
    const d = dialogo.current;
    return () => {
      d?.close();
      document.body.style.overflow = "";
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, password);
      // Cerramos el modal ANTES de navegar: si queda abierto, bloquea todo el panel.
      cerrarDialogo();
      setPassword("");
      setCargando(false);
      router.replace("/inicio");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión",
      );
      setCargando(false);
    }
  }

  const valor = useMemo(() => ({ abrir }), [abrir]);

  return (
    <LoginModalCtx.Provider value={valor}>
      {children}

      <dialog
        ref={dialogo}
        aria-labelledby="login-titulo"
        onClose={cerrar}
        onClick={(e) => {
          if (e.target === dialogo.current) cerrar();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-card p-0 text-text shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="relative px-6 py-10 sm:px-10">
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded-md p-2 text-muted transition-colors hover:bg-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
          >
            <X size={22} />
          </button>

          <div className="flex justify-center">
            <Image
              src="/logo-dark.png"
              alt="SportMatch"
              width={250}
              height={47}
              className="logo-dark h-auto w-[250px]"
            />
            <Image
              src="/logo-light.png"
              alt="SportMatch"
              width={250}
              height={47}
              className="logo-light h-auto w-[250px]"
            />
          </div>
          <h2
            id="login-titulo"
            className="mt-8 text-center text-3xl font-extrabold tracking-[-0.02em] [font-family:var(--font-titulo)]"
          >
            Inicia sesión
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Panel para clubes y administración
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-text">Correo</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                className={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-text">
                Contraseña
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                className={input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error ? (
              <p role="alert" className="text-sm font-semibold text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-full bg-[#7C3AED] py-3.5 text-base font-bold text-white transition-colors hover:bg-[#8B5CF6] active:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] disabled:opacity-60"
            >
              {cargando ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            ¿Aún no tienes cuenta?{" "}
            <a
              href="#app"
              onClick={cerrar}
              className="font-bold text-text underline underline-offset-4"
            >
              Regístrate desde la app
            </a>
          </p>
          <p className="mt-4 text-center text-xs text-muted">
            Demo: club@sportmatch.cl · demo1234
          </p>
        </div>
      </dialog>
    </LoginModalCtx.Provider>
  );
}