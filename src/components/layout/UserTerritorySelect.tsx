'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import styles from './UserTerritorySelect.module.scss';

type StudyOption = {
  id: string;
  territoryName: string;
  year: number;
};

/**
 * Port de `app-user-territory` du legacy : permet à un user multi-études de
 * basculer entre ses dossiers via un select. Le choix est persisté dans
 * l'URL via `?study=<id>` (lu côté serveur par `getCurrentStudy`).
 */
export function UserTerritorySelect({ studies }: { studies: StudyOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (studies.length === 0) return null;

  const currentId = searchParams.get('study') ?? studies[0]?.id ?? '';

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('study', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  return (
    <select
      aria-label="Sélection du territoire d'étude"
      className={styles.select}
      value={currentId}
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
