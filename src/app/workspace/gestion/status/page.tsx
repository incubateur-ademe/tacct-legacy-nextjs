import { getSystemStatus } from '@/server/admin/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const status = await getSystemStatus();

  const items = [
    { label: 'Utilisateurs', value: status.users },
    { label: 'Études', value: status.studies },
    { label: "Bureaux d'étude", value: status.studyOffices },
    { label: 'Fiches projet', value: status.projectSheets },
    { label: 'Expositions observées', value: status.exposures },
    { label: 'Impacts diagnostiqués', value: status.impacts },
  ];

  return (
    <ContentLayout helpKey="admin">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <BlockTitleIcon
                pageTitle="État du système"
                subtitle="Administration"
                icon="settings"
              />
              <p className="c-subtitle-grey">
                Compteurs des principales entités (mis à jour à chaque chargement).
              </p>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          {items.map((it) => (
            <div key={it.label} className="col-md-4 mb-3">
              <div className="o-card text-center">
                <div className="c-subtitle-grey">{it.label}</div>
                <div className="c-title-h1" style={{ fontSize: '2.5rem' }}>
                  {it.value.toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}
