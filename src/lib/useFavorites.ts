import { useState } from 'react';

export const MAX_FAVORITES = 6;

interface Stored {
  favorites: string[];
  active: string[];
}

function read(key: string): Stored | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!Array.isArray(parsed.favorites) || !Array.isArray(parsed.active)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(key: string, value: Stored) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // confort seulement : sans stockage, on repart de la présélection
  }
}

/** Critères favoris (max 6, affichés en pastilles) et, parmi eux, ceux qui
 * sont affichés (au moins 1). Mémorisé sur cet appareil. Tant que rien n'est
 * mémorisé, la présélection (qui peut dépendre des données) s'applique. */
export function useFavorites<T extends string>(
  storageKey: string,
  allowed: readonly T[],
  defaultFavorites: T[],
  defaultActive: T[],
) {
  const [stored, setStored] = useState<Stored | null>(() => read(storageKey));

  const isAllowed = (v: string): v is T => (allowed as readonly string[]).includes(v);
  const favorites: T[] = (stored?.favorites ?? defaultFavorites).filter(isAllowed).slice(0, MAX_FAVORITES);
  const activeRaw = (stored?.active ?? defaultActive).filter((v) => (favorites as string[]).includes(v));
  const active: T[] = favorites.filter((f) => activeRaw.includes(f));
  if (active.length === 0 && favorites.length > 0) active.push(favorites[0]);

  const save = (next: Stored) => {
    setStored(next);
    write(storageKey, next);
  };

  const add = (v: T) => {
    if (favorites.includes(v) || favorites.length >= MAX_FAVORITES) return;
    save({ favorites: [...favorites, v], active: [...active, v] });
  };

  const remove = (v: T) => {
    const nextFav = favorites.filter((f) => f !== v);
    save({ favorites: nextFav, active: active.filter((a) => a !== v) });
  };

  const toggle = (v: T) => {
    if (active.includes(v)) {
      if (active.length > 1) save({ favorites, active: active.filter((a) => a !== v) });
    } else {
      save({ favorites, active: [...active, v] });
    }
  };

  return { favorites, active, add, remove, toggle };
}
