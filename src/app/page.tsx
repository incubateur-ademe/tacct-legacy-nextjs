import { redirect } from 'next/navigation';

export default function Home() {
  // Tant qu'on n'a pas branché la landing publique, la racine envoie sur le
  // workspace. ProConnect (Phase finale) gérera le flow d'authentification.
  redirect('/workspace');
}
