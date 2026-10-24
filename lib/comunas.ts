// Coordenadas aproximadas (centro de cada comuna) para dibujar los mapas.
// Mapa de ejemplo: cuando exista el endpoint de clubes, se usa la latitud/longitud real de cada club.
export const COMUNAS: Record<string, [number, number]> = {
    Santiago: [-33.4489, -70.6693],
    Providencia: [-33.4314, -70.6093],
    "Las Condes": [-33.4081, -70.5675],
    Vitacura: [-33.3900, -70.5700],
    Ñuñoa: [-33.4569, -70.5975],
    Macul: [-33.4880, -70.5990],
    Peñalolén: [-33.4850, -70.5300],
    "La Florida": [-33.5230, -70.5990],
    Maipú: [-33.5107, -70.7575],
  };
  
  export const CENTRO_SANTIAGO: [number, number] = [-33.4569, -70.6483];