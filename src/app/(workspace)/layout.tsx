import { Header } from '@/components/layout/Header';
import { requireCurrentUser } from '@/server/auth/current-user';

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Phase actuelle : exige DEV_AUTH_EMAIL configuré. Sera remplacé par ProConnect
  // sans toucher aux pages — tout passe par requireCurrentUser().
  await requireCurrentUser();

  return (
    <>
      <Header />
      <div id="mainContent" className="sc-app__container pt-5">
        <div className="sc-app__content container-fluid">
          <div className="content-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
