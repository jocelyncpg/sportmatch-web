import Image from "next/image";

// Código QR para descargar la app. La imagen se genera en la página a partir de un enlace real.
// Si todavía no hay enlace, muestra un recuadro vacío en vez de un QR falso.
export default function QrDescarga({ imagen }: { imagen: string }) {
  if (!imagen) {
    return (
      <div className="flex h-36 w-36 shrink-0 self-start items-center justify-center rounded-2xl border-2 border-dashed border-border p-4 text-center text-xs font-semibold text-muted sm:self-auto">
        El código QR aparecerá cuando la app esté publicada
      </div>
    );
  }

  return (
    <div className="shrink-0 self-start rounded-2xl border border-border bg-white p-3 shadow-sm sm:self-auto">
      <Image
        src={imagen}
        alt="Código QR para descargar la app SportMatch"
        width={144}
        height={144}
        unoptimized
        className="h-36 w-36"
      />
    </div>
  );
}