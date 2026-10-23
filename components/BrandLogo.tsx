import Image from "next/image";

// Muestra el logo según el modo del sistema (ver .logo-dark / .logo-light en globals.css).
// Los PNG son los mismos de la app (logo-tight-*). La altura se calcula sola para no deformarlos.
export default function BrandLogo({ width = 200 }: { width?: number }) {
  const alto = Math.round(width * (566 / 2590));
  const estilo = { width, height: "auto" } as const;
  return (
    <>
      <Image
        src="/logo-dark.png"
        alt="SportMatch"
        width={width}
        height={alto}
        priority
        className="logo-dark"
        style={estilo}
      />
      <Image
        src="/logo-light.png"
        alt="SportMatch"
        width={width}
        height={alto}
        priority
        className="logo-light"
        style={estilo}
      />
    </>
  );
}