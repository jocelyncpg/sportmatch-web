import { SoloRol } from "@/components/SesionContext";
import PerfilClub from "@/components/club/PerfilClub";

export default function MiClubPage() {
  return (
    <SoloRol roles={["club"]}>
      <PerfilClub />
    </SoloRol>
  );
}
