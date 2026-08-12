/**
 * Invariant : un compte administrateur reste toujours validé.
 *
 * `validated: false` coupe l'accès à l'outil (contrôle appliqué à la connexion,
 * côté app principale). Un admin désactivé serait enfermé dehors sans pouvoir se
 * réactiver lui-même — et s'il est le dernier admin, plus personne ne le peut.
 *
 * À utiliser partout où `user.validated` est écrit.
 */
export function accountValidatedValue(isAdminAccount: boolean, requested: boolean): boolean {
  return isAdminAccount ? true : requested;
}
