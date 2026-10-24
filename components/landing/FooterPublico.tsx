import { Mail } from "lucide-react";
import { CONTACTO } from "@/lib/contacto";
import AnioActual from "./AnioActual";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./IconosRedes";

const icono =
  "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#7C3AED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function FooterPublico() {
  return (
    <footer className="bg-[#0B0F19] text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-14 text-center sm:px-8 sm:py-16">
        <p className="text-2xl font-extrabold uppercase leading-none tracking-[0.04em] [font-family:var(--font-titulo)] sm:text-4xl">
          Conecta<span className="px-2.5 text-[#8B5CF6]">·</span>Entrena
          <span className="px-2.5 text-[#8B5CF6]">·</span>Comparte
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          {CONTACTO.instagram ? (
            <a
              href={CONTACTO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de SportMatch"
              className={icono}
            >
              <InstagramIcon size={22} />
            </a>
          ) : null}
          {CONTACTO.facebook ? (
            <a
              href={CONTACTO.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de SportMatch"
              className={icono}
            >
              <FacebookIcon size={22} />
            </a>
          ) : null}
          {CONTACTO.whatsapp ? (
            <a
              href={CONTACTO.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escríbenos por WhatsApp"
              className={icono}
            >
              <WhatsAppIcon size={22} />
            </a>
          ) : null}
          {CONTACTO.email ? (
            <a
              href={CONTACTO.email}
              aria-label="Escríbenos por correo"
              className={icono}
            >
              <Mail size={22} />
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-6 text-center text-sm text-white/50 sm:px-8">
          © <AnioActual /> SportMatch. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}