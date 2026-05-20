import type { Metadata } from 'next';
import '@/styles/main.scss';

export const metadata: Metadata = {
  title: 'TACCT',
  description: "Outil d'aide à la décision pour l'adaptation au changement climatique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
