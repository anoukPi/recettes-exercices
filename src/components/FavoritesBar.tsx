import { MAX_FAVORITES } from '../lib/useFavorites';

export interface FavoriteOption {
  key: string;
  label: string;
  emoji: string;
  group: string;
}

/** Pastilles des critères favoris : toucher = afficher/masquer, × = retirer
 * des favoris ; la liste déroulante ajoute un critère (max 6), classé par
 * groupe (Alimentation / Activité, ou catégorie de test). */
export function FavoritesBar({
  options,
  favorites,
  active,
  onToggle,
  onRemove,
  onAdd,
  noun = 'critère',
  feminine = false,
}: {
  options: FavoriteOption[];
  favorites: string[];
  active: string[];
  onToggle: (key: string) => void;
  onRemove: (key: string) => void;
  onAdd: (key: string) => void;
  noun?: string;
  feminine?: boolean;
}) {
  const un = feminine ? 'une' : 'un';
  const le = feminine ? 'la' : 'le';
  const byKey = new Map(options.map((o) => [o.key, o]));
  const groups = Array.from(new Set(options.map((o) => o.group)));
  const full = favorites.length >= MAX_FAVORITES;

  return (
    <div className="fav-bar">
      <div className="fav-chips">
        {favorites.map((k) => {
          const o = byKey.get(k);
          if (!o) return null;
          const on = active.includes(k);
          return (
            <span key={k} className={`fav-chip${on ? ' selected' : ''}`}>
              <button type="button" aria-pressed={on} onClick={() => onToggle(k)} title={on ? 'Masquer' : 'Afficher'}>
                {o.emoji} {o.label}
              </button>
              <button
                type="button"
                className="fav-remove"
                onClick={() => onRemove(k)}
                aria-label={`Retirer ${o.label} des favoris`}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <select
        className="fav-add"
        value=""
        disabled={full}
        onChange={(e) => e.target.value && onAdd(e.target.value)}
        aria-label={`Ajouter ${un} ${noun}`}
      >
        <option value="">
          {full
            ? `${MAX_FAVORITES} favoris maximum — retire-en ${un} avec ×`
            : `＋ Ajouter ${un} ${noun} (${favorites.length}/${MAX_FAVORITES})`}
        </option>
        {groups.map((g) => {
          const available = options.filter((o) => o.group === g && !favorites.includes(o.key));
          return available.length > 0 ? (
            <optgroup key={g} label={g}>
              {available.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.emoji} {o.label}
                </option>
              ))}
            </optgroup>
          ) : null;
        })}
      </select>
      <p className="hint fav-hint">
        Touche {un} {noun} pour l’afficher ou {le} masquer, × pour {le} retirer des favoris.
      </p>
    </div>
  );
}
