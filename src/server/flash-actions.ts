'use server';

import { cookies } from 'next/headers';
import { FLASH_COOKIE } from './flash';

/**
 * Supprime le cookie flash. Appelé par le `Toaster` une fois le message affiché
 * côté client, pour qu'il ne réapparaisse pas aux navigations suivantes.
 */
export async function clearFlash(): Promise<void> {
  (await cookies()).delete(FLASH_COOKIE);
}
