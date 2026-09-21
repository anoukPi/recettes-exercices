import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateKeyFr, toDateKey } from '../lib/date';
import { addCycleEntry, deleteCycleEntry, listCycleEntries } from '../api/cycle';
import { getProfile, saveProfile } from '../api/profile';
import { averageCycleLength, predictNextPeriod } from '../lib/cycle';
import { useSession } from '../lib/auth';
import type { CycleEntry, Profile } from '../types';

export function CyclePage() {
  const { session, loading: authLoading } = useSession();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(toDateKey(new Date()));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [periodLength, setPeriodLength] = useState('');
  const [savingLength, setSavingLength] = useState(false);

  const load = () => {
    setLoading(true);
    listCycleEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!session) return;
    load();
    getProfile()
      .then((p) => {
        setProfile(p);
        setPeriodLength(p?.period_length_days != null ? String(p.period_length_days) : '');
      })
      .catch(() => {});
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

  const handleSavePeriodLength = async () => {
    if (!profile) return;
    setSavingLength(true);
    setError(null);
    try {
      const days = periodLength ? parseInt(periodLength, 10) : null;
      const updated = await saveProfile({
        sex: profile.sex,
        birth_date: profile.birth_date,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        activity_level: profile.activity_level,
        goal: profile.goal,
        goal_weight_change_kg: profile.goal_weight_change_kg,
        goal_timeframe_weeks: profile.goal_timeframe_weeks,
        sports: profile.sports,
        climbing_route_level: profile.climbing_route_level,
        climbing_boulder_level: profile.climbing_boulder_level,
        period_length_days: days,
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSavingLength(false);
    }
  };

  const cycleLength = averageCycleLength(entries);
  const predicted = predictNextPeriod(entries, profile?.period_length_days ?? null);

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
        jours qui suivent (pertes de sang), t'indiquera si tu es en période de règles dans le
        Carnet, et estimera la prochaine échéance à partir de ton historique — le reste (envies,
        énergie...) varie trop d'une personne à l'autre pour que je t'affiche des chiffres
        inventés dessus.
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

        <div className="journal-add-form">
          <h3>Durée moyenne des règles</h3>
          <p className="hint">
            Sert à savoir si tu es dedans (indiqué dans le Carnet) et à estimer la fin de la
            prochaine échéance.
          </p>
          <div className="journal-add-row two-cols">
            <input
              type="number"
              min="1"
              max="14"
              step="1"
              value={periodLength}
              onChange={(e) => setPeriodLength(e.target.value)}
              placeholder="ex. 5 (jours)"
            />
            <button type="button" onClick={handleSavePeriodLength} disabled={savingLength || !profile}>
              {savingLength ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="summary-card">
          <h4>Prochaine échéance estimée</h4>
          {predicted ? (
            <p>
              Du <strong>{formatDateKeyFr(predicted.start)}</strong> au{' '}
              <strong>{formatDateKeyFr(predicted.end)}</strong>
            </p>
          ) : (
            <p className="hint">Pas encore assez de données.</p>
          )}
          <p className="hint">
            Basé sur un cycle moyen de {cycleLength} jours
            {entries.length < 2 ? ' (repère par défaut, pas encore assez d\'historique)' : ' (calculé depuis tes dates notées)'}
            {' '}et une durée de règles de {profile?.period_length_days ?? 5} jours
            {profile?.period_length_days == null ? ' (repère par défaut)' : ''}. Une estimation, pas
            une prédiction médicale.
          </p>
        </div>
      )}

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
