import { useEffect, useState, type FormEvent } from 'react';
import { getProfile, saveProfile } from '../api/profile';
import { computeDailyTargets } from '../lib/dailyNeeds';
import { useMeasuredActivity } from '../lib/useMeasuredActivity';
import { useSession } from '../lib/auth';
import {
  ACTIVITY_LEVELS,
  CLIMBING_BOULDER_COLORS,
  CLIMBING_ROUTE_GRADES,
  GOALS,
  SPORTS_LIST,
  type Profile,
} from '../types';

export function ProfileSection() {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [sex, setSex] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [goalWeightChangeKg, setGoalWeightChangeKg] = useState('');
  const [goalTimeframeWeeks, setGoalTimeframeWeeks] = useState('');
  const [sports, setSports] = useState<string[]>([]);
  const [climbingRouteLevel, setClimbingRouteLevel] = useState('');
  const [climbingBoulderLevel, setClimbingBoulderLevel] = useState('');

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        if (p) {
          setSex(p.sex ?? '');
          setBirthDate(p.birth_date ?? '');
          setHeightCm(p.height_cm?.toString() ?? '');
          setWeightKg(p.weight_kg?.toString() ?? '');
          setActivityLevel(p.activity_level ?? '');
          setGoal(p.goal ?? '');
          setGoalWeightChangeKg(p.goal_weight_change_kg?.toString() ?? '');
          setGoalTimeframeWeeks(p.goal_timeframe_weeks?.toString() ?? '');
          setSports(p.sports ?? []);
          setClimbingRouteLevel(p.climbing_route_level ?? '');
          setClimbingBoulderLevel(p.climbing_boulder_level ?? '');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleSport = (sport: string) => {
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  };

  const practicesRouteClimbing = sports.includes('Escalade de voie');
  const practicesBoulderClimbing = sports.includes('Escalade de bloc');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await saveProfile({
        sex: sex === 'homme' || sex === 'femme' ? sex : null,
        birth_date: birthDate || null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        activity_level: (activityLevel || null) as Profile['activity_level'],
        goal: (goal || null) as Profile['goal'],
        goal_weight_change_kg: goalWeightChangeKg ? parseFloat(goalWeightChangeKg) : null,
        goal_timeframe_weeks: goalTimeframeWeeks ? parseFloat(goalTimeframeWeeks) : null,
        sports,
        climbing_route_level: practicesRouteClimbing ? climbingRouteLevel || null : null,
        climbing_boulder_level: practicesBoulderClimbing ? climbingBoulderLevel || null : null,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const measuredActivity = useMeasuredActivity();
  // Recalculé à partir du formulaire en direct (pas du profil déjà enregistré)
  // pour que l'estimation reflète immédiatement un changement, avant même de
  // cliquer sur "Enregistrer le profil".
  const draftProfile: Profile = {
    id: profile?.id ?? '',
    updated_at: profile?.updated_at ?? '',
    sex: sex === 'homme' || sex === 'femme' ? sex : null,
    birth_date: birthDate || null,
    height_cm: heightCm ? parseFloat(heightCm) : null,
    weight_kg: weightKg ? parseFloat(weightKg) : null,
    activity_level: (activityLevel || null) as Profile['activity_level'],
    goal: (goal || null) as Profile['goal'],
    goal_weight_change_kg: goalWeightChangeKg ? parseFloat(goalWeightChangeKg) : null,
    goal_timeframe_weeks: goalTimeframeWeeks ? parseFloat(goalTimeframeWeeks) : null,
    sports,
    climbing_route_level: climbingRouteLevel || null,
    climbing_boulder_level: climbingBoulderLevel || null,
  };
  const targets = computeDailyTargets(draftProfile, measuredActivity.avgDailyActivityKcal ?? undefined);

  if (loading) return <p>Chargement…</p>;

  if (!session) {
    return (
      <section className="reference-manager profile-section">
        <h3>Profil</h3>
        <p className="hint">Connecte-toi ci-dessus pour renseigner ton profil.</p>
      </section>
    );
  }

  return (
    <section className="reference-manager profile-section">
      <h3>Profil</h3>
      <p className="hint">
        Sert à calculer tes besoins caloriques et en macros journaliers (formule de
        Mifflin-St Jeor). Rien de médical — un ordre de grandeur pour te repérer.
      </p>
      {error && <p className="error">{error}</p>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="profile-sex">Sexe</label>
          <select id="profile-sex" value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">—</option>
            <option value="femme">Femme</option>
            <option value="homme">Homme</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="profile-birth">Date de naissance</label>
          <input
            id="profile-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="profile-height">Taille (cm)</label>
          <input
            id="profile-height"
            type="number"
            step="any"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="profile-weight">Poids (kg)</label>
          <input
            id="profile-weight"
            type="number"
            step="any"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="profile-activity">Niveau d'activité</label>
          <select
            id="profile-activity"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
          >
            <option value="">—</option>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Sports pratiqués</label>
          <div className="sports-checklist">
            {SPORTS_LIST.map((sport) => (
              <label key={sport} className="sports-checklist-item">
                <input
                  type="checkbox"
                  checked={sports.includes(sport)}
                  onChange={() => toggleSport(sport)}
                />
                {sport}
              </label>
            ))}
          </div>
        </div>

        {practicesRouteClimbing && (
          <div className="field">
            <label htmlFor="profile-climbing-route">Niveau max actuel en voie</label>
            <select
              id="profile-climbing-route"
              value={climbingRouteLevel}
              onChange={(e) => setClimbingRouteLevel(e.target.value)}
            >
              <option value="">—</option>
              {CLIMBING_ROUTE_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
        )}

        {practicesBoulderClimbing && (
          <div className="field">
            <label htmlFor="profile-climbing-boulder">Niveau max actuel en bloc (couleur)</label>
            <select
              id="profile-climbing-boulder"
              value={climbingBoulderLevel}
              onChange={(e) => setClimbingBoulderLevel(e.target.value)}
            >
              <option value="">—</option>
              {CLIMBING_BOULDER_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="profile-goal">Objectif</label>
          <select id="profile-goal" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">—</option>
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="profile-goal-weight">
            Objectif précis (optionnel) — variation de poids visée
          </label>
          <input
            id="profile-goal-weight"
            type="number"
            step="any"
            value={goalWeightChangeKg}
            onChange={(e) => setGoalWeightChangeKg(e.target.value)}
            placeholder="ex. -1 (perdre 1kg) ou 2 (prendre 2kg)"
          />
        </div>

        <div className="field">
          <label htmlFor="profile-goal-weeks">Sur combien de semaines</label>
          <input
            id="profile-goal-weeks"
            type="number"
            step="any"
            value={goalTimeframeWeeks}
            onChange={(e) => setGoalTimeframeWeeks(e.target.value)}
            placeholder="ex. 8"
          />
        </div>
        {goalWeightChangeKg && goalTimeframeWeeks && (
          <p className="hint">
            Remplace le déficit/surplus standard de "{goal || 'objectif'}" par un calcul basé sur
            ce rythme précis.
          </p>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le profil'}
        </button>
        {saved && <span className="profile-saved-hint">Enregistré ✓</span>}
      </form>

      {targets && (
        <div className="profile-targets">
          <h4>Tes objectifs journaliers estimés</h4>
          <ul>
            <li>{Math.round(targets.calories_kcal)} kcal</li>
            <li>{Math.round(targets.protein_g)} g de protéines</li>
            <li>{Math.round(targets.carbs_g)} g de glucides</li>
            <li>{Math.round(targets.fat_g)} g de lipides</li>
          </ul>
          <p className="hint">
            {targets.tdeeSource === 'measured'
              ? `Dépense calculée à partir de tes séances réellement loguées sur les 14 derniers jours (${measuredActivity.daysWithActivity} jour${measuredActivity.daysWithActivity > 1 ? 's' : ''} avec activité), plus fidèle que le niveau d'activité déclaré.`
              : "Dépense estimée à partir du niveau d'activité déclaré — logue au moins 3 séances sur 2 semaines dans le carnet d'activité pour passer à un calcul basé sur tes vraies dépenses."}
          </p>
        </div>
      )}
    </section>
  );
}
