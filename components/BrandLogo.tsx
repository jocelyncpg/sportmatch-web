import Image from "next/image";

// Muestra el logo según el modo del sistema (ver .logo-dark / .logo-light en globals.css).
export default function BrandLogo({ width = 200 }: { width?: number }) {
  const alto = Math.round(width * (390 / 1600));
  return (
    <>
      <Image
        src="/logo-dark.png"
        alt="SportMatch"
        width={width}
        height={alto}
        priority
        className="logo-dark"
      />
      <Image
        src="/logo-light.png"
        alt="SportMatch"
        width={width}
        height={alto}
        priority
        className="logo-light"
      />
    </>
  );
}