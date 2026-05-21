import Link from 'next/link';

/**
 * Port de `app-dashboard-exposition` (Angular legacy).
 *
 * Liste les expositions observées sous forme de grid 5 colonnes :
 * icône catégorie, nom de l'aléa, expo observée, flèche évolution, expo future.
 */
export type ExpositionItem = {
  id: string;
  categoryIcon: string;
  hazardName: string;
  observedExposure: number | null;
  futureExposure: number | null;
  arrow: string;
};

export function DashboardExposition({
  items,
  fallbackHref,
}: {
  items: ExpositionItem[];
  fallbackHref: string;
}) {
  if (items.length === 0) {
    return (
      <div className="o-card">
        <div className="text-center mt-4 mb-4">
          <div className="p-small-grey mb-3">
            Aucun aléa du climat passé n&apos;est encore renseigné
          </div>
          <Link className="c-legend-action-bold" href={fallbackHref}>
            SAISIR LE CLIMAT PASSÉ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="o-card p-3">
      {items.map((item) => (
        <div key={item.id} className="c-dashboard__list_exposures">
          <div className="item">
            <em
              className={`c-icon project-primary-secondary ${item.categoryIcon}`}
              aria-hidden="true"
            />
          </div>
          <div className="item pr-3">
            <span className="o-ellipsis c-subtitle-black" title={item.hazardName}>
              {item.hazardName}
            </span>
          </div>
          <div className="item-centred text-center">
            <span className="c-subtitle-black-bold">
              {item.observedExposure ?? ''}
            </span>
          </div>
          <div className="item-centred text-center">
            {item.arrow && <em className={`c-icon ${item.arrow}`} aria-hidden="true" />}
          </div>
          <div className="item-centred text-center">
            <span className="c-subtitle-black-bold">{item.futureExposure ?? ''}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
