import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toDateKey } from '../lib/date';
import { addCycleEntry, deleteCycleEntry, listCycleEntries } from '../api/cycle';
import { useSession } from '../lib/auth';
import type { CycleEntry } from '../types';

export function CyclePage() {
  const { session, loading: authLoading } = useSession();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(toDateKey(new Date()));

  const load = () => {
    setLoading(true);
    listCycleEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleAdd = async () => {
    setError(null);
    try {
      await addCycleEntry(newDate);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCycleEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (authLoading) return null;

  if (!session) {
    return (
      <section className="journal">
        <p className="hint">
          Connecte-toi dans <Link to="/settings">Paramètres</Link> pour suivre ton cycle.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <h2>Cycle</h2>
      <p className="hint">
        Note le premier jour de tes règles. Kaly te rappellera de surveiller ton apport en fer les
        jours qui suivent (pertes de sang) — le reste (envies, énergie...) varie trop d'une personne
        à l'autre pour que je t'affiche des chiffres inventés dessus.
      </p>

      <div className="journal-add-forms">
        <div className="journal-add-form">
          <h3>Noter le début des règles</h3>
          {error && <p className="error">{error}</p>}
          <div className="journal-add-row two-cols">
            <input type="date" value={newDate} max={toDateKey(new Date())} onChange={(e) => setNewDate(e.target.value)} />
            <button type="button" onClick={handleAdd}>
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {loading && <p>Chargement…</p>}
      {!loading && entries.length === 0 && <p className="empty">Rien noté pour l'instant.</p>}

      <ul className="journal-entry-list">
        {entries.map((entry) => (
          <li key={entry.id} className="journal-entry">
            <div className="journal-entry-main">
              <span className="journal-entry-label">
                {new Date(entry.entry_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <button
              type="button"
              className="remove-row"
              onClick={() => handleDelete(entry.id)}
              aria-label="Supprimer"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
