import { redirect } from 'next/navigation';

export default function ObservedClimatePage() {
  // Pas de page propre — on entre directement dans la liste des expositions observées.
  redirect('/observed-climate/observed-exposure');
}
