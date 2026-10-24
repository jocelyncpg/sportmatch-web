"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { BotonIniciarSesion } from "./LoginModal";

const ENLACES = [
  { href: "/", label: "Inicio" },
  { href: "#deportes", label: "Descubrir deportes" },
  { href: "#comunidad", label: "Clubes" },
  { href: "#como", label: "Cómo funciona" },
];

const link =
  "whitespace-nowrap rounded-md px-1 py-1 text-[15px] font-semibold text-muted transition-colors hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]";
const btnIngresar =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full border border-text px-5 py-2.5 text-[15px] font-bold text-text transition-colors hover:bg-text hover:text-bg active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]";
const btnRegistro =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#7C3AED] px-5 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[#8B5CF6] active:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

// Logo según el tema (ver .logo-dark / .logo-light en globals.css).
const logo = "h-auto w-[190px] sm:w-[240px]";

export default function NavbarPublica() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg text-text">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="SportMatch, inicio" onClick={cerrar}>
          <Image
            src="/logo-dark.png"
            alt="SportMatch"
            width={300}
            height={56}
            priority
            className={`logo-dark ${logo}`}
          />
          <Image
            src="/logo-light.png"
            alt="SportMatch"
            width={300}
            height={56}
            priority
            className={`logo-light ${logo}`}
          />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 xl:flex"
        >
          {ENLACES.map((e) => (
            <a key={e.label} href={e.href} className={link}>
              {e.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <ThemeToggle compacto />
          <BotonIniciarSesion className={btnIngresar}>
            Iniciar sesión
          </BotonIniciarSesion>
          <a href="#app" className={btnRegistro}>
            Registrarse
          </a>
        </div>

        <button
          type="button"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto((v) => !v)}
          className="rounded-md p-2 text-text hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8B5CF6] xl:hidden"
        >
          {abierto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {abierto ? (
        <div
          id="menu-movil"
          className="border-t border-border bg-bg px-5 pb-6 pt-2 xl:hidden"
        >
          <nav aria-label="Principal móvil" className="flex flex-col">
            {ENLACES.map((e) => (
              <a
                key={e.label}
                href={e.href}
                onClick={cerrar}
                className="border-b border-border py-4 text-base font-semibold text-text"
              >
                {e.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex justify-center">
            <ThemeToggle compacto />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BotonIniciarSesion className={btnIngresar} alAbrir={cerrar}>
              Iniciar sesión
            </BotonIniciarSesion>
            <a href="#app" onClick={cerrar} className={btnRegistro}>
              Registrarse
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}