import Link from 'next/link';
import { getCurrentUser } from '@/server/auth/current-user';
import { getEnv } from '@/lib/env';
import { isAdmin } from '@/server/study/current-study';
import { UserTerritorySelect } from './UserTerritorySelect';
import { HeaderLogo } from './HeaderLogo';
import styles from './Header.module.scss';

export async function Header() {
  const user = await getCurrentUser();

  if (!user) return null;

  const admin = isAdmin(user);
  const isHeadOfAStudy = user.user_study.some((us) => us.head_study);
  const settingsHref = admin ? '/gestion/studies-management' : '/settings';
  const logoutUrl = `${getEnv().APP_URL}/api/proconnect/logout`;

  const studies = user.user_study
    .map((us) => us.study)
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .map((s) => ({
      id: s.id,
      territoryName: s.territory_name,
      year: Number(s.year),
    }));

  return (
    <div className={styles.containerHeader}>
      <div className="row">
        <div className={`o-card w-100 ${styles.cardHeader}`}>
          <div className={styles.header}>
            <HeaderLogo />
            <UserTerritorySelect studies={studies} />
            <div className={styles.header}>
              <span className="mr-2 c-legend-action">{user.firstname}</span>
              <span className="mr-3 c-legend-action text-uppercase">{user.lastname}</span>

              <Link href="/profile" aria-label="Profil">
                <span className="c-icon__circle project-primary mr-2">
                  <em className="c-icon people project-primary medium" title="Profil" />
                </span>
              </Link>

              {(admin || isHeadOfAStudy) && (
                <Link
                  href={settingsHref}
                  aria-label={admin ? 'Administration' : 'Paramétrage'}
                >
                  <span className="c-icon__circle project-primary mr-2">
                    <em
                      className="c-icon settings project-primary medium"
                      title={admin ? 'Administration' : 'Paramétrage'}
                    />
                  </span>
                </Link>
              )}

              <a href={logoutUrl} aria-label="Déconnexion" className="mr-5">
                <span className="c-icon__circle project-primary">
                  <em className="c-icon logout project-primary medium" title="Déconnexion" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
