import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';
import { addDays, formatDateKeyFr, toDateKey } from '../lib/date';
import { DEFAULT_MET, MET_VALUES, estimateCaloriesBurned, metForActivity } from '../lib/metValues';
import {
  addActivityEntry,
  deleteActivityEntry,
  getLastWorkoutSessionId,
  listPastActivityMets,
  listActivityEntries,
  updateActivityEntry,
} from '../api/activities';
import { getProfile } from '../api/profile';
import { listWorkoutSessions } from '../api/workoutSessions';
import { populateFromWorkoutSession } from '../api/sessionExercises';
import { useSession } from '../lib/auth';
import { SessionExercises } from '../components/SessionExercises';
import { TrainingTabs } from '../components/TrainingTabs';
import {
  CLIMBING_BOULDER_COLORS,
  CLIMBING_ROUTE_GRADES,
  INTENSITIES,
  TRAINING_TYPES,
  type ActivityEntry,
  type Intensity,
  type Profile,
  type TrainingType,
  type WorkoutSession,
} from '../types';

const ACTIVITY_TYPES = Object.keys(MET_VALUES);
const FEELING_SCALE = [1, 2, 3, 4, 5];

export function ActivityPage() {
  const { session, loading: authLoading } = useSession();
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // MET des activités déjà notées (dont les activités personnalisées), pour
  // les proposer et préremplir leur MET.
  const [customMets, setCustomMets] = useState<Record<string, number>>({});
  const [metInput, setMetInput] = useState('');
  const [metTouched, setMetTouched] = useState(false);

  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<Intensity | ''>('');
  const [trainingType, setTrainingType] = useState<TrainingType | ''>('');
  const [feltForm, setFeltForm] = useState('');
  const [effortIntensity, setEffortIntensity] = useState('');
  const [climbingRoutesCount, setClimbingRoutesCount] = useState('');
  const [climbingMaxAttempted, setClimbingMaxAttempted] = useState('');
  const [climbingMaxSent, setClimbingMaxSent] = useState('');
  const [climbingHardestColor, setClimbingHardestColor] = useState('');
  const [climbingMaxColorSends, setClimbingMaxColorSends] = useState('');
  const [climbingBelowMaxCount, setClimbingBelowMaxCount] = useState('');
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [searchParams] = useSearchParams();
  // « Je l'ai faite aujourd'hui » depuis une séance : /activity?seance=<id>
  const [selectedWorkoutSessionId, setSelectedWorkoutSessionId] = useState(searchParams.get('seance') ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const [lastWorkoutSessionId, setLastWorkoutSessionId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const isRouteClimbing = activityType === 'Escalade de voie';
  const isBoulderClimbing = activityType === 'Escalade de bloc';
  // MET proposé : celui de la table (Compendium), sinon celui de ta dernière
  // saisie de cette activité, sinon une valeur générique modérée.
  const suggestedMet = (type: string) => MET_VALUES[type] ?? customMets[type] ?? DEFAULT_MET;
  const activityOptions = useMemo(
    () => Array.from(new Set([...ACTIVITY_TYPES, ...Object.keys(customMets)])).sort((a, b) => a.localeCompare(b, 'fr')),
    [customMets],
  );

  const handleActivityTypeChange = (type: string) => {
    setActivityType(type);
    if (!metTouched) setMetInput(type.trim() ? String(suggestedMet(type.trim())) : '');
  };
  const workoutSessionById = useMemo(
    () => new Map(workoutSessions.map((s) => [s.id, s])),
    [workoutSessions],
  );

  const loadEntries = (date: string) => {
    setLoading(true);
    listActivityEntries(date)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntries(dateKey);
  }, [dateKey]);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    listWorkoutSessions().then(setWorkoutSessions).catch(() => {});
    getLastWorkoutSessionId().then(setLastWorkoutSessionId).catch(() => {});
    listPastActivityMets()
      .then((mets) => setCustomMets((prev) => ({ ...mets, ...prev })))
      .catch(() => {});
  }, []);

  const dayTotalCalories = useMemo(
    () => entries.reduce((sum, e) => sum + e.calories_kcal, 0),
    [entries],
  );

  const resetForm = () => {
    setActivityType('');
    setMetInput('');
    setMetTouched(false);
    setDuration('');
    setIntensity('');
    setTrainingType('');
    setFeltForm('');
    setEffortIntensity('');
    setClimbingRoutesCount('');
    setClimbingMaxAttempted('');
    setClimbingMaxSent('');
    setClimbingHardestColor('');
    setClimbingMaxColorSends('');
    setClimbingBelowMaxCount('');
    setSelectedWorkoutSessionId('');
    setEditingEntryId(null);
  };

  const handleStartEdit = (entry: ActivityEntry) => {
    setEditingEntryId(entry.id);
    setActivityType(entry.activity_type);
    setMetInput(String(entry.met));
    setMetTouched(true);
    setDuration(String(entry.duration_minutes));
    setIntensity(entry.intensity ?? '');
    setTrainingType(entry.training_type ?? '');
    setFeltForm(entry.felt_form != null ? String(entry.felt_form) : '');
    setEffortIntensity(entry.effort_intensity != null ? String(entry.effort_intensity) : '');
    setClimbingRoutesCount(entry.climbing_routes_count != null ? String(entry.climbing_routes_count) : '');
    setClimbingMaxAttempted(entry.climbing_max_attempted ?? '');
    setClimbingMaxSent(entry.climbing_max_sent ?? '');
    setClimbingHardestColor(entry.climbing_hardest_color ?? '');
    setClimbingMaxColorSends(
      entry.climbing_max_color_sends != null ? String(entry.climbing_max_color_sends) : '',
    );
    setClimbingBelowMaxCount(
      entry.climbing_below_max_count != null ? String(entry.climbing_below_max_count) : '',
    );
    setSelectedWorkoutSessionId(entry.workout_session_id ?? '');
    setFormError(null);
  };

  const handleSubmitActivity = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const type = activityType.trim();
    const minutes = parseFloat(duration.replace(',', '.'));

    if (!type) {
      setFormError('Choisis ou saisis une activité.');
      return;
    }
    if (Number.isNaN(minutes) || minutes <= 0) {
      setFormError('Renseigne une durée en minutes valide.');
      return;
    }
    if (!profile?.weight_kg) {
      setFormError('Renseigne ton poids dans les Paramètres pour estimer les calories dépensées.');
      return;
    }

    const manualMet = parseFloat(metInput.replace(',', '.'));
    if (metInput.trim() && (Number.isNaN(manualMet) || manualMet <= 0 || manualMet > 25)) {
      setFormError('Renseigne un MET entre 1 et 25 (ex. 3 marche, 6 escalade, 10 course rapide).');
      return;
    }
    const met = metInput.trim() ? manualMet : suggestedMet(type);
    const calories = estimateCaloriesBurned(met, profile.weight_kg, minutes);

    const input = {
      entry_date: dateKey,
      activity_type: type,
      duration_minutes: minutes,
      met,
      calories_kcal: calories,
      intensity: intensity || null,
      training_type: trainingType || null,
      felt_form: feltForm ? parseInt(feltForm, 10) : null,
      effort_intensity: effortIntensity ? parseInt(effortIntensity, 10) : null,
      climbing_routes_count: isRouteClimbing && climbingRoutesCount ? parseInt(climbingRoutesCount, 10) : null,
      climbing_max_attempted: isRouteClimbing ? climbingMaxAttempted || null : null,
      climbing_max_sent: isRouteClimbing ? climbingMaxSent || null : null,
      climbing_hardest_color: isBoulderClimbing ? climbingHardestColor || null : null,
      climbing_max_color_sends:
        isBoulderClimbing && climbingMaxColorSends ? parseInt(climbingMaxColorSends, 10) : null,
      climbing_below_max_count:
        isBoulderClimbing && climbingBelowMaxCount ? parseInt(climbingBelowMaxCount, 10) : null,
      workout_session_id: selectedWorkoutSessionId || null,
    };

    try {
      if (editingEntryId) {
        const updated = await updateActivityEntry(editingEntryId, input);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await addActivityEntry(input);

        if (selectedWorkoutSessionId) {
          const session = workoutSessionById.get(selectedWorkoutSessionId);
          if (session) await populateFromWorkoutSession(created.id, session, profile?.weight_kg ?? null);
          setLastWorkoutSessionId(selectedWorkoutSessionId);
        }
        loadEntries(dateKey);
      }
      setCustomMets((prev) => ({ ...prev, [type]: met }));
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteActivityEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingEntryId === id) resetForm();
  };

  const addCustomActivity = (name: string) => {
    if (!name) return;
    setCustomMets((prev) => (name in prev ? prev : { ...prev, [name]: metForActivity(name) }));
    handleActivityTypeChange(name);
  };

  if (authLoading) return null;

  if (!session) {
    return (
      <section className="journal">
        <TrainingTabs />
        <p className="hint">
          Connecte-toi dans <Link to="/settings">Paramètres</Link> pour voir et remplir ton carnet
          d'activité.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <TrainingTabs />
      <div className="journal-date-nav">
        <button type="button" onClick={() => setDateKey((d) => addDays(d, -1))}>
          ← <span className="date-nav-word">Veille</span>
        </button>
        <div className="journal-date-label">
          <strong>{formatDateKeyFr(dateKey)}</strong>
          <input
            type="date"
            className="journal-date-picker"
            value={dateKey}
            max={toDateKey(new Date())}
            onChange={(e) => e.target.value && setDateKey(e.target.value)}
          />
          {dateKey !== toDateKey(new Date()) && (
            <button type="button" className="link-button" onClick={() => setDateKey(toDateKey(new Date()))}>
              Revenir à aujourd'hui
            </button>
          )}
        </div>
        <button type="button" onClick={() => setDateKey((d) => addDays(d, 1))}>
          <span className="date-nav-word">Lendemain</span> →
        </button>
      </div>

      <div className="journal-summary">
        <div className="journal-summary-main">
          <div>
            <span className="journal-summary-value">{Math.round(dayTotalCalories)}</span>
            <span className="journal-summary-unit">kcal dépensées</span>
          </div>
        </div>
        {!profile?.weight_kg && (
          <p className="hint">
            Renseigne ton <Link to="/settings">poids dans les Paramètres</Link> pour estimer les
            calories dépensées.
          </p>
        )}
        {entries.length > 0 && (
          <p className="hint warning-hint">
            ⚠️ Estimation approximative (valeurs MET du Compendium of Physical Activities), pas une
            mesure réelle.
          </p>
        )}
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && entries.length === 0 && <p className="empty">Aucune activité loguée ce jour.</p>}

      <ul className="journal-entry-list">
        {entries.map((entry) => (
          <li key={entry.id} className="journal-entry activity-entry">
            <div className="journal-entry-row">
              <div className="journal-entry-main">
                <span className="journal-entry-label">{entry.activity_type}</span>
                <span className="journal-entry-qty">
                  {entry.duration_minutes} min
                  {entry.training_type && (
                    <> · {TRAINING_TYPES.find((t) => t.value === entry.training_type)?.label}</>
                  )}
                  {entry.intensity && (
                    <> · {INTENSITIES.find((i) => i.value === entry.intensity)?.label.toLowerCase()}</>
                  )}
                </span>
              </div>
              <span className="journal-entry-kcal">{Math.round(entry.calories_kcal)} kcal</span>
              <button type="button" className="link-button" onClick={() => handleStartEdit(entry)}>
                Modifier
              </button>
              <button
                type="button"
                className="remove-row"
                onClick={() => handleDelete(entry.id)}
                aria-label={`Supprimer ${entry.activity_type}`}
              >
                ✕
              </button>
            </div>
            {(entry.climbing_max_sent ||
              entry.climbing_hardest_color ||
              entry.felt_form ||
              entry.effort_intensity ||
              entry.workout_session_id) && (
              <p className="hint activity-detail-line">
                {entry.workout_session_id && workoutSessionById.get(entry.workout_session_id) && (
                  <>Séance : {workoutSessionById.get(entry.workout_session_id)?.title} · </>
                )}
                {entry.climbing_routes_count != null && <>{entry.climbing_routes_count} voies · </>}
                {entry.climbing_max_attempted && <>essayé {entry.climbing_max_attempted} · </>}
                {entry.climbing_max_sent && <>réussi {entry.climbing_max_sent} · </>}
                {entry.climbing_hardest_color && <>max {entry.climbing_hardest_color} · </>}
                {entry.climbing_max_color_sends != null && <>{entry.climbing_max_color_sends} dans ce niveau · </>}
                {entry.climbing_below_max_count != null && <>{entry.climbing_below_max_count} en dessous · </>}
                {entry.felt_form != null && <>forme {entry.felt_form}/5 · </>}
                {entry.effort_intensity != null && <>intensité {entry.effort_intensity}/5</>}
              </p>
            )}
            <SessionExercises activityEntryId={entry.id} />
          </li>
        ))}
      </ul>

      <div className="journal-add-forms">
        <form className="journal-add-form" id="ajouter" onSubmit={handleSubmitActivity}>
          <h3>{editingEntryId ? "Modifier l'activité" : "Qu'as-tu fait ce jour-là ?"}</h3>
          {formError && <p className="error">{formError}</p>}
          {!editingEntryId && (
            <p className="hint">
              Une de tes séances, ou une activité libre (escalade, course, vélo…) — précise ensuite le
              type d'activité et la durée pour estimer les calories.
            </p>
          )}
          {workoutSessions.length > 0 && (
            <div className="journal-add-row two-cols">
              <select
                value={selectedWorkoutSessionId}
                onChange={(e) => setSelectedWorkoutSessionId(e.target.value)}
              >
                <option value="">J'ai fait une séance… (optionnel)</option>
                {workoutSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              {lastWorkoutSessionId && workoutSessionById.get(lastWorkoutSessionId) && (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setSelectedWorkoutSessionId(lastWorkoutSessionId)}
                >
                  ↻ Répéter « {workoutSessionById.get(lastWorkoutSessionId)?.title} »
                </button>
              )}
            </div>
          )}

          <div className="journal-add-row two-cols">
            <input
              type="number"
              step="any"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Durée (min)"
              className="ingredient-qty"
            />
            <SearchableSelect
              id="activity-type"
              value={activityType}
              onChange={handleActivityTypeChange}
              options={activityOptions}
              placeholder="Activité (ou une nouvelle)"
              newLabel="Nouvelle activité"
              onAddNew={addCustomActivity}
            />
          </div>
          <div className="journal-add-row two-cols">
            <select value={trainingType} onChange={(e) => setTrainingType(e.target.value as TrainingType)}>
              <option value="">Type d'entraînement</option>
              {TRAINING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="met-field">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                max="25"
                value={metInput}
                onChange={(e) => {
                  setMetInput(e.target.value);
                  setMetTouched(true);
                }}
                placeholder="MET"
                aria-label="MET (intensité métabolique)"
              />
              <span className="hint">MET</span>
            </div>
          </div>
          <p className="hint">
            MET = intensité de l'activité (1 au repos, 3 marche, 6 escalade, 10 course rapide). Prérempli
            d'après l'activité choisie ; modifie-le si tu connais mieux ton effort. Une nouvelle activité
            est gardée avec son MET pour les prochaines fois.
          </p>

          {isRouteClimbing && (
            <div className="climbing-fields">
              <input
                type="number"
                step="1"
                min="0"
                value={climbingRoutesCount}
                onChange={(e) => setClimbingRoutesCount(e.target.value)}
                placeholder="Nb de voies grimpées"
              />
              <select value={climbingMaxAttempted} onChange={(e) => setClimbingMaxAttempted(e.target.value)}>
                <option value="">Niveau max essayé</option>
                {CLIMBING_ROUTE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select value={climbingMaxSent} onChange={(e) => setClimbingMaxSent(e.target.value)}>
                <option value="">Niveau max réussi</option>
                {CLIMBING_ROUTE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isBoulderClimbing && (
            <div className="climbing-fields">
              <select value={climbingHardestColor} onChange={(e) => setClimbingHardestColor(e.target.value)}>
                <option value="">Couleur la plus dure réussie</option>
                {CLIMBING_BOULDER_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="1"
                min="0"
                value={climbingMaxColorSends}
                onChange={(e) => setClimbingMaxColorSends(e.target.value)}
                placeholder="Nb réussis dans ce niveau"
              />
              <input
                type="number"
                step="1"
                min="0"
                value={climbingBelowMaxCount}
                onChange={(e) => setClimbingBelowMaxCount(e.target.value)}
                placeholder="Nb réussis niveaux en dessous"
              />
            </div>
          )}

          <div className="journal-add-row two-cols">
            <div className="feeling-scale">
              <label>Forme ressentie</label>
              <div className="feeling-scale-buttons">
                {FEELING_SCALE.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`feeling-btn${feltForm === String(n) ? ' active' : ''}`}
                    onClick={() => setFeltForm(String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="feeling-scale">
              <label>Intensité ressentie</label>
              <div className="feeling-scale-buttons">
                {FEELING_SCALE.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`feeling-btn${effortIntensity === String(n) ? ' active' : ''}`}
                    onClick={() => setEffortIntensity(String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="activity-form-actions">
            <button type="submit">{editingEntryId ? 'Enregistrer les modifications' : 'Ajouter'}</button>
            {editingEntryId && (
              <button type="button" className="link-button" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
