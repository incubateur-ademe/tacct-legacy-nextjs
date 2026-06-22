import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { prisma } from '@/server/db';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Label } from '@/components/ui/Label';
import { StudySettingsForm } from '@/components/settings/StudySettingsForm';
import { TransferStudyForm } from '@/components/settings/TransferStudyForm';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  // Région : commune → département → région
  const department = study.commune?.department_id
    ? await prisma.department.findUnique({
        where: { id: study.commune.department_id },
        include: { region: true },
      })
    : null;
  const regionLabel = department?.region?.label ?? '-';
  const communeLabel = study.commune?.label ?? '-';

  // Vérifie si l'utilisateur est head_study (sinon read-only)
  const myUserStudy = study.user_study.find((us) => us.user_id === user.id);
  const isHead = myUserStudy?.head_study === true;

  return (
    <ContentLayout helpKey="settings">
      <div className="container page">
        <div className="row">
          <div className="col-16 col-lg-12">
            <div className="o-card">
              <BlockTitleIcon
                className="col-16"
                pageTitle="Paramétrage"
                subtitle="Dossier TACCT"
                icon="settings"
              />

              {/* ── Section 1 : Informations générales sur l'étude ── */}
              <section>
                <h2 className="c-legend">Informations générales sur l&apos;étude</h2>

                <StudySettingsForm
                  studyId={study.id}
                  initialYear={Number(study.year)}
                  initialTerritoryName={study.territory_name}
                  canEdit={isHead}
                />

                <div className="row">
                  <div className="col-lg-6">
                    <Label
                      titleLabel="Commune de rattachement"
                      label={communeLabel}
                    />
                  </div>
                  <div className="col-lg-6">
                    <Label titleLabel="Région" label={regionLabel} />
                  </div>
                </div>
              </section>

              {/* ── Section 2 : Intervenants sur le projet ── */}
              <section className="o-section--even">
                <h2 className="c-legend">Intervenants sur le projet</h2>

                <span className="sc-settings__subtitle">Chargé d&apos;étude</span>

                <div className="row u-margin__bottom">
                  <Label
                    titleLabel="Nom"
                    label={user.lastname ?? '-'}
                    className="sc-settings__label"
                  />
                  <Label
                    titleLabel="Prénom"
                    label={user.firstname ?? '-'}
                    className="sc-settings__label"
                  />
                  <Label
                    titleLabel="Adresse mail"
                    label={user.email ?? '-'}
                    className="sc-settings__label"
                  />
                </div>

                {isHead ? (
                  <>
                    <span className="sc-settings__title sc-settings__subtitle">
                      Transférer l&apos;étude à un nouveau chargé d&apos;étude
                    </span>
                    <TransferStudyForm studyId={study.id} />
                  </>
                ) : (
                  <div className="c-subtitle-grey mt-3">
                    Seul le chargé d&apos;étude peut transférer l&apos;étude.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
