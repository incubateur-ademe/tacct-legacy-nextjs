export const dynamic = 'force-dynamic';

export default function NaturalDisastersPage() {
  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold">Catastrophes naturelles</h1>
            <p className="mt-3">
              Pour consulter l&apos;historique des catastrophes naturelles ayant touché ton
              territoire, utilise l&apos;outil dédié de l&apos;ADEME.
            </p>
            <a
              href="https://facili-tacct.beta.gouv.fr/recherche-territoire"
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn--primary mt-3 d-inline-block"
            >
              Accéder à l&apos;outil de recherche
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
