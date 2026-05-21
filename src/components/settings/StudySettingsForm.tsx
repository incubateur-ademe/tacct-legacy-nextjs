'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { patchStudyField } from '@/server/profile/actions';

/**
 * Form « Informations générales sur l'étude » (page Settings).
 *
 * Année + Nom du territoire : auto-save sur blur (cf. `(change)=` legacy).
 * Le bouton est absent ; le legacy ne sauvegarde pas explicitement non plus.
 */
export function StudySettingsForm({
  studyId,
  initialYear,
  initialTerritoryName,
  canEdit,
}: {
  studyId: string;
  initialYear: number;
  initialTerritoryName: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const onBlur = (field: 'year' | 'territoryName', value: string) => {
    if (!canEdit) return;
    if (value.trim() === '') return;
    startTransition(async () => {
      await patchStudyField(studyId, field, value);
      router.refresh();
    });
  };

  return (
    <div className="row">
      <div className="c-input__group col-md-3 col-sm-16 input-size-small">
        <input
          id="year-input"
          className="c-input"
          type="number"
          defaultValue={initialYear}
          readOnly={!canEdit}
          onBlur={(e) => onBlur('year', e.target.value)}
        />
        <label className="c-input__label" htmlFor="year-input">
          Année de l&apos;étude
        </label>
        <div className="c-required">*obligatoire</div>
      </div>

      <div className="c-input__group col-md-9 col-sm-16 input-size-large">
        <input
          id="territory-name-input"
          className="c-input"
          type="text"
          defaultValue={initialTerritoryName}
          maxLength={255}
          readOnly={!canEdit}
          onBlur={(e) => onBlur('territoryName', e.target.value)}
        />
        <label className="c-input__label" htmlFor="territory-name-input">
          Nom du territoire concerné par l&apos;étude
        </label>
        <div className="c-required">*obligatoire</div>
      </div>
    </div>
  );
}
