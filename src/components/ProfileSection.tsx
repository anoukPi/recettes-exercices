import { useEffect, useState, type FormEvent } from 'react';
import { getProfile, saveProfile } from '../api/profile';
import { computeDailyTargets } from '../lib/dailyNeeds';
import { ACTIVITY_LEVELS, GOALS, type Profile } from '../types';

export function ProfileSection() {
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
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

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
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const targets = profile ? computeDailyTargets(profile) : null;

  if (loading) return <p>Chargement…</p>;

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
        </div>
      )}
    </section>
  );
}
