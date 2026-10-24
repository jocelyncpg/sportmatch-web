import { SoloRol } from "@/components/SesionContext";
import AvisosClub from "@/components/club/AvisosClub";

export default function AvisosPage() {
  return (
    <SoloRol roles={["club"]}>
      <AvisosClub />
    </SoloRol>
  );
}
