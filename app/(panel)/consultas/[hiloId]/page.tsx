"use client";

import { SoloRol } from "@/components/SesionContext";
import ConsultaHilo from "@/components/club/ConsultaHilo";

export default function Page() {
  return (
    <SoloRol roles={["club"]}>
      <ConsultaHilo />
    </SoloRol>
  );
}
