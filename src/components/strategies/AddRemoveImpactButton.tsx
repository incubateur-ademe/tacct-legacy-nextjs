'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setImpactStudied } from '@/server/strategies/actions';

/**
 * Bouton « Ajouter / Retirer » d'un impact non prioritaire (port de
 * `revokeImpact` du legacy synthese-impact). À l'ajout, on redirige vers la
 * liste des impacts étudiés ; au retrait, on reste sur place.
 */
export function AddRemoveImpactButton({
  impactId,
  studied,
}: {
  impactId: string;
  studied: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : '';

  const toggle = () => {
    startTransition(async () => {
      await setImpactStudied(impactId, !studied);
      if (!studied) {
        router.push(`/workspace/impacts${suffix}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      className="sc-synthese-impact__button"
      onClick={toggle}
      disabled={isPending}
    >
      {studied ? 'Retirer' : 'Ajouter'}
    </button>
  );
}
