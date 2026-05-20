import Link from 'next/link';
import { getCurrentUser } from '@/server/auth/current-user';
import styles from './Header.module.scss';

export async function Header() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <div className={styles.containerHeader}>
      <div className="row">
        <div className={`o-card w-100 ${styles.cardHeader}`}>
          <div className={styles.header}>
            <Link
              href="/workspace"
              aria-label="Accueil"
              className={`justify-content-between ${styles.logoTacct}`}
            />
            <div className={styles.header}>
              <span className="mr-2 c-legend-action">{user.firstname}</span>
              <span className="mr-3 c-legend-action text-uppercase">{user.lastname}</span>
              <button type="button" aria-label="Profil">
                <span className="c-icon__circle project-primary mr-2">
                  <em className="c-icon people project-primary medium" title="Profil" />
                </span>
              </button>
              <button type="button" aria-label="Paramétrage">
                <span className="c-icon__circle project-primary mr-2">
                  <em className="c-icon settings project-primary medium" title="Paramétrage" />
                </span>
              </button>
              <button type="button" aria-label="Déconnexion" className="mr-5">
                <span className="c-icon__circle project-primary">
                  <em className="c-icon logout project-primary medium" title="Déconnexion" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
