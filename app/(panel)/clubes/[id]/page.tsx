import { SoloRol } from "@/components/SesionContext";
import DetalleClub from "@/components/club/DetalleClub";

export default function PerfilPublicoPage() {
  return (
    <SoloRol roles={["club"]}>
      <DetalleClub />
    </SoloRol>
  );
}
