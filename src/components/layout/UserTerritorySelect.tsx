'use client';

import { useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { selectCurrentStudy } from '@/server/study/actions';
import styles from './UserTerritorySelect.module.scss';

type StudyOption = {
  id: string;
  territoryName: string;
  year: number;
};

/**
 * Port de `app-user-territory` du legacy : permet à un user multi-études de
 * basculer entre ses dossiers. Le choix est persisté dans un cookie côté
 * serveur, donc il survit à toute navigation.
 */
export function UserTerritorySelect({
  studies,
  currentStudyId,
}: {
  studies: StudyOption[];
  currentStudyId: string;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (studies.length === 0) return null;

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studyId = e.target.value;
    startTransition(async () => {
      await selectCurrentStudy(studyId, pathname);
    });
  };

  return (
    <select
      // Remonte le select sur la valeur du serveur une fois le changement acté.
      key={currentStudyId}
      aria-label="Sélection du territoire d'étude"
      className={styles.select}
      defaultValue={currentStudyId}
      disabled={pending}
      onChange={onChange}
    >
      {studies.map((s) => (
        <option key={s.id} value={s.id}>
          {s.territoryName} {s.year}
        </option>
      ))}
    </select>
  );
}
