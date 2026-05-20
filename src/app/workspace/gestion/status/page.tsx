import { getSystemStatus } from '@/server/admin/queries';

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
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card">
            <h1 className="c-title-black-bold">État du système</h1>
            <div className="c-subtitle-grey mt-1">
              Compteurs des principales entités (mis à jour à chaque chargement).
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        {items.map((it) => (
          <div key={it.label} className="col-md-4 mb-3">
            <div className="o-card text-center">
              <div className="c-subtitle-grey">{it.label}</div>
              <div className="c-title-black-bold" style={{ fontSize: '2.5rem' }}>
                {it.value.toLocaleString('fr-FR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
