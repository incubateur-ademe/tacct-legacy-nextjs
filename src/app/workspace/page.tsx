import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { prisma } from '@/server/db';

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

  // Pas d'étude associée → admin/studies (pour admin) ou message vide
  if (!study) {
    redirect('/workspace/gestion/studies-management');
  }

  // Compteurs nécessaires pour les sections du parcours
  const [nbObservedExposures, nbImpacts, studiedImpacts] = await Promise.all([
    prisma.observed_exposure.count({ where: { study_id: study.id } }),
    prisma.impact.count({
      where: { impact_theme: { study_id: study.id } },
    }),
    prisma.impact_strategy.findMany({
      where: { impact_theme: { study_id: study.id } },
      include: {
        impact_theme: { include: { thematic: true } },
        impact_action: true,
        impact_trajectory: true,
      },
    }),
  ]);

  const regionLabel = study.commune?.department?.region?.label ?? '—';

  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-12 col-md-16">
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
            study={{
              observedExposureValid: study.observed_exposure_valid,
              expositionFutureValid: study.exposition_future_valid,
              sensibilityValid: study.sensibility_valid,
            }}
          />

          {/* ── Construire des stratégies ── */}
          <ConstructStrategy
            impacts={studiedImpacts.map((s) => ({
              id: s.id,
              description: s.description ?? '',
              icon: s.impact_theme?.thematic?.icon ?? 'suspended',
              nbActions: s.impact_action.length,
              nbTrajectories: s.impact_trajectory.length,
            }))}
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
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sous-composants — équivalents directs des composants Angular de l'accueil

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
            <div className="col-16 d-flex align-items-center">
              <em className="c-icon medium project-primary dashboard mr-3" aria-hidden="true" />
              <div>
                <h1 className="c-title-black-bold m-0">{territoryName}</h1>
                <div className="c-subtitle-grey">Diagnostic</div>
              </div>
            </div>
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

function StepStatus({ status }: { status: string }) {
  const color =
    status === 'validated' ? '#198754' : status === 'in-progress' ? '#f9a825' : '#dc3545';
  const label =
    status === 'validated' ? 'Validé' : status === 'in-progress' ? 'En cours' : 'À compléter';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        background: color,
        color: 'white',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function DiagnoseImpacts({
  nbObservedExposures,
  nbImpacts,
  study,
}: {
  nbObservedExposures: number;
  nbImpacts: number;
  study: {
    observedExposureValid: string;
    expositionFutureValid: string;
    sensibilityValid: string;
  };
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
            <Item
              icon="eye"
              count={nbObservedExposures}
              singular="Aléa climatique"
              plural="Aléas climatiques"
              status={study.observedExposureValid}
            />
            <Item
              icon="exposition-future"
              count={nbObservedExposures}
              singular="Aléa climatique futur"
              plural="Aléas climatiques futurs"
              status={study.expositionFutureValid}
            />
            <Item
              icon="sensibilite"
              count={nbImpacts}
              singular="Impact qualifié"
              plural="Impacts qualifiés"
              status={study.sensibilityValid}
            />
          </div>
          <div className="o-btn--end">
            <Link
              id="worskpace-acceder-diagnostic"
              className="c-btn--primary"
              href="/workspace/dashboard"
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

function Item({
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
        <span className="c-subtitle-black">{count > 1 ? plural : singular}</span>
      </div>
      <StepStatus status={status} />
    </div>
  );
}

function ConstructStrategy({
  impacts,
}: {
  impacts: {
    id: string;
    description: string;
    icon: string;
    nbActions: number;
    nbTrajectories: number;
  }[];
}) {
  const count = impacts.length;
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
            <span className="c-subtitle mr-5">
              {count === 0
                ? 'Aucun impact étudié'
                : `${count} impact${count > 1 ? 's' : ''} étudié${count > 1 ? 's' : ''}`}
            </span>
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
                  {imp.nbActions} action{imp.nbActions > 1 ? 's' : ''}
                </span>
                <span className="c-subtitle-black sc-construct-strategy__summary-item-txt">
                  {imp.nbTrajectories} trajectoire{imp.nbTrajectories > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="o-btn--end">
            <Link
              id="worskpace-acceder-trajectoires"
              className="c-btn--primary"
              href="/workspace/impacts"
              title="Accéder aux trajectoires"
            >
              Accéder aux trajectoires
            </Link>
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
