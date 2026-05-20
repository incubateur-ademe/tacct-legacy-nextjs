export const dynamic = 'force-dynamic';

export default function AnalyseFutureClimatePage() {
  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold">Analyse du climat futur</h1>
            <p className="mt-3">
              Pour analyser le climat futur de ton territoire, utilise l&apos;outil{' '}
              <strong>CLIMADIAG COMMUNE</strong> de Météo-France :
            </p>
            <ol className="mt-3">
              <li>Identifie ta commune</li>
              <li>Sélectionne les indicateurs climatiques pertinents</li>
              <li>
                Consulte les évolutions pour chacun des indicateurs sous différents scénarios
                (RCP 4.5, RCP 8.5…)
              </li>
              <li>Repère les tendances à 2050 et 2100</li>
              <li>
                Reviens ensuite ici pour saisir l&apos;exposition future de chaque aléa identifié
                dans le diagnostic
              </li>
            </ol>
            <a
              href="https://meteofrance.com/climadiag-commune"
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn--primary mt-3 d-inline-block"
            >
              Accéder à CLIMADIAG COMMUNE
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
