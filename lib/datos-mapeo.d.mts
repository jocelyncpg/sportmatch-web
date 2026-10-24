import type { Club, Convocatoria, Postulante, Aviso } from "./datos";
export function mapClub(club: unknown, id?: string): Club;
export function mapConvocatoria(convocatoria: unknown, clubId?: string): Convocatoria;
export function mapPostulante(postulacion: unknown, convocatoriaId?: string): Postulante;
export function mapAviso(aviso: unknown, clubId: string, convocatoriaId?: string | null): Aviso;
export function instagramAMostrar(valor: string | null | undefined): string;
export function instagramAGuardar(valor: string | null | undefined): string | null;
export function webAGuardar(valor: string | null | undefined): string | null;
export function opcional(valor: string | null | undefined): string | null;
