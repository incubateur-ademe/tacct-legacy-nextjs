'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  futureExposureColorClass,
  observedExposureColorClass,
  trendIcon,
} from '@/lib/skillsScore';
import { setImpactRevoked } from '@/server/skills-partners/actions';

export type SyntheseImpactItem = {
  id: string;
  description: string;
  thematicIcon: string;
  thematicName: string;
  observedExposure: number;
  futureExposure: number;
  revokedDiagnostic: boolean;
  actionPlan: string;
};

/**
 * Port de `app-synthese-impact-simple`.
 *
 * Ligne compacte : icône colorée par thématique + description + (bouton Ajouter
 * / Retirer si `displayButton`) + chiffres observé/flèche/futur colorés selon
 * les seuils 8/12/16.
 *
 * `displayButton` est vrai pour les impacts non-prioritaires (= `< 8`), où on
 * peut basculer la révocation.
 */
export function SyntheseImpactSimple({
  syntheseImpact,
  displayButton,
}: {
  syntheseImpact: SyntheseImpactItem;
  displayButton: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const futureClass = futureExposureColorClass('synthese', syntheseImpact.futureExposure);
  const observedClass = observedExposureColorClass(
    'synthese',
    syntheseImpact.observedExposure,
    syntheseImpact.futureExposure,
  );
  const arrow = trendIcon(syntheseImpact.observedExposure, syntheseImpact.futureExposure);

  const toggle = () => {
    startTransition(async () => {
      await setImpactRevoked(syntheseImpact.id, !syntheseImpact.revokedDiagnostic);
      router.refresh();
    });
  };

  return (
    <div className="sc-synthese-impacts__row">
      <span className="sc-synthese-impacts__icon-label sc-synthese-impacts__impact-title">
        <em
          className={`c-icon ${futureClass} ${syntheseImpact.thematicIcon}`}
          aria-hidden="true"
        />
        {syntheseImpact.description}
        {displayButton && (
          <button
            type="button"
            className="sc-synthese-impacts__button"
            onClick={toggle}
            disabled={pending}
          >
            {syntheseImpact.revokedDiagnostic ? 'Ajouter' : 'Retirer'}
          </button>
        )}
      </span>
      <span className="sc-synthese-impacts__indicateur">
        <span className={`sc-synthese-impacts__item u-txt-bold ${observedClass}`}>
          {syntheseImpact.observedExposure}
        </span>
        <em className={`c-icon ${arrow} sc-synthese-impacts__item`} aria-hidden="true" />
        <span className={`${futureClass} sc-synthese-impacts__item u-txt-bold`}>
          {syntheseImpact.futureExposure}
        </span>
      </span>
    </div>
  );
}
