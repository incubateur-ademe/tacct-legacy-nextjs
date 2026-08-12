/**
 * Où atterrir après un changement d'étude.
 *
 * On reste sur la page courante, sauf si son URL porte l'identifiant d'une
 * entité appartenant à l'étude qu'on vient de quitter : cette entité n'existe
 * pas dans la nouvelle étude et la page répondrait 404. Dans ce cas on remonte
 * à la page de la même section, jamais à l'accueil.
 */
const ENTITY_SCOPED_ROUTES: Array<{ match: RegExp; target: string }> = [
  { match: /^\/impacts\/(?:impact|strategy)\/[^/]+/, target: '/impacts' },
  {
    match: /^\/impacts\/choose-impacts\/(?!create-impact(?:\/|$))[^/]+/,
    target: '/impacts/choose-impacts',
  },
  {
    match: /^\/observed-climate\/observed-exposure\/[^/]+\/edit/,
    target: '/observed-climate/observed-exposure',
  },
  {
    match: /^\/sensibility\/impact-theme\/impact\/(?:add|edit)\/[^/]+/,
    target: '/sensibility',
  },
];

export function studySwitchTarget(pathname: string): string {
  const rule = ENTITY_SCOPED_ROUTES.find(({ match }) => match.test(pathname));
  return rule ? rule.target : pathname;
}
