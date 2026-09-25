import { createContext, useContext } from 'react';
import type { Profile } from '../types';

export interface ProfilesState {
  /** Profils du compte (le principal en premier) — vide tant que non connectée. */
  profiles: Profile[];
  active: Profile | null;
  accountId: string | null;
  switchTo: (profileId: string) => void;
  reload: () => Promise<void>;
}

export const ProfilesContext = createContext<ProfilesState>({
  profiles: [],
  active: null,
  accountId: null,
  switchTo: () => {},
  reload: async () => {},
});

export function useProfiles(): ProfilesState {
  return useContext(ProfilesContext);
}

export function profileLabel(profile: Profile | null, accountId: string | null): string {
  if (!profile) return 'Moi';
  return profile.display_name?.trim() || (profile.id === accountId ? 'Moi' : 'Profil');
}
