/**
 * Port de `app-status-account` (Angular legacy).
 * Affiche « En attente de validation » avec une icône d'alerte quand le compte
 * n'est pas validé. Ne s'affiche pas si le user est validé.
 */
export function StatusAccount({ status }: { status: boolean }) {
  if (status) return null;
  return (
    <div className="sc-status-account">
      <em className="c-icon small project-primary status-incomplete mr-2" aria-hidden="true" />
      <span className="c-subtitle-black-bold">En attente de validation</span>
    </div>
  );
}
