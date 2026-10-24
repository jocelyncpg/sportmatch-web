"use client";

import { SoloRol } from "@/components/SesionContext";
import Canales from "@/components/club/Canales";

export default function Page() {
  return (
    <SoloRol roles={["club"]}>
      <Canales />
    </SoloRol>
  );
}
