import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getDiagnosedImpactsForStudy } from '@/server/strategies/queries';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { AddRemoveImpactButton } from '@/components/strategies/AddRemoveImpactButton';

export const dynamic = 'force-dynamic';

const MIN_FUTURE_EXPOSURE = 8;

type SearchParams = Promise<{ study?: string }>;
type Diagnosed = Awaited<ReturnType<typeof getDiagnosedImpactsForStudy>>[number];

type Synthese = {
  id: string;
  description: string;
  thematicIcon: string;
  observedExposure: number;
  futureExposure: number;
  trendIcon: string;
  strategyStudied: boolean;
};

export default async function ChooseImpactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/');

  const impacts = await getDiagnosedImpactsForStudy(study.id);
  const syntheses = impacts.map(toSynthese).sort((a, b) => b.futureExposure - a.futureExposure);

  const priority = syntheses.filter((s) => s.futureExposure >= MIN_FUTURE_EXPOSURE);
  const notPriority = syntheses.filter((s) => s.futureExposure < MIN_FUTURE_EXPOSURE);

  const suffix = studyIdParam ? `?study=${studyIdParam}` : '';

  return (
    <ContentLayout helpKey="impacts-choose">
      <div className="sc-choose-impacts">
        <div className="o-card u-margin__bottom--m">
          <div className="row">
            <BlockTitleIcon
              pageTitle="Choisir un impact prioritaire à étudier"
              subtitle="Construire des stratégies"
              icon="cible"
            />
          </div>
          <span className="c-legend">Sélectionnez un impact étudié dans votre diagnostic</span>

          <div className="sc-choose-impacts__list u-margin__top--m">
            {priority.map((s) => (
              <SyntheseImpactRow key={s.id} impact={s} displayButton={false} />
            ))}
          </div>
          <div className="sc-choose-impacts__list">
            {notPriority.map((s) => (
              <SyntheseImpactRow key={s.id} impact={s} displayButton />
            ))}
          </div>

          <div className="sc-choose-impacts__separate">
            <div className="sc-choose-impacts__separate-or">OU</div>
            <div className="sc-choose-impacts__separate-line" />
          </div>

          <span className="c-legend">Ajouter un impact</span>
          <p className="u-margin__top--m">
            Pour déterminer les stratégies d&apos;action prioritaires, nous utilisons les impacts
            renseignés dans l&apos;étape <b>TACCT - Diagnostiquer les impacts</b>, nécessaires pour
            la démarche.
          </p>
          <p>
            Néanmoins si vous n&apos;avez pas effectué votre diagnostic avec <b>TACCT</b>, ou si vous
            souhaitez rajouter des impacts, vous pouvez en créer manuellement ici.
          </p>

          <div className="c-group-buttons c-group-buttons--end u-margin__top--m">
            <Link
              href={`/impacts/choose-impacts/create-impact${suffix}`}
              className="c-btn--secondary"
            >
              Ajouter un impact
            </Link>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

function SyntheseImpactRow({
  impact,
  displayButton,
}: {
  impact: Synthese;
  displayButton: boolean;
}) {
  const validated = impact.futureExposure >= MIN_FUTURE_EXPOSURE || impact.strategyStudied;
  const future = futureColor(impact.futureExposure);
  const observed = observedColor(impact.observedExposure, impact.futureExposure);

  return (
    <div className="sc-synthese-impact">
      <div className="sc-synthese-impact__icon">
        {validated && <em className="c-icon small status-validate" aria-hidden="true" />}
        <em className={`c-icon ${future} ${impact.thematicIcon}`} aria-hidden="true" />
      </div>

      <span className="sc-synthese-impact__label">{impact.description}</span>

      {displayButton && (
        <AddRemoveImpactButton impactId={impact.id} studied={impact.strategyStudied} />
      )}

      <span className="sc-synthese-impact__indicateur">
        <span className={`sc-synthese-impact__item ${observed}`}>{impact.observedExposure}</span>
        <em className={`c-icon ${impact.trendIcon} sc-synthese-impact__item`} aria-hidden="true" />
        <span className={`${future} sc-synthese-impact__item`}>{impact.futureExposure}</span>
      </span>
    </div>
  );
}

function toSynthese(impact: Diagnosed): Synthese {
  const sensitivity = Number(impact.sensitivity ?? 0);
  const observedRaw = Number(impact.observed_exposure?.exposure ?? 0);
  const futureRaw = Number(impact.observed_exposure?.future_exposure?.exposure ?? 0);
  const observedExposure = sensitivity * observedRaw;
  const futureExposure = sensitivity * futureRaw;

  return {
    id: impact.id,
    description: impact.description ?? '',
    thematicIcon: impact.impact_theme?.thematic?.icon ?? 'suspended',
    observedExposure,
    futureExposure,
    trendIcon: trendIcon(observedExposure, futureExposure),
    strategyStudied: impact.strategy_studied,
  };
}

function trendIcon(observed: number, future: number): string {
  if (future === observed) return 'arrow-holding';
  if (future > observed) return 'arrow-increases';
  return 'arrow-decreases';
}

// Couleur de l'exposition future selon le score (legacy selectFutureExposureColor).
function futureColor(future: number): string {
  return future >= 16
    ? 'sc-impact__red'
    : future >= 12
      ? 'sc-impact__orange'
      : future >= 8
        ? 'sc-impact__yellow'
        : '';
}

// Couleur de l'exposition observée : colorée seulement si égale à la future (legacy).
function observedColor(observed: number, future: number): string {
  if (future === observed) {
    if (future >= 16) return 'sc-impact__red';
    if (future >= 12) return 'sc-impact__orange';
    if (future >= 8) return 'sc-impact__yellow';
  }
  return '';
}
