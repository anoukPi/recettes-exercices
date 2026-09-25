import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSession } from '../lib/auth';
import { listProfiles } from '../api/profile';
import { rememberProfileId, rememberedProfileId, setActiveProfileId } from '../lib/activeProfile';
import { ProfilesContext } from '../lib/profileContext';
import type { Profile } from '../types';

/** Charge les profils du compte et tient le profil actif (mémorisé sur cet
 * appareil). Les pages sont remontées à chaque changement de profil (clé),
 * pour recharger leurs données sans rien mélanger. */
export function ProfileProvider({ children }: { children: (activeKey: string) => ReactNode }) {
  const { session } = useSession();
  const accountId = session?.user.id ?? null;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const applyList = useCallback(
    (list: Profile[]) => {
      if (!accountId) return;
      setProfiles(list);
      setActiveId((current) => {
        const wanted = current ?? rememberedProfileId(accountId);
        return wanted && list.some((p) => p.id === wanted) ? wanted : accountId;
      });
    },
    [accountId],
  );

  const reload = useCallback(async () => {
    applyList(await listProfiles());
  }, [applyList]);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    listProfiles()
      .then((list) => {
        if (!cancelled) applyList(list);
      })
      .catch(() => {
        // Profils illisibles : on reste sur le profil principal.
        if (!cancelled) applyList([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, applyList]);

  const switchTo = useCallback(
    (profileId: string) => {
      if (!accountId) return;
      rememberProfileId(accountId, profileId);
      setActiveId(profileId);
    },
    [accountId],
  );

  const value = useMemo(
    () => ({
      profiles,
      active: profiles.find((p) => p.id === activeId) ?? null,
      accountId,
      switchTo,
      reload,
    }),
    [profiles, activeId, accountId, switchTo, reload],
  );

  // Source unique pour la couche données, fixée pendant le rendu — donc avant
  // que les pages (enfants) ne lancent leurs chargements.
  setActiveProfileId(accountId ? activeId : null);

  // Connectée : on attend de connaître le profil actif avant d'afficher les
  // pages, pour ne jamais charger les données du mauvais profil.
  if (accountId && !activeId) return null;

  return <ProfilesContext.Provider value={value}>{children(activeId ?? 'visiteur')}</ProfilesContext.Provider>;
}
