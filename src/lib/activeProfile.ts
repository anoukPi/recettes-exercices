import { getCurrentUserId } from './auth';

// Profil actif (toi, un enfant…) pour toutes les lectures/écritures de données
// personnelles. Tenu par ProfileProvider ; tant qu'il n'est pas connu, on
// retombe sur le profil principal (id = id du compte), comme avant les profils.
let activeId: string | null = null;

export function setActiveProfileId(id: string | null) {
  activeId = id;
}

export async function activeProfileId(): Promise<string> {
  if (activeId) return activeId;
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour continuer.');
  return userId;
}

const STORAGE_PREFIX = 'kaly-profil-actif:';

export function rememberedProfileId(accountId: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + accountId);
  } catch {
    return null;
  }
}

export function rememberProfileId(accountId: string, profileId: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + accountId, profileId);
  } catch {
    // confort seulement : sans stockage, on revient au profil principal
  }
}
