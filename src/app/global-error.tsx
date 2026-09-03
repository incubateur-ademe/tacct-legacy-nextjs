'use client';

import { useEffect } from 'react';
import '@/styles/main.scss';

/**
 * Filet de sécurité de dernier recours : Next n'utilise ce boundary que si
 * l'erreur survient dans le layout racine lui-même (ou dans une route sans
 * `error.tsx` plus proche). Il remplace tout le document, d'où les balises
 * `<html>`/`<body>` et l'import des styles — le layout racine n'est pas rendu.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="page container">
          <div className="row">
            <div className="col-lg-12 col-md-16">
              <div className="o-card">
                <h1 className="c-title-h1">Une erreur est survenue</h1>
                <p>
                  L&apos;application n&apos;a pas pu afficher cette page. Vous pouvez réessayer ; si
                  le problème persiste, contactez le support en indiquant le code ci-dessous.
                </p>
                {error.digest && <p className="subtitle">Code d&apos;erreur : {error.digest}</p>}
                <div className="c-group-buttons c-group-buttons--end">
                  <button
                    type="button"
                    className="c-btn--primary"
                    onClick={reset}
                    title="Réessayer"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
