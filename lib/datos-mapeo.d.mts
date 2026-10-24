import type { Club, Convocatoria, Postulante, Aviso } from "./datos";
export function mapClub(club: unknown, id?: string): Club;
export function mapConvocatoria(convocatoria: unknown, clubId?: string): Convocatoria;
export function mapPostulante(postulacion: unknown, convocatoriaId?: string): Postulante;
export function mapAviso(aviso: unknown, clubId: string, convocatoriaId?: string | null): Aviso;
