'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transferStudyHead } from '@/server/profile/actions';

/**
 * Form « Transférer l'étude à un nouveau chargé d'étude ».
 *
 * Inputs Nom + Prénom + Adresse mail + icône mail + bouton TRANSFÉRER.
 *  – cible existante : « Transfert effectué. » + reload
 *  – cible inexistante : message « Ce compte n'existe pas dans notre base. »
 *    (plus d'invitation par email)
 */
export function TransferStudyForm({ studyId }: { studyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('studyId', studyId);
    const form = e.currentTarget;
    startTransition(async () => {
      try {
        const result = await transferStudyHead(fd);
        if (result.status === 'transferred') {
          setMessage('Transfert effectué. Un mail vous a été transmis.');
          form.reset();
          router.refresh();
        } else {
          // Cible inexistante : on garde les valeurs saisies pour correction.
          setMessage(
            "Cette personne n'a pas encore de compte sur notre service, vous pourrez lui transférer l'étude quand ce sera le cas",
          );
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Erreur lors du transfert');
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="c-input__group col-md-2 col-sm-16 input-size-small d-block">
          <input className="c-input" type="text" name="lastname" required />
          <label className="c-input__label">Nom</label>
        </div>

        <div className="c-input__group col-md-2 col-sm-16 input-size-small d-block">
          <input className="c-input" type="text" name="firstname" required />
          <label className="c-input__label">Prénom</label>
        </div>

        <div className="c-input__group col-md-6 col-sm-16 input-size-medium d-block">
          <input className="c-input pr-5" type="email" name="mail" required />
          <label className="c-input__label">Adresse mail</label>
        </div>

        <em
          className="c-icon medium empty large mail input-icon c-input__icone-mail"
          aria-hidden="true"
        />

        <button type="submit" className="c-input__setting" disabled={pending}>
          TRANSFÉRER
        </button>
      </div>
      {message && <div className="c-subtitle-grey mt-2">{message}</div>}
    </form>
  );
}
