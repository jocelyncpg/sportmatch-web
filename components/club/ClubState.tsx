export function ClubState({
  cargando,
  error,
  sinClub,
}: {
  cargando: boolean;
  error: string;
  sinClub: boolean;
}) {
  if (cargando) {
    return <p role="status" className="py-8 text-sm text-muted">Cargando información del club…</p>;
  }
  if (error) {
    return <p role="alert" className="rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>;
  }
  if (sinClub) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm">
        Tu cuenta aún no tiene un club. Regístralo desde la app SportMatch.
      </p>
    );
  }
  return null;
}
