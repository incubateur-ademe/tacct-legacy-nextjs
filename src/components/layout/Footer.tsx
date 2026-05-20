import Link from 'next/link';

/**
 * Port de `app-footer` du legacy. Les liens pointent vers les routes publiques
 * du legacy ; ces pages ne sont pas migrées côté next (cf. décision projet),
 * elles renverront un 404 mais le visuel du footer reste conforme au design.
 */
export function Footer({ showArtisanLogo = false }: { showArtisanLogo?: boolean }) {
  const currentYear = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

  return (
    <footer id="footer" className="d-flex-column text-center c-footer">
      <hr className="c-footer__hr" />
      <div className="container">
        <div className="row text-left text-md-center">
          <div className="mr-auto pt-4 c-centred-elements">
            <div className="c-footer__logo">
              <img
                src="/assets/img/logo_rf.png"
                height={74}
                width={84}
                className="d-inline-block align-top"
                title="Logo République Française"
                alt="Logo République Française"
              />
            </div>
            <div className="c-footer-logo">
              <img
                src="/assets/img/logo.svg"
                height={109}
                width={92}
                className="d-inline-block align-top"
                title="Agence de la transition écologique"
                alt="Agence de la transition écologique"
              />
            </div>
            {showArtisanLogo && (
              <div className="c-footer-logo ml-3">
                <img
                  src="/assets/img/logo-life-artisan.png"
                  className="d-inline-block align-top"
                  title="Agence de la transition écologique"
                  alt="Agence de la transition écologique"
                />
              </div>
            )}
          </div>
          <div className="pt-4 my-2 my-lg-0 text-left">
            <ul>
              <li>
                <Link title="Mentions légales" className="c-footer__links" href="/legal-notice">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  title="Politique de confidentialité"
                  className="c-footer__links"
                  href="/privacy-policy"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link title="Accessibilité" className="c-footer__links" href="/accessibility">
                  Accessibilité : Non conforme
                </Link>
              </li>
              <li>
                <Link title="Politique des cookies" className="c-footer__links" href="/cookies">
                  Politique des cookies
                </Link>
              </li>
              <li>
                <Link title="Contact" className="c-footer__links" href="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <hr />
        <div className="py-3 text-center c-footer__copyright">
          <div title={version}>&copy;&nbsp;{currentYear} ADEME - Agence de la transition écologique</div>
          <div>Version {version}</div>
        </div>
      </div>
    </footer>
  );
}
