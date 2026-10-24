import { Check } from "lucide-react";
import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import FooterPublico from "@/components/landing/FooterPublico";
import { LoginModalProvider } from "@/components/landing/LoginModal";
import MapaInteractivo from "@/components/landing/MapaInteractivo";
import NavbarPublica from "@/components/landing/NavbarPublica";
import PantallaCarga from "@/components/landing/PantallaCarga";
import QrDescarga from "@/components/landing/QrDescarga";
import TelefonosApp from "@/components/landing/TelefonosApp";
import RedirigirSiHaySesion from "@/components/RedirigirSiHaySesion";
import { CONTACTO } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "SportMatch · Conecta, entrena y comparte",
  description:
    "Encuentra personas con tus mismos deportes, nivel y ganas de superarse. Descubre actividades y clubes deportivos.",
};

// Tipografía de la portada: Barlow Condensed (deportiva) para títulos, Inter para texto.
const fuenteTitulo = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-titulo",
  display: "swap",
});
const fuenteTexto = Inter({
  subsets: ["latin"],
  variable: "--font-texto",
  display: "swap",
});

const titulo = "[font-family:var(--font-titulo)]";

// Fotografías de Unsplash (licencia libre, sin atribución obligatoria), guardadas en
// public/images/sports/ y optimizadas. No dependen de ningún servidor externo.
// "span" es el ancho en el mosaico (de 12 columnas): las filas suman 12 y alternan,
// así el mosaico no queda como una cuadrícula pareja.
const DEPORTES = [
  {
    nombre: "Running",
    foto: "/images/sports/running.jpg",
    pos: "50% 50%",
    span: "lg:col-span-5",
  },
  {
    nombre: "Ciclismo",
    foto: "/images/sports/cycling.jpg",
    pos: "55% 45%",
    span: "lg:col-span-7",
  },
  {
    nombre: "Escalada",
    foto: "/images/sports/climbing.jpg",
    pos: "50% 40%",
    span: "lg:col-span-7",
  },
  {
    nombre: "Fútbol",
    foto: "/images/sports/football.jpg",
    pos: "50% 45%",
    span: "lg:col-span-5",
  },
  {
    nombre: "Entrenamiento funcional",
    foto: "/images/sports/functional-training.jpg",
    pos: "70% 55%",
    span: "lg:col-span-5",
  },
  {
    nombre: "Yoga",
    foto: "/images/sports/yoga.jpg",
    pos: "50% 55%",
    span: "lg:col-span-7",
  },
];

const CRITERIOS = ["Deporte", "Nivel", "Distancia", "Disponibilidad"];

const PASOS = [
  {
    titulo: "Crea tu perfil deportivo",
    texto:
      "Cuéntanos qué deportes practicas, tu nivel, tus objetivos y cuándo puedes entrenar.",
  },
  {
    titulo: "Descubre tu match",
    texto:
      "Encuentra personas compatibles según tus deportes, nivel, ubicación y disponibilidad.",
  },
  {
    titulo: "Conecta y entrena",
    texto:
      "Conversa, coordina tu próximo entrenamiento y comparte tu pasión por el deporte.",
  },
];

const btnPrimario =
  "inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#8B5CF6] active:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]";
const btnSecundario =
  "inline-flex items-center justify-center rounded-full border-2 border-slate-900 px-8 py-4 text-base font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white active:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]";

