"use client";

import { SoloRol } from "@/components/SesionContext";
import CanalDetalle from "@/components/club/CanalDetalle";

export default function Page() {
  return (
    <SoloRol roles={["club"]}>
      <CanalDetalle />
    </SoloRol>
  );
}
