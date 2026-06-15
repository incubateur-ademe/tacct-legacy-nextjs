import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy, isAdmin } from '@/server/study/current-study';
import { prisma } from '@/server/db';
import { getStudiedImpactsForStudy } from '@/server/strategies/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { StepStatus } from '@/components/ui/StepStatus';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { DiagnosticIncompleteButton } from '@/components/workspace/DiagnosticIncompleteButton';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function WorkspaceHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);

  if (!study) {
    // Un admin sans étude courante est dirigé vers la gestion des études.
    // Un non-admin n'a pas accès à cette zone (cf. gestion/layout) : on lui
    // affiche un état vide plutôt que de boucler en redirection.
    if (isAdmin(user)) {
      redirect('/gestion/studies-management');
    }
    return (
      <ContentLayout helpKey="main-page">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="o-card text-center py-5">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Aucune étude"
                  subtitle="Dossier TACCT"
                  icon="dashboard"
                />
                <p className="mt-4">
                  Aucune étude ne vous est rattachée pour le moment. Rapprochez-vous
                  d&apos;un administrateur pour être ajouté à une étude.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ContentLayout>
    );
  }

  const [nbObservedExposures, nbImpacts, { diagnosed, strategies }] = await Promise.all([
    prisma.observed_exposure.count({ where: { study_id: study.id } }),
    prisma.impact.count({
      where: { impact_theme: { study_id: study.id } },
    }),
    getStudiedImpactsForStudy(study.id),
  ]);

  const diagnosticComplete =
    study.observed_exposure_valid === 'validated' &&
    study.exposition_future_valid === 'validated' &&
    study.sensibility_valid === 'validated';

  // Même logique que la page /impacts : impacts diagnostiqués non révoqués ET
  // (choisis OU score sensibilité × exposition future ≥ 8) + impact_strategy.
  const studyScore = (i: (typeof diagnosed)[number]) =>
    Number(i.sensitivity ?? 0) *
    Number(i.observed_exposure?.future_exposure?.exposure ?? 0);

  const studiedDiagnosed = diagnosed.filter(
    (i) => !i.revoked_diagnostic && (i.strategy_studied || studyScore(i) >= 8),
  );

  const totalStudiedCount = studiedDiagnosed.length + strategies.length;

  // Aperçu des 3 premiers items pour l'affichage du bloc accueil.
  const studiedImpacts = [
    ...studiedDiagnosed.map((i) => ({
      id: i.id,
      description: i.description ?? '',
      icon: i.impact_theme?.thematic?.icon ?? 'suspended',
      nbActions: i.impact_action.length,
      nbTrajectories: i.impact_trajectory.length,
    })),
    ...strategies.map((s) => ({
      id: s.id,
      description: s.description ?? '',
      icon: s.impact_theme?.thematic?.icon ?? 'suspended',
      nbActions: s.impact_action.length,
      nbTrajectories: s.impact_trajectory.length,
    })),
  ].slice(0, 3);

  const regionLabel = study.commune?.department?.region?.label ?? '';

  return (
    <ContentLayout helpKey="main-page">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            {/* ── Study info ── */}
            <StudyInfo
              territoryName={study.territory_name}
              year={Number(study.year)}
              regionLabel={regionLabel}
            />

            {/* ── Diagnostiquer les impacts ── */}
            <DiagnoseImpacts
              nbObservedExposures={nbObservedExposures}
              nbImpacts={nbImpacts}
              observedExposureValid={study.observed_exposure_valid}
              expositionFutureValid={study.exposition_future_valid}
              sensibilityValid={study.sensibility_valid}
            />

            {/* ── Construire des stratégies ── */}
            <ConstructStrategy
              impacts={studiedImpacts}
              totalCount={totalStudiedCount}
              diagnosticComplete={diagnosticComplete}
            />

            {/* ── Évaluer les actions ── */}
            <div className="row mt-4">
              <div className="col-lg-12 col-md-16">
                <div className="o-card">
                  <EvaluateActions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sous-composants — reproductions directes des composants Angular de l'accueil

function StudyInfo({
  territoryName,
  year,
  regionLabel,
}: {
  territoryName: string;
  year: number;
  regionLabel: string;
}) {
  return (
    <div className="row">
      <div className="col-lg-12 col-md-16">
        <div className="o-card">
          <div className="row">
            <BlockTitleIcon
              className="col-16"
              pageTitle={territoryName}
              subtitle="Dossier TACCT"
              icon="dashboard"
            />
          </div>
          <div className="sc-study-info__legend">
            <span>Région {regionLabel}</span>
            <span className="ml-2">{year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnoseImpacts({
  nbObservedExposures,
  nbImpacts,
  observedExposureValid,
  expositionFutureValid,
  sensibilityValid,
}: {
  nbObservedExposures: number;
  nbImpacts: number;
  observedExposureValid: string;
  expositionFutureValid: string;
  sensibilityValid: string;
}) {
  return (
    <div className="row mt-4">
      <div className="col-lg-12 col-md-16">
        <div className="o-card">
          <div className="d-flex align-baseline items-baseline align-items-baseline">
            <span className="logo-tacct-diagnose" />
            <span className="ml-3 c-txt-marianne-bold color-tacct-red txt-size-regular">
              Diagnostiquer les impacts
            </span>
          </div>

          <div className="c-diagnose-impact__bloc-info">
            <DiagnoseItem
              icon="eye"
              count={nbObservedExposures}
              singular="Aléa climatique"
              plural="Aléas climatiques"
              status={observedExposureValid}
            />
            <DiagnoseItem
              icon="exposition-future"
              count={nbObservedExposures}
              singular="Aléa climatique futur"
              plural="Aléas climatiques futurs"
              status={expositionFutureValid}
            />
            <DiagnoseItem
              icon="sensibilite"
              count={nbImpacts}
              singular="Impact qualifié"
              plural="Impacts qualifiés"
              status={sensibilityValid}
            />
          </div>

          <div className="o-btn--end">
            <Link
              id="worskpace-acceder-diagnostic"
              className="c-btn--primary"
              href="/dashboard"
              title="Accéder au diagnostic"
            >
              Accéder au diagnostic
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnoseItem({
  icon,
  count,
  singular,
  plural,
  status,
}: {
  icon: string;
  count: number;
  singular: string;
  plural: string;
  status: string;
}) {
  return (
    <div className="o-item">
      <div>
        <em className={`c-icon ${icon} blue medium`} aria-hidden="true" />
      </div>
      <div className="mb-2">
        <span className="c-subtitle-black-bold">{count} </span>
        <span className="c-subtitle-black">{pluralize(count, singular, plural)}</span>
      </div>
      <StepStatus status={status} />
    </div>
  );
}

function ConstructStrategy({
  impacts,
  totalCount,
  diagnosticComplete,
}: {
  impacts: {
    id: string;
    description: string;
    icon: string;
    nbActions: number;
    nbTrajectories: number;
  }[];
  totalCount: number;
  diagnosticComplete: boolean;
}) {
  const summaryLabel =
    totalCount === 0
      ? 'Aucun impact étudié'
      : `${totalCount} ${pluralize(totalCount, 'impact étudié', 'impacts étudiés')}`;

  return (
    <div className="row mt-4">
      <div className="col-lg-12">
        <div className="o-card">
          <div className="d-flex align-baseline items-baseline align-items-baseline justify-content-between">
            <div className="d-flex align-baseline items-baseline align-items-baseline">
              <span className="logo-tacct-strategy" />
              <span className="ml-3 c-txt-marianne-bold color-tacct-orange txt-size-regular">
                Construire des stratégies
              </span>
            </div>
            <span className="c-subtitle mr-5">{summaryLabel}</span>
          </div>

          <div className="sc-construct-strategy__summary-list">
            {impacts.map((imp) => (
              <div key={imp.id} className="sc-construct-strategy__summary-item">
                <em
                  className={`sc-construct-strategy__summary-item-logo c-icon blue medium ${imp.icon}`}
                  aria-hidden="true"
                />
                <span
                  className="u-txt-word-break p-bold-primary sc-construct-strategy__summary-item-txt"
                  dangerouslySetInnerHTML={{ __html: imp.description }}
                />
                <span className="c-subtitle-black sc-construct-strategy__summary-item-txt">
                  {imp.nbActions} {pluralize(imp.nbActions, 'action', 'actions')}
                </span>
                <span className="c-subtitle-black sc-construct-strategy__summary-item-txt">
                  {imp.nbTrajectories} {pluralize(imp.nbTrajectories, 'trajectoire', 'trajectoires')}
                </span>
              </div>
            ))}
          </div>

          <div className="o-btn--end">
            <DiagnosticIncompleteButton diagnosticComplete={diagnosticComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluateActions() {
  return (
    <div className="d-flex align-baseline items-baseline align-items-baseline justify-content-between">
      <div className="d-flex align-baseline items-baseline align-items-baseline">
        <span className="logo-tacct-evaluation" />
        <span className="ml-3 c-txt-marianne-bold color-tacct-green txt-size-regular">
          Évaluer les actions
        </span>
      </div>
      <div>
        <a
          href="https://librairie.ademe.fr/changement-climatique-et-energie/756-evaluer-les-politiques-d-adaptation-au-changement-climatique-9791029713767.html"
          target="_blank"
          rel="noopener noreferrer"
          className="c-btn--secondary"
          title="Accéder au guide"
        >
          Accéder au guide
        </a>
      </div>
    </div>
  );
}
