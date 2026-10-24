"use client";

import { SoloRol } from "@/components/SesionContext";
import Consultas from "@/components/club/Consultas";

export default function Page() {
  return (
    <SoloRol roles={["club"]}>
      <Consultas />
    </SoloRol>
  );
}
