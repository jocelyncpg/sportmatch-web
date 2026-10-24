import Image from "next/image";

// Capturas reales de la app SportMatch dentro de marcos de teléfono.
// Las imágenes están en public/app/ (descubrir.jpg y match.jpg), sin la barra de estado del celular.
function Telefono({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`w-[170px] shrink-0 rounded-[2.2rem] bg-slate-900 p-[7px] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.5)] sm:w-[230px] sm:rounded-[2.7rem] sm:p-2 lg:w-[250px] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={720}
        height={1436}
        quality={90}
        sizes="(min-width: 1024px) 250px, (min-width: 640px) 230px, 170px"
        className="h-auto w-full rounded-[1.8rem] sm:rounded-[2.2rem]"
      />
    </div>
  );
}

export default function TelefonosApp() {
  return (
    <div className="flex items-start justify-center py-6 sm:py-10">
      <Telefono
        src="/app/descubrir.jpg"
        alt="Pantalla Descubrir de la app SportMatch: una persona sugerida con su deporte, nivel y compatibilidad"
        className="mt-10 -rotate-6 sm:mt-14"
      />
      <Telefono
        src="/app/match.jpg"
        alt="Pantalla de la app SportMatch que avisa que es un match y permite enviar un mensaje"
        className="-ml-10 rotate-6 sm:-ml-14"
      />
    </div>
  );
}