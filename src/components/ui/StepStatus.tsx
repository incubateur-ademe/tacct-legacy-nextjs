/**
 * Port de `app-step-status` (Angular legacy).
 *
 * Affiche une "pill" colorée avec libellé + icône selon le statut de l'étape.
 */

const STATUS = {
  'in-progress': { label: 'En cours', icon: 'status-inprogress' },
  incomplete: { label: 'Incomplet', icon: 'status-suspended' },
  validated: { label: 'Validé', icon: 'status-validate' },
} as const;

type Status = keyof typeof STATUS;

export function StepStatus({ status }: { status: string }) {
  const key = (status in STATUS ? status : 'incomplete') as Status;
  const { label, icon } = STATUS[key];

  return (
    <div className={`o-centred-elements sc-status-step ${key}`}>
      <span className="pr-1">{label}</span>
      <em className={`c-icon small blue ${icon}`} aria-hidden="true" />
    </div>
  );
}
