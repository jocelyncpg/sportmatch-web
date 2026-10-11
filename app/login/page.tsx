"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { login } from "@/lib/auth.mock";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, password);
      router.replace("/inicio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  const input =
    "w-full rounded-[13px] border border-border bg-input px-3.5 py-3 text-sm outline-none focus:border-accent";

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-5/12 shrink-0 lg:block">
        <Image
          src="/login-bg.png"
          alt=""
          fill
          priority
          sizes="42vw"
          className="object-cover object-[50%_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <p className="absolute bottom-10 left-10 text-2xl font-extrabold tracking-wide text-white">
          Conecta · Entrena · Comparte
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <BrandLogo width={220} />
          <p className="text-sm text-muted">Panel para clubes y administración</p>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted">Correo</span>
            <input
              type="email"
              required
              autoComplete="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted">Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-[13px] bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>

          <p className="text-center text-xs text-muted">
            Demo: club@sportmatch.cl · demo1234
          </p>
        </form>
      </div>
    </main>
  );
}