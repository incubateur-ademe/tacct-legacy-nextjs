import { Loader } from '@/components/ui/Loader';

/**
 * Fallback du segment racine. C'est celui qui compte à l'arrivée depuis l'outil
 * principal : il couvre le layout `(workspace)`, dont les requêtes (utilisateur,
 * étude courante) sont justement ce qui retarde le premier octet. Un `loading.tsx`
 * placé dans `(workspace)` ne couvrirait que ses enfants, pas son propre layout.
 */
export default function Loading() {
  return <Loader minHeight="100dvh" />;
}
