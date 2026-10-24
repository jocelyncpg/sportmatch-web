import { SoloRol } from "@/components/SesionContext";
import ConvocatoriasClub from "@/components/club/ConvocatoriasClub";

export default function ConvocatoriasPage() {
  return (
    <SoloRol roles={["club"]}>
      <ConvocatoriasClub />
    </SoloRol>
  );
}
