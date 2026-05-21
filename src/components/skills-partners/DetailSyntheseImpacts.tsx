'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CompetenceForm } from './CompetenceForm';
import {
  futureExposureColorClass,
  observedExposureColorClass,
  trendIcon,
} from '@/lib/skillsScore';
import { setImpactRevoked } from '@/server/skills-partners/actions';

export type DetailSyntheseImpactItem = {
  id: string;
  description: string;
  thematicIcon: string;
  thematicName: string;
  actionPlan: string;
  observedExposure: number;
  futureExposure: number;
  revokedDiagnostic: boolean;
};

/**
 * Port de `app-detail-synthese-impacts`.
 *
 * Card par impact prioritaire (non révoqué) :
 *  – Header : icône colorée + description + thematic name + actionPlan + chiffres
 *    observé/flèche/futur en haut à droite.
 *  – Si `futureExposure < 8` : bouton "Retirer" (à droite, dans le header).
 *  – Form (`bg-secondary-very-light`) : lignes compétence + autres organismes,
 *    avec ajout automatique d'une nouvelle ligne quand la dernière est remplie
 *    (cf. `CompetenceForm`).
 */
export function DetailSyntheseImpacts({
  syntheseImpact,
  skills,
  initialCompetences,
}: {
  syntheseImpact: DetailSyntheseImpactItem;
  skills: { id: string; label: string }[];
  initialCompetences: { id: string; skillTerritoryId: string; otherOrganization: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (syntheseImpact.revokedDiagnostic) return null;

  const futureClass = futureExposureColorClass('detail', syntheseImpact.futureExposure);
  const observedClass = observedExposureColorClass(
    'detail',
    syntheseImpact.observedExposure,
    syntheseImpact.futureExposure,
  );
  const arrow = trendIcon(syntheseImpact.observedExposure, syntheseImpact.futureExposure);

  const revoke = () => {
    startTransition(async () => {
      await setImpactRevoked(syntheseImpact.id, true);
      router.refresh();
    });
  };

  return (
    <div className="o-card sc-detail-synthese-impacts__item">
      <div className="sc-detail-synthese-impacts__header">
        <em
          className={`c-icon ${syntheseImpact.thematicIcon} u-margin__right ${futureClass}`}
          aria-hidden="true"
        />
        <div className="sc-detail-synthese-impacts__header-content">
          <div className="row flex-column">
            <span className="u-txt-bold">{syntheseImpact.description}</span>
            <span className="sc-detail-synthese-impacts__sub-info u-margin__bottom">
              {syntheseImpact.thematicName}
            </span>
          </div>
          <span className="sc-detail-synthese-impacts__sub-info u-txt-small">
            Politiques, actions, projets existants sur le territoire
          </span>
          <span>{syntheseImpact.actionPlan || '-'}</span>
        </div>

        <span className="sc-detail-synthese-impacts__indicateurs">
          <span className={`u-txt-bold ${observedClass}`}>
            {syntheseImpact.observedExposure}
          </span>
          <em
            className={`c-icon ${arrow} sc-detail-synthese-impacts__indicateur`}
            aria-hidden="true"
          />
          <span className={`${futureClass} u-txt-bold`}>
            {syntheseImpact.futureExposure}
          </span>
        </span>

        {syntheseImpact.futureExposure < 8 && (
          <div className="c-group-buttons">
            <button
              type="button"
              className="sc-detail-synthese-impacts__btn-revoked"
              onClick={revoke}
              disabled={pending}
            >
              Retirer
            </button>
          </div>
        )}
      </div>

      <CompetenceForm
        impactId={syntheseImpact.id}
        skills={skills}
        initial={initialCompetences}
      />
    </div>
  );
}
