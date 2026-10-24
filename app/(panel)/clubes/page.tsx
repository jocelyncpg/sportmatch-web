import { SoloRol } from "@/components/SesionContext";
import DirectorioClubes from "@/components/club/DirectorioClubes";

export default function DirectorioPage() {
  return (
    <SoloRol roles={["club"]}>
      <DirectorioClubes />
    </SoloRol>
  );
}
