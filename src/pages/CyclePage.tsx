import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateKeyFr, toDateKey } from '../lib/date';
import { addCycleEntry, deleteCycleEntry, listCycleEntries } from '../api/cycle';
import { getProfile, saveProfile } from '../api/profile';
import { averageCycleLength, canTrackCycle, cycleDayInfo, PHASE_LABELS, predictNextPeriod, recentCycleLengths } from '../lib/cycle';
import { daysBetween } from '../lib/date';
import { CycleCalendar } from '../components/CycleCalendar';
import { useSession } from '../lib/auth';
import { useProfiles } from '../lib/profileContext';
import type { CycleEntry, Profile } from '../types';

export function CyclePage() {
  const { session, loading: authLoading } = useSession();
  const { active } = useProfiles();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(toDateKey(new Date()));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [periodLength, setPeriodLength] = useState('');
  const [savingLength, setSavingLength] = useState(false);
  // Durée des règles : discrète une fois renseignée, dépliée pour modifier.
  const [editingLength, setEditingLength] = useState(false);

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
        special_situation: profile.special_situation,
      });
      setProfile(updated);
      setEditingLength(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSavingLength(false);
    }
  };

  const cycleLength = averageCycleLength(entries);
  const predicted = predictNextPeriod(entries, profile?.period_length_days ?? null);
  const today = toDateKey(new Date());
  const todayInfo = cycleDayInfo(today, entries, profile?.period_length_days ?? null);
  const lengthKnown = profile?.period_length_days != null;
  const recentLengths = recentCycleLengths(entries);
  // Date prévue passée sans règles notées : on le dit plutôt que d'enchaîner
  // sur un cycle inventé. La prochaine date notée recalera tout.
  const lateSince = predicted && predicted.start < today ? predicted.start : null;
  const lateDays = lateSince ? daysBetween(lateSince, today) : 0;

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

  // Profil actif qui n'est pas une femme majeure (lien direct, favori…).
  if (active && !canTrackCycle(active)) {
    return (
      <section className="journal">
        <h2>Cycle</h2>
        <p className="hint">
          Le suivi du cycle est proposé aux femmes majeures. Vérifie le sexe et la date de naissance dans le{' '}
          <Link to="/settings?onglet=profil">profil</Link> si ce n’est pas le bon réglage.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <h2>Cycle</h2>
      {lateSince && (
        <div className="block b-corail cycle-today">
          <h4 className="block-label">Aujourd'hui</h4>
          <p className="block-number-line">
            <span className="block-number">+{lateDays}</span>
            <span className="block-caption">jour{lateDays > 1 ? 's' : ''} de retard ?</span>
          </p>
          <p className="block-meta">
            Tes règles étaient prévues le {formatDateKeyFr(lateSince)} et ne sont pas encore notées.
            Note-les dès qu'elles arrivent : les prochaines dates se recalculeront.
          </p>
        </div>
      )}
      {todayInfo && !lateSince && (
        <div className={`block cycle-today phase-block-${todayInfo.phase}`}>
          <h4 className="block-label">Aujourd'hui</h4>
          <p className="block-number-line">
            <span className="block-number">J{todayInfo.cycleDay}</span>
            <span className="block-caption">{PHASE_LABELS[todayInfo.phase]}</span>
          </p>
          <p className="block-meta">
            Prochaines règles {formatDateKeyFr(todayInfo.nextStart)}
            {` (dans ${daysBetween(today, todayInfo.nextStart)} jours)`}
            {todayInfo.ovulation > today &&
              ` · ovulation estimée ${formatDateKeyFr(todayInfo.ovulation)}`}
          </p>
        </div>
      )}

      <CycleCalendar entries={entries} periodLengthDays={profile?.period_length_days ?? null} />

      <p className="hint cycle-disclaimer">
        {recentLengths.length === 0
          ? `Cycle de ${cycleLength} jours par défaut : note au moins deux débuts de règles pour que Kaly calcule le tien.`
          : `Recalculé à chaque date notée : cycle typique de ${cycleLength} jours (médiane) d'après ${
              recentLengths.length > 1 ? `tes ${recentLengths.length} derniers cycles` : 'ton dernier cycle'
            } (${recentLengths.join(', ')} jours).`}{' '}
        Ovulation estimée ~14 jours avant les règles suivantes. Ce n'est ni une prédiction médicale
        ni une méthode de contraception.
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

          {lengthKnown && !editingLength ? (
            <p className="hint cycle-length-line">
              Durée des règles : {profile?.period_length_days} jours ·{' '}
              <button type="button" className="link-button" onClick={() => setEditingLength(true)}>
                modifier
              </button>
            </p>
          ) : (
            <div className="cycle-length-edit">
              <label htmlFor="cycle-period-length" className="hint">
                Durée moyenne de tes règles (jours)
              </label>
              <div className="journal-add-row two-cols">
                <input
                  id="cycle-period-length"
                  type="number"
                  min="1"
                  max="14"
                  step="1"
                  value={periodLength}
                  onChange={(e) => setPeriodLength(e.target.value)}
                  placeholder="ex. 5"
                />
                <button type="button" onClick={handleSavePeriodLength} disabled={savingLength || !profile}>
                  {savingLength ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {entries.length > 0 && predicted && !todayInfo && (
        <p className="hint">
          Prochaine échéance estimée : du {formatDateKeyFr(predicted.start)} au {formatDateKeyFr(predicted.end)}.
        </p>
      )}

      <h3 className="cycle-history-title">Dates notées</h3>
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
