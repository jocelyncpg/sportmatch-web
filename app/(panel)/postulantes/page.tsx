import { SoloRol } from "@/components/SesionContext";
import PostulantesClub from "@/components/club/PostulantesClub";

export default function PostulantesPage() {
  return (
    <SoloRol roles={["club"]}>
      <PostulantesClub />
    </SoloRol>
  );
}
