import { Loader } from '@/components/ui/Loader';

/**
 * Navigations entre pages d'administration. Le loader de `(workspace)` est
 * placé au-dessus du segment `gestion`, qui ne change pas d'une page d'admin à
 * l'autre : React garde alors l'ancienne page figée jusqu'à la fin du rendu de
 * la nouvelle. Cette frontière-ci, sous le layout `gestion`, est recréée à
 * chaque changement de sous-page, donc son fallback s'affiche immédiatement.
 */
export default function Loading() {
  return <Loader />;
}
