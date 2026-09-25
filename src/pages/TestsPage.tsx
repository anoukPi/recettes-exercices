import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageIntro } from '../components/PageIntro';
import { Link, useSearchParams } from 'react-router-dom';
import { toDateKey } from '../lib/date';
import {
  addFitnessTest,
  deleteFitnessTest,
  listFitnessTests,
  signedTestMediaUrl,
  uploadTestMedia,
} from '../api/fitnessTests';
import { getProfile, saveProfile } from '../api/profile';
import { useSession } from '../lib/auth';
import {
  RUFFIER_TEST_NAME,
  TEST_CATEGORIES,
  definitionFor,
  ruffierIndex,
  type TestCategory,
} from '../lib/fitnessTestCatalog';
import type { FitnessTest, FitnessTestCategory, Profile } from '../types';
import { TestIllustrationView } from '../components/TestIllustrationView';
import { TrendChart } from '../components/TrendChart';

type Tab = FitnessTestCategory | 'tendances';

function formatValue(n: number): string {
  return n.toLocaleString('fr-CH', { maximumFractionDigits: 2 });
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseNumber(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

/** Photo ou vidéo d'un test, stockée en privé : URL signée chargée à l'affichage. */
function TestMedia({ path, kind }: { path: string; kind: 'photo' | 'video' }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    signedTestMediaUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (!url) return <span className="hint">Chargement…</span>;
  return kind === 'photo' ? (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Photo du test" className="test-media-thumb" />
    </a>
  ) : (
    <video src={url} controls preload="metadata" className="test-media-video" />
  );
}

function CategoryForm({
  category,
  tests,
  profile,
  onSaved,
}: {
  category: TestCategory;
  tests: FitnessTest[];
  profile: Profile | null;
  onSaved: (savedNames: string[]) => void;
}) {
  const [entryDate, setEntryDate] = useState(toDateKey(new Date()));
  const [values, setValues] = useState<Record<string, string>>({});
  const [pulses, setPulses] = useState({ p0: '', p1: '', p2: '' });
  const [otherName, setOtherName] = useState('');
  const [otherValue, setOtherValue] = useState('');
  const [otherUnit, setOtherUnit] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  // Photo seulement pour les mesures corporelles (suivi visuel de silhouette).
  const allowsPhoto = category.value === 'mesures';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const lastByName = useMemo(() => {
    const map = new Map<string, FitnessTest>();
    for (const t of tests) map.set(t.test_name.toLowerCase(), t); // triés par date croissante
    return map;
  }, [tests]);

  const p0 = parseNumber(pulses.p0);
  const p1 = parseNumber(pulses.p1);
  const p2 = parseNumber(pulses.p2);
  const ruffier = p0 !== null && p1 !== null && p2 !== null ? ruffierIndex(p0, p1, p2) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const rows: { name: string; value: number; unit: string }[] = [];
    for (const t of category.tests) {
      const v = t.name === RUFFIER_TEST_NAME ? ruffier : parseNumber(values[t.name] ?? '');
      if (v !== null) rows.push({ name: t.name, value: v, unit: t.unit });
    }
    const otherV = parseNumber(otherValue);
    if (otherName.trim() && otherV !== null) {
      if (!otherUnit.trim()) {
        setError("Précise l'unité de ton autre test (kg, cm, s, répétitions…).");
        return;
      }
      rows.push({ name: otherName.trim(), value: otherV, unit: otherUnit.trim() });
    }
    if (rows.length === 0) {
      setError('Renseigne au moins un résultat.');
      return;
    }

    setSaving(true);
    try {
      // Une photo par saisie (mesures corporelles), rattachée à chaque résultat du jour.
      const photoPath = allowsPhoto && photo ? await uploadTestMedia(photo) : null;
      for (const r of rows) {
        await addFitnessTest({
          entry_date: entryDate,
          test_name: r.name,
          value: r.value,
          unit: r.unit,
          category: category.value,
          photo_path: photoPath,
          video_path: null,
        });
      }
      const weight = rows.find((r) => r.name.toLowerCase() === 'poids' && r.unit === 'kg');
      if (weight && profile) await saveProfile({ ...profile, weight_kg: weight.value });

      setValues({});
      setPulses({ p0: '', p1: '', p2: '' });
      setOtherName('');
      setOtherValue('');
      setOtherUnit('');
      setPhoto(null);
      setFileKey((k) => k + 1);
      onSaved(rows.map((r) => r.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="journal-add-form test-form" onSubmit={handleSubmit}>
      <p className="hint">{category.intro}</p>
      {error && <p className="error">{error}</p>}

      <div className="field test-date">
        <label htmlFor={`test-date-${category.value}`}>Date</label>
        <input
          id={`test-date-${category.value}`}
          type="date"
          value={entryDate}
          max={toDateKey(new Date())}
          onChange={(e) => setEntryDate(e.target.value)}
        />
      </div>

      <ul className="test-list">
        {category.tests.map((t) => {
          const last = lastByName.get(t.name.toLowerCase());
          return (
            <li key={t.name} className="test-item">
              <div className="test-item-head">
                <label htmlFor={`test-${t.name}`}>{t.name}</label>
                {last && (
                  <span className="hint">
                    dernier : {formatValue(last.value)} {last.unit} ({formatDate(last.entry_date)})
                  </span>
                )}
              </div>
              <p className="hint">{t.how}</p>
              {t.illustration && <TestIllustrationView illustration={t.illustration} />}
              {t.name === RUFFIER_TEST_NAME ? (
                <div className="ruffier">
                  <p className="hint">
                    Pouls sur 15 s × 4 : P0 au repos, P1 juste après 30 squats en 45 s, P2 une minute
                    plus tard.
                  </p>
                  <div className="ruffier-inputs">
                    {(['p0', 'p1', 'p2'] as const).map((k) => (
                      <input
                        key={k}
                        type="number"
                        inputMode="numeric"
                        value={pulses[k]}
                        onChange={(e) => setPulses((prev) => ({ ...prev, [k]: e.target.value }))}
                        placeholder={k.toUpperCase()}
                        aria-label={`Pouls ${k.toUpperCase()}`}
                      />
                    ))}
                  </div>
                  {ruffier !== null && (
                    <p className="ruffier-result">
                      Indice : <strong>{formatValue(ruffier)}</strong>{' '}
                      <span className="hint">
                        (
                        {ruffier < 0
                          ? 'très bon'
                          : ruffier < 5
                            ? 'bon'
                            : ruffier < 10
                              ? 'moyen'
                              : ruffier < 15
                                ? 'faible'
                                : 'à retravailler'}
                        )
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="test-value">
                  <input
                    id={`test-${t.name}`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={values[t.name] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [t.name]: e.target.value }))}
                    placeholder="Résultat"
                  />
                  <span className="test-unit">{t.unit}</span>
                </div>
              )}
            </li>
          );
        })}
        <li className="test-item">
          <div className="test-item-head">
            <label htmlFor={`test-other-${category.value}`}>Autre test (optionnel)</label>
          </div>
          <div className="test-other">
            <input
              id={`test-other-${category.value}`}
              type="text"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              placeholder="Nom du test"
            />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              placeholder="Résultat"
            />
            <input type="text" value={otherUnit} onChange={(e) => setOtherUnit(e.target.value)} placeholder="Unité" />
          </div>
        </li>
      </ul>

      {allowsPhoto && (
        <div className="test-media-inputs" key={fileKey}>
          <label className="test-file">
            📷 Photo de silhouette (optionnel)
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
          <p className="hint">Privée : toi seule peux la voir. Même tenue, même endroit, même lumière d'un mois à l'autre.</p>
        </div>
      )}

      <button type="submit" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer mes résultats'}
      </button>
    </form>
  );
}

function TrendsView({ tests, onDelete }: { tests: FitnessTest[]; onDelete: (id: string) => void }) {
  const names = useMemo(() => {
    const set = new Set(tests.map((t) => t.test_name));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [tests]);
  const [selected, setSelected] = useState<string>(() => names.find((n) => n === 'Poids') ?? names[0] ?? '');
  const current = names.includes(selected) ? selected : (names[0] ?? '');

  if (names.length === 0) {
    return <p className="empty">Aucun résultat pour l'instant : fais ton premier test dans une des catégories.</p>;
  }

  const entries = tests.filter((t) => t.test_name === current);
  const unit = entries[0]?.unit ?? '';
  const def = definitionFor(current);
  const first = entries[0];
  const last = entries[entries.length - 1];
  const delta = first && last && entries.length > 1 ? last.value - first.value : null;
  const good =
    delta === null || !def || def.better === 'neutre' || delta === 0
      ? null
      : (def.better === 'plus') === delta > 0;

  return (
    <div className="test-trends">
      <div className="journal-meal-picker">
        <label htmlFor="test-trend-select">Tendance de :</label>
        <select id="test-trend-select" value={current} onChange={(e) => setSelected(e.target.value)}>
          {TEST_CATEGORIES.map((c) => {
            const inCat = names.filter((n) => tests.some((t) => t.test_name === n && t.category === c.value));
            return inCat.length > 0 ? (
              <optgroup key={c.value} label={c.label}>
                {inCat.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
          {names.some((n) => !tests.some((t) => t.test_name === n && t.category)) && (
            <optgroup label="Autres">
              {names
                .filter((n) => !tests.some((t) => t.test_name === n && t.category))
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </optgroup>
          )}
        </select>
      </div>

      {delta !== null && (
        <p className={`test-delta${good === true ? ' good' : good === false ? ' bad' : ''}`}>
          {delta > 0 ? '+' : ''}
          {formatValue(delta)} {unit} depuis le {formatDate(first.entry_date)}
          {good === true ? ' — bravo 🎉' : ''}
        </p>
      )}

      <TrendChart points={entries.map((t) => ({ date: t.entry_date, value: t.value }))} unit={unit} />

      <ul className="journal-entry-list">
        {entries
          .slice()
          .reverse()
          .map((t) => (
            <li key={t.id} className="journal-entry test-entry">
              <div className="journal-entry-row">
                <div className="journal-entry-main">
                  <span className="journal-entry-label">{formatDate(t.entry_date)}</span>
                </div>
                <span className="journal-entry-kcal">
                  {formatValue(t.value)} {t.unit}
                </span>
                <button type="button" className="remove-row" onClick={() => onDelete(t.id)} aria-label="Supprimer">
                  ✕
                </button>
              </div>
              {(t.photo_path || t.video_path) && (
                <div className="test-entry-media">
                  {t.photo_path && <TestMedia path={t.photo_path} kind="photo" />}
                  {t.video_path && <TestMedia path={t.video_path} kind="video" />}
                </div>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

export function TestsPage() {
  const { session, loading: authLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tests, setTests] = useState<FitnessTest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const requested = searchParams.get('categorie');
  const tab: Tab =
    requested === 'tendances' || TEST_CATEGORIES.some((c) => c.value === requested)
      ? (requested as Tab)
      : 'mesures';

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

  const handleDelete = async (id: string) => {
    await deleteFitnessTest(id);
    setTests((prev) => prev.filter((t) => t.id !== id));
  };

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

  const category = TEST_CATEGORIES.find((c) => c.value === tab);

  return (
    <section className="journal tests-page">
      <h2>Tests</h2>
      <PageIntro id="tests" emoji="💪" title="Tes progrès, mois après mois">
        <p>
          Quelques tests simples à faire chez toi une fois par mois : mesures, force (tractions, gainage…), souplesse,
          endurance. Chaque test est expliqué et illustré. Tes courbes apparaissent dans « Tendances » et dans Bilan.
        </p>
      </PageIntro>
      <p className="hint">Un bilan par mois, dans les mêmes conditions : c'est ce qui rend tes progrès visibles.</p>

      <div className="section-tabs settings-tabs" role="tablist" aria-label="Catégories de tests">
        {TEST_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="tab"
            aria-selected={tab === c.value}
            className={`tag-chip${tab === c.value ? ' selected' : ''}`}
            onClick={() => {
              setSavedMessage(null);
              setSearchParams({ categorie: c.value });
            }}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tendances'}
          className={`tag-chip${tab === 'tendances' ? ' selected' : ''}`}
          onClick={() => setSearchParams({ categorie: 'tendances' })}
        >
          📈 Tendances
        </button>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {savedMessage && <p className="test-saved">{savedMessage}</p>}

      {category && (
        <CategoryForm
          key={category.value}
          category={category}
          tests={tests}
          profile={profile}
          onSaved={(names) => {
            setSavedMessage(`✓ ${names.length} résultat${names.length > 1 ? 's' : ''} enregistré${names.length > 1 ? 's' : ''} : ${names.join(', ')}.`);
            load();
          }}
        />
      )}
      {tab === 'tendances' && <TrendsView tests={tests} onDelete={handleDelete} />}
    </section>
  );
}
