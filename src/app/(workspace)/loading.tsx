import { Loader } from '@/components/ui/Loader';

/**
 * Navigations internes au workspace : le layout est déjà monté, donc Header et
 * Menu restent affichés et seul le contenu passe en chargement.
 */
export default function Loading() {
  return <Loader />;
}
