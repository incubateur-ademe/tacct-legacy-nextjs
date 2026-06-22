import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';

export type FlashType = 'success' | 'warning' | 'error';

export interface FlashMessage {
  id: string;
  type: FlashType;
  title: string;
  content?: string;
}

export const FLASH_COOKIE = 'tacct_flash';

/**
 * Pose un message flash dans un cookie, consommé au rendu suivant par le
 * `Toaster`. À appeler dans une server action avant tout `redirect()`.
 */
export async function setFlash(
  title: string,
  type: FlashType = 'success',
  content?: string,
): Promise<void> {
  const store = await cookies();
  const payload: FlashMessage = {
    id: randomUUID(),
    type,
    title,
    ...(content ? { content } : {}),
  };
  store.set(FLASH_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30,
  });
}

export async function consumeFlash(): Promise<FlashMessage | null> {
  const store = await cookies();
  const raw = store.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FlashMessage;
  } catch {
    return null;
  }
}
