import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import {
  buildSynthesisMatrix,
  buildThematicAverages,
  getDashboardData,
} from '@/server/dashboard/queries';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BASE_PATH } from '@/lib/base-path';
import { BlockHeader } from '@/components/ui/BlockHeader';
import { StepStatus } from '@/components/ui/StepStatus';
import {
  DashboardExposition,
  type ExpositionItem,
} from '@/components/dashboard/DashboardExposition';
import {
  DashboardSensibilite,
  type SensibiliteTheme,
} from '@/components/dashboard/DashboardSensibilite';
import { DashboardSyntheseImpacts } from '@/components/dashboard/DashboardSyntheseImpacts';
import { DashboardPotentialFuture } from '@/components/dashboard/DashboardPotentialFuture';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  const { exposures, themes } = await getDashboardData(study.id);
  const matrix = buildSynthesisMatrix(themes);
  const averages = buildThematicAverages(themes);

  const expositionItems: ExpositionItem[] = exposures.map((exp) => {
    const observed = exp.exposure === null ? null : Number(exp.exposure);
    const future =
      exp.future_exposure?.exposure === null || exp.future_exposure?.exposure === undefined
        ? null
        : Number(exp.future_exposure.exposure);
    return {
      id: exp.id,
      categoryIcon:
        exp.climate_hazard_custom !== null
          ? 'suspended'
          : (exp.climate_hazard?.climate_hazard_category?.icon ?? 'suspended'),
      hazardName: exp.climate_hazard_custom ?? exp.climate_hazard?.name ?? '',
      observedExposure: observed,
      futureExposure: future,
      arrow: arrowFor(observed, future),
    };
  });

  const sensibiliteThemes: SensibiliteTheme[] = themes.map((t) => ({
    id: t.id,
    thematicName: t.thematic?.name ?? t.name ?? '',
    thematicIcon: t.thematic?.icon ?? 'suspended',
    impacts: t.impact.map((i) => ({
      id: i.id,
      description: i.description ?? '',
      sensitivity: i.sensitivity === null ? null : Number(i.sensitivity),
    })),
  }));

  return (
    <ContentLayout helpKey="dashboard">
      <div className="container page">
        {/* ─── Header (StudyInfo legacy title="Diagnostiquer vos impacts") ─── */}
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle={study.territory_name}
                  subtitle="Diagnostiquer vos impacts"
                  icon="dashboard"
                />
              </div>
              <div className="sc-study-info__legend">
                <span>Région {study.commune?.department?.region?.label ?? ''}</span>
                <span className="ml-2">{String(study.year)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Row : EXPOSITION (col-md-7) + SENSIBILITE (col-md-5) ─── */}
        <div className="row mt-4">
          <div className="col-md-7 col-md-16">
            <div className="o-card pr-3 pl-3 pb-2 pt-3 o-card__dashboard">
              <div className="d-flex align-items-center justify-content-between">
                <BlockHeader
                  className="col-16"
                  pageTitle="EXPOSITION"
                  icon="eye"
                  size="medium"
                  nbElement={exposures.length}
                  contour
                />
                <div className="text-center">
                  <span className="c-subtitle-black">Observé</span>
                  <StepStatus status={study.observed_exposure_valid} />
                </div>
                <div className="text-center">
                  <span className="c-subtitle-black">Futur</span>
                  <StepStatus status={study.exposition_future_valid} />
                </div>
              </div>
            </div>
            <DashboardExposition
              items={expositionItems}
              fallbackHref="/observed-climate/observed-exposure"
            />
          </div>

          <div className="col-md-5">
            <div className="o-card pr-3 pl-3 pb-2 pt-3 o-card__dashboard">
              <div className="d-flex align-items-center justify-content-between">
                <BlockHeader
                  className="col-16"
                  pageTitle="SENSIBILITE"
                  icon="sensibilite"
                  size="medium"
                  nbElement={sensibiliteThemes.length}
                  contour
                />
                <StepStatus status={study.sensibility_valid} />
              </div>
            </div>
            <DashboardSensibilite
              themes={sensibiliteThemes}
              fallbackHref="/sensibility"
            />
          </div>
        </div>

        {/* ─── Synthèse impacts (matrice 4×4 avec icônes circulaires) ─── */}
        <div className="row mt-4">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <section>
                <div className="row">
                  <div className="w-100 d-flex align-items-center justify-content-between">
                    <div className="c-legend">synthèse impacts</div>
                    <div className="d-flex">
                      <div className="o-centred-elements mr-3 d-flex align-items-center">
                        <span className="c-icon__circle green project-primary mr-2 p-2" />
                        <span className="c-subtitle-black">Impacts observés</span>
                      </div>
                      <div className="o-centred-elements mr-4 d-flex align-items-center">
                        <span className="c-icon__circle orange project-primary p-2 mr-2" />
                        <span className="c-subtitle-black">Impacts futurs</span>
                      </div>
                    </div>
                  </div>
                  <section className="w-100">
                    <DashboardSyntheseImpacts matrix={matrix} />
                  </section>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* ─── Niveau moyen des impacts futurs potentiels ─── */}
        <div className="row mt-4">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <div className="c-legend">niveau moyen des impacts futurs potentiels</div>
                <section className="w-100">
                  <DashboardPotentialFuture impacts={averages} />
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Export CSV ─── */}
        <div className="row mt-4">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="d-flex align-items-center justify-content-between">
                <div className="c-legend">exporter la synthese</div>
                <div className="d-flex">
                  <a
                    href={`${BASE_PATH}/api/dashboard/${study.id}/csv`}
                    className="c-btn--secondary"
                    download
                  >
                    télécharger le csv
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

function arrowFor(observed: number | null, future: number | null): string {
  if (observed === null || future === null) return '';
  if (future === observed) return 'arrow-holding';
  if (future > observed) return 'arrow-increases';
  return 'arrow-decreases';
}
