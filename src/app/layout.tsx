import { Toaster } from '@/components/ui/Toaster';
import { consumeFlash } from '@/server/flash';
import '@/styles/main.scss';
import type { Metadata } from 'next';
import PostHogPageView from './PostHogPageView';
import { PHProvider } from './providers';

export const metadata: Metadata = {
  title: 'Outil de saisie TACCT',
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
