import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';

export const dynamic = 'force-dynamic';

export default async function GestionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  if (!isAdmin(user)) {
    redirect('/workspace');
  }
  return <>{children}</>;
}
