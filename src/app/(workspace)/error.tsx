'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';

/**
 * Error boundary des pages du workspace.
 *
 * Sans ce fichier, la moindre exception non rattrapée (server action qui jette,
 * requête Prisma en erreur, rendu serveur cassé) fait tomber Next sur sa page
 * d'erreur générique — « This page couldn't load » — sans header ni menu, et
 * sans aucun moyen de repartir autrement qu'en rechargeant à la main.
 *
 * Ici le layout workspace est conservé (header + menu), l'utilisateur peut
 * relancer le rendu avec `reset()`, et le `digest` — identifiant que Next
 * attribue à l'erreur serveur et qu'on retrouve dans les logs — est affiché
 * pour le support.
 */
export default function WorkspaceError({
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
    <div className="page container">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card o-card__triangle">
            <div className="row">
              <BlockTitleIcon
                className="col-16"
                pageTitle="Une erreur est survenue"
                subtitle="Cette page n'a pas pu être chargée"
                icon="status-incomplete"
              />
            </div>
            <p>
              L&apos;opération n&apos;a pas pu être menée à son terme. Vous pouvez réessayer ; si le
              problème persiste, contactez le support en indiquant le code ci-dessous.
            </p>
            {error.digest && <p className="subtitle">Code d&apos;erreur : {error.digest}</p>}
            <div className="c-group-buttons c-group-buttons--end">
              <Link href="/" className="c-btn--tertiary" title="Retour à l'accueil">
                Retour à l&apos;accueil
              </Link>
              <button type="button" className="c-btn--primary" onClick={reset} title="Réessayer">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
