import { redirect } from 'next/navigation';

export default function Home() {
  // Phase actuelle : pas de landing publique encore portée — on envoie direct
  // dans l'admin pour tester la chaîne. Une vraie landing arrivera plus tard.
  redirect('/admin/studies');
}
