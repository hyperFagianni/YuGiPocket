import { signInAnonymously } from 'firebase/auth';

import { getConfigValue, setConfigValue } from '@/db/repositories/configRepo';
import { CONFIG_KEYS } from '@/db/schema';
import { auth, isTradeBoardConfigured } from '@/services/firebase';

/**
 * Garantisce una sessione anonima Firebase attiva. Non richiede nickname: quello si imposta a
 * parte, solo quando l'utente entra per la prima volta nella bacheca online. A differenza di un
 * modello relazionale, qui non serve una collection "profiles" separata: il nickname viene salvato
 * solo localmente e "portato con sé" ad ogni annuncio creato o accettato (denormalizzato nel
 * documento Firestore stesso).
 */
export async function ensureAnonymousSession(): Promise<string> {
  if (!auth) throw new Error('Bacheca online non configurata su questo build.');
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

export async function getLocalNickname(): Promise<string | null> {
  return getConfigValue(CONFIG_KEYS.tradeBoardNickname);
}

export async function registerNickname(nickname: string): Promise<void> {
  if (!auth) throw new Error('Bacheca online non configurata su questo build.');
  await ensureAnonymousSession();
  await setConfigValue(CONFIG_KEYS.tradeBoardNickname, nickname.trim());
}

export async function isReadyForTradeBoard(): Promise<boolean> {
  if (!isTradeBoardConfigured) return false;
  const nickname = await getLocalNickname();
  return Boolean(nickname);
}
