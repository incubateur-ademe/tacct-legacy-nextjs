import type { Metadata } from 'next';
import '@/styles/main.scss';
import { Toaster } from '@/components/ui/Toaster';
import { consumeFlash } from '@/server/flash';
import { PHProvider } from './providers';
import PostHogPageView from './PostHogPageView';

export const metadata: Metadata = {
  title: 'TACCT',
  description: "Outil d'aide à la décision pour l'adaptation au changement climatique",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const flash = await consumeFlash();

  return (
    <html lang="fr">
      <body>
        <PHProvider>
          {children}
          <PostHogPageView />
          <Toaster flash={flash} />
        </PHProvider>
      </body>
    </html>
  );
}
