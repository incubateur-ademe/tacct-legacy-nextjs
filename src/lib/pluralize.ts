/**
 * Renvoie la forme singulière ou plurielle selon les règles du français :
 * `0` et `1` prennent le singulier, à partir de `2` on passe au pluriel.
 *
 * Port du composant `app-plural-singular` du legacy (qui s'appuyait sur
 * Angular `ngPlural` avec la locale FR).
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return Math.abs(count) < 2 ? singular : plural;
}
