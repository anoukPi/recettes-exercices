import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';
import { toDateKey } from '../lib/date';
import { addFitnessTest, deleteFitnessTest, listFitnessTests } from '../api/fitnessTests';
import { getProfile, saveProfile } from '../api/profile';
import { useSession } from '../lib/auth';
import type { FitnessTest, Profile } from '../types';

function TrendChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length < 2) return null;

  const width = 320;
  const height = 100;
  const padding = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="Tendance">
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="var(--primary)" />
      ))}
      <text x={padding} y={height - 6} className="trend-chart-label" fill="var(--text-muted)">
        {min}
        {unit}
      </text>
      <text x={width - padding} y={height - 6} textAnchor="end" className="trend-chart-label" fill="var(--text-muted)">
        {max}
        {unit}
      </text>
    </svg>
  );
}

export function TestsPage() {
  const { session, loading: authLoading } = useSession();
  const [tests, setTests] = useState<FitnessTest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [testName, setTestName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [entryDate, setEntryDate] = useState(toDateKey(new Date()));
  const [selectedTest, setSelectedTest] = useState('Poids');

  const load = () => {
    setLoading(true);
    Promise.all([listFitnessTests(), getProfile()])
      .then(([t, p]) => {
        setTests(t);
        setProfile(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const testNames = useMemo(() => {
    const names = new Set(tests.map((t) => t.test_name));
    names.add('Poids');
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [tests]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedValue = parseFloat(value.replace(',', '.'));
    if (!testName.trim() || Number.isNaN(parsedValue) || !unit.trim()) {
      setError('Renseigne un nom de test, une valeur et une unité.');
      return;
    }
    try {
      await addFitnessTest({
        entry_date: entryDate,
        test_name: testName.trim(),
        value: parsedValue,
        unit: unit.trim(),
      });
      if (testName.trim().toLowerCase() === 'poids' && unit.trim().toLowerCase() === 'kg' && profile) {
        await saveProfile({ ...profile, weight_kg: parsedValue });
      }
      setValue('');
      setSelectedTest(testName.trim());
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFitnessTest(id);
    setTests((prev) => prev.filter((t) => t.id !== id));
  };

  const entriesForSelected = tests.filter((t) => t.test_name === selectedTest);
  const chartPoints = entriesForSelected.map((t) => ({ date: t.entry_date, value: t.value }));
  const chartUnit = entriesForSelected[0]?.unit ?? '';

  if (authLoading) return null;

  if (!session) {
    return (
      <section className="journal">
        <p className="hint">
          Connecte-toi dans <Link to="/settings">Paramètres</Link> pour suivre tes tests.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <h2>Tests réguliers</h2>
      <p className="hint">
        Pesée mensuelle, tests de force ou d'endurance — note ce que tu veux suivre dans le temps.
      </p>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      {testNames.length > 0 && (
        <div className="journal-meal-picker">
          <label htmlFor="test-select">Voir la tendance de :</label>
          <select id="test-select" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
            {testNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      <TrendChart points={chartPoints} unit={chartUnit ? ` ${chartUnit}` : ''} />

      <ul className="journal-entry-list">
        {entriesForSelected
          .slice()
          .reverse()
          .map((t) => (
            <li key={t.id} className="journal-entry">
              <div className="journal-entry-main">
                <span className="journal-entry-label">
                  {new Date(t.entry_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <span className="journal-entry-kcal">
                {t.value} {t.unit}
              </span>
              <button type="button" className="remove-row" onClick={() => handleDelete(t.id)} aria-label="Supprimer">
                ✕
              </button>
            </li>
          ))}
      </ul>
      {!loading && entriesForSelected.length === 0 && <p className="empty">Rien noté pour ce test.</p>}

      <div className="journal-add-forms">
        <form className="journal-add-form" onSubmit={handleAdd}>
          <h3>Ajouter un résultat</h3>
          {error && <p className="error">{error}</p>}
          <div className="journal-add-row two-cols">
            <input type="date" value={entryDate} max={toDateKey(new Date())} onChange={(e) => setEntryDate(e.target.value)} />
            <SearchableSelect
              id="test-name"
              value={testName}
              onChange={setTestName}
              options={testNames}
              placeholder="Nom du test (ex: Poids, Squat max, 5km)"
            />
          </div>
          <div className="journal-add-row two-cols">
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Résultat"
              className="ingredient-qty"
            />
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unité (kg, min, reps...)" />
          </div>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </section>
  );
}
