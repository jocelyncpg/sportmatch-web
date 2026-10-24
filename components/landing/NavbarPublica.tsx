"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BotonIniciarSesion } from "./LoginModal";

const ENLACES = [
  { href: "/", label: "Inicio" },
  { href: "#deportes", label: "Descubrir deportes" },
  { href: "#comunidad", label: "Clubes" },
  { href: "#como", label: "Cómo funciona" },
];

const link =
  "rounded-md px-1 py-1 text-base font-semibold text-slate-700 transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]";
const btnIngresar =
  "inline-flex items-center justify-center rounded-full border border-slate-900 px-7 py-3 text-base font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white active:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]";
const btnRegistro =
  "inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-7 py-3 text-base font-bold text-white transition-colors hover:bg-[#8B5CF6] active:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

export default function NavbarPublica() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="SportMatch, inicio" onClick={cerrar}>
          <Image
            src="/logo-light.png"
            alt="SportMatch"
            width={300}
            height={56}
            priority
            className="h-auto w-[190px] sm:w-[290px]"
          />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-9 xl:flex"
        >
          {ENLACES.map((e) => (
            <a key={e.label} href={e.href} className={link}>
              {e.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
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
          className="rounded-md p-2 text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8B5CF6] xl:hidden"
        >
          {abierto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {abierto ? (
        <div
          id="menu-movil"
          className="border-t border-slate-200 bg-white px-5 pb-6 pt-2 xl:hidden"
        >
          <nav aria-label="Principal móvil" className="flex flex-col">
            {ENLACES.map((e) => (
              <a
                key={e.label}
                href={e.href}
                onClick={cerrar}
                className="border-b border-slate-200 py-4 text-base font-semibold text-slate-900"
              >
                {e.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3">
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