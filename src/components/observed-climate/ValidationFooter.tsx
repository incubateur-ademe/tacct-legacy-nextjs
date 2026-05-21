/**
 * Port de `app-validation` (Angular legacy) : footer fixé en bas de page avec
 * un bouton plein-largeur de validation (« VALIDER L'EXPOSITION », etc.).
 *
 * Utilise un `<form action>` côté serveur pour ne pas être un client component
 * — l'action Server est passée en prop par la page parente.
 */
export function ValidationFooter({
  label,
  action,
}: {
  label: string;
  action: () => Promise<void> | void;
}) {
  return (
    <footer className="sc-validation-footer">
      <div className="o-section--right__body">
        <div className="o-centred-elements d-flex">
          <form action={action} className="ml-auto">
            <button
              type="submit"
              className="ml-auto mr-0 c-btn--primary sc-button__validation"
            >
              {label}
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