export default async function Portada() {
  const hayTiendas = Boolean(CONTACTO.appStore || CONTACTO.playStore);
  const enlaceQr =
    CONTACTO.descargaApp || CONTACTO.appStore || CONTACTO.playStore;
  const imagenQr = enlaceQr
    ? await QRCode.toDataURL(enlaceQr, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 360,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      })
    : "";

  return (
    <div
      className={`forzar-claro ${fuenteTitulo.variable} ${fuenteTexto.variable} [font-family:var(--font-texto)]`}
    >
      <LoginModalProvider>
        <div className="bg-white text-slate-900">
          <PantallaCarga />
          <RedirigirSiHaySesion />
          <NavbarPublica />

          <main>
            {/* 1. Hero */}
            <section className="bg-white text-slate-900">
              <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:py-16">
                <div className="lg:col-span-6">
                  <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#7C3AED] sm:text-base">
                    Conecta · Entrena · Comparte
                  </p>
                  <h1
                    className={`${titulo} text-5xl font-extrabold uppercase leading-[0.95] tracking-[-0.005em] sm:text-6xl xl:text-7xl`}
                  >
                    Encuentra con quién entrenar
                  </h1>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600">
                    Personas con tu deporte, tu nivel y tus ganas.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <a href="#app" className={btnPrimario}>
                      Encuentra tu match
                    </a>
                    <a href="#deportes" className={btnSecundario}>
                      Explorar deportes
                    </a>
                  </div>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:col-span-6">
                  <Image
                    src="/images/sports/hero-cycling.jpg"
                    alt="Grupo de ciclistas compitiendo en ruta"
                    fill
                    priority
                    quality={90}
                    sizes="(min-width: 1024px) 600px, 100vw"
                    className="object-cover object-[50%_40%]"
                  />
                </div>
              </div>
            </section>

            {/* 3. Deportes */}
            <section
              id="deportes"
              className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
            >
              <h2
                className={`${titulo} max-w-2xl text-3xl font-extrabold uppercase leading-[1] tracking-[0.005em] sm:text-4xl lg:text-5xl`}
              >
                Encuentra tu próximo desafío
              </h2>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Más deportes, más personas con quienes practicarlos.
              </p>

              <ul className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
                {DEPORTES.map((d) => (
                  <li
                    key={d.nombre}
                    className={`group relative h-64 overflow-hidden rounded-2xl bg-slate-200 sm:h-72 lg:h-[380px] ${d.span}`}
                  >
                    <Image
                      src={d.foto}
                      alt=""
                      fill
                      quality={90}
                      sizes="(min-width: 1024px) 58vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ objectPosition: d.pos }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                    <p
                      className={`${titulo} absolute bottom-5 left-6 right-6 text-2xl font-extrabold tracking-tight text-white sm:text-3xl`}
                    >
                      {d.nombre}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* 4. Matches */}
            <section className="border-y border-slate-200 bg-slate-50">
              <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
                <div className="lg:col-span-6">
                  <h2
                    className={`${titulo} text-3xl font-extrabold uppercase leading-[1] tracking-[0.005em] sm:text-4xl lg:text-5xl`}
                  >
                    No tienes que entrenar solo
                  </h2>
                  <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
                    SportMatch te muestra personas compatibles contigo. Tú
                    decides con quién conectar y cuándo salir a entrenar.
                  </p>
                  <ul className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
                    {CRITERIOS.map((c) => (
                      <li
                        key={c}
                        className="flex items-center justify-between py-4 text-base font-semibold"
                      >
                        <span>Compatibles por {c.toLowerCase()}</span>
                        <Check
                          size={18}
                          strokeWidth={3}
                          className="text-[#7C3AED]"
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-6">
                  <MapaInteractivo />
                </div>
              </div>
            </section>

            {/* 5. Cómo funciona */}
            <section
              id="como"
              className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
            >
              <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <h2
                    className={`${titulo} text-3xl font-extrabold uppercase leading-[1] tracking-[0.005em] sm:text-4xl lg:text-5xl`}
                  >
                    Ok… pero ¿cómo funciona?
                  </h2>
                  <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                    Encontrar a alguien con quien entrenar nunca fue tan fácil.
                    SportMatch te ayuda a conectar con personas que comparten tus
                    deportes, tu nivel y tus ganas de superarse.
                  </p>
                  <ol className="mt-10 space-y-8">
                    {PASOS.map((p, i) => (
                      <li key={p.titulo} className="flex gap-5">
                        <span
                          className={`${titulo} w-14 shrink-0 text-5xl font-black leading-none text-[#7C3AED]`}
                        >
                          0{i + 1}
                        </span>
                        <div className="border-t-2 border-slate-900 pt-3">
                          <h3
                            className={`${titulo} text-2xl font-bold leading-snug`}
                          >
                            {p.titulo}
                          </h3>
                          <p className="mt-2 leading-relaxed text-slate-600">
                            {p.texto}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="lg:col-span-7">
                  <TelefonosApp />
                </div>
              </div>
            </section>

            {/* 6. Clubes y comunidad */}
            <section
              id="comunidad"
              className="scroll-mt-24 bg-[#0B0F19] text-white"
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-[320px] lg:min-h-[520px]">
                  <Image
                    src="/images/sports/community-track.jpg"
                    alt="Atleta en la línea de partida de una pista"
                    fill
                    quality={90}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-[50%_40%]"
                  />
                </div>
                <div className="flex flex-col justify-center px-5 py-16 sm:px-8 lg:pl-16 lg:pr-[max(2rem,calc((100vw-80rem)/2+2rem))]">
                  <h2
                    className={`${titulo} text-3xl font-extrabold uppercase leading-[1] tracking-[0.005em] sm:text-4xl lg:text-5xl`}
                  >
                    Encuentra tu comunidad
                  </h2>
                  <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
                    Descubre clubes, actividades y grupos deportivos de tu zona,
                    y súmate a pruebas y entrenamientos abiertos.
                  </p>
                  <div className="mt-9">
                    <Link href="/clubes" className={btnPrimario}>
                      Explorar clubes
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* La app / registro */}
            <section
              id="app"
              className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
            >
              <div className="grid items-center gap-8 lg:grid-cols-2">
                <h2
                  className={`${titulo} text-3xl font-extrabold uppercase leading-[1] tracking-[0.005em] sm:text-4xl lg:text-5xl`}
                >
                  Crea tu cuenta desde la app SportMatch
                </h2>
                <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                  <QrDescarga imagen={imagenQr} />
                  <div>
                    <p className="text-lg leading-relaxed text-slate-600">
                      Tu perfil, tus matches y el chat viven en la app.{" "}
                      {enlaceQr ? "Escanea el código" : "Descárgala"}, regístrate
                      y empieza a encontrar con quién entrenar.
                    </p>
                    {hayTiendas ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {CONTACTO.appStore ? (
                          <a
                            href={CONTACTO.appStore}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-bold text-white hover:bg-black"
                          >
                            Descargar en App Store
                          </a>
                        ) : null}
                        {CONTACTO.playStore ? (
                          <a
                            href={CONTACTO.playStore}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-bold text-white hover:bg-black"
                          >
                            Descargar en Google Play
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-6 inline-block rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
                        Próximamente en App Store y Google Play
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Llamada a la acción */}
            <section className="border-t-4 border-[#7C3AED] bg-[#0B0F19] text-white">
              <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-20 sm:px-8 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <h2
                    className={`${titulo} text-3xl font-extrabold uppercase leading-[1] tracking-[0.005em] sm:text-4xl lg:text-5xl`}
                  >
                    Tu próxima historia deportiva empieza aquí.
                  </h2>
                  <p className="mt-5 text-lg text-slate-300">
                    Conecta con personas que comparten tus ganas de moverte.
                  </p>
                </div>
                <a href="#app" className={`${btnPrimario} shrink-0`}>
                  Únete a SportMatch
                </a>
              </div>
            </section>
          </main>

          <FooterPublico />
        </div>
      </LoginModalProvider>
    </div>
  );
}