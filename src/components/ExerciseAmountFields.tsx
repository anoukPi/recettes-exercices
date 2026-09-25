import { useState } from 'react';
import { DURATION_UNITS, fromMinutes, toMinutes, type DurationUnit } from '../lib/exerciseFormat';

export interface ExerciseAmount {
  reps: number | null;
  duration_minutes: number | null;
  duration_unit: DurationUnit | null;
  load_kg: number | null;
}

interface ExerciseAmountFieldsProps {
  value: ExerciseAmount;
  onChange: (patch: Partial<ExerciseAmount>) => void;
  idPrefix: string;
}

function parseNumber(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

/** Répétitions OU durée (s / min / h), jamais les deux, + charge optionnelle
 * si on est lesté. Basculer de l'un à l'autre efface la valeur abandonnée. */
export function ExerciseAmountFields({ value, onChange, idPrefix }: ExerciseAmountFieldsProps) {
  const [mode, setMode] = useState<'reps' | 'duree'>(
    value.duration_minutes != null && value.reps == null ? 'duree' : 'reps',
  );
  const unit: DurationUnit = value.duration_unit ?? 'min';

  const switchMode = (next: 'reps' | 'duree') => {
    setMode(next);
    if (next === 'reps') onChange({ duration_minutes: null, duration_unit: null });
    else onChange({ reps: null, duration_unit: unit });
  };

  return (
    <div className="exercise-amount">
      <div className="exercise-amount-mode" role="group" aria-label="Répétitions ou durée">
        <button
          type="button"
          className={`tag-chip${mode === 'reps' ? ' selected' : ''}`}
          onClick={() => switchMode('reps')}
        >
          Répétitions
        </button>
        <button
          type="button"
          className={`tag-chip${mode === 'duree' ? ' selected' : ''}`}
          onClick={() => switchMode('duree')}
        >
          Durée
        </button>
      </div>
      <div className="exercise-amount-fields">
        {mode === 'reps' ? (
          <input
            id={`${idPrefix}-reps`}
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={value.reps ?? ''}
            onChange={(e) => onChange({ reps: parseNumber(e.target.value) })}
            placeholder="Répétitions"
            aria-label="Répétitions"
          />
        ) : (
          <div className="exercise-amount-duration">
            <input
              id={`${idPrefix}-duration`}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={value.duration_minutes != null ? fromMinutes(value.duration_minutes, unit) : ''}
              onChange={(e) => {
                const n = parseNumber(e.target.value);
                onChange({ duration_minutes: n === null ? null : toMinutes(n, unit), duration_unit: unit });
              }}
              placeholder="Durée"
              aria-label="Durée"
            />
            <select
              value={unit}
              onChange={(e) => {
                const nextUnit = e.target.value as DurationUnit;
                // On garde le nombre tapé et on change son unité (45 → 45 s).
                const shown = value.duration_minutes != null ? fromMinutes(value.duration_minutes, unit) : null;
                onChange({
                  duration_unit: nextUnit,
                  duration_minutes: shown === null ? null : toMinutes(shown, nextUnit),
                });
              }}
              aria-label="Unité de durée"
            >
              {DURATION_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <input
          id={`${idPrefix}-load`}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={value.load_kg ?? ''}
          onChange={(e) => onChange({ load_kg: parseNumber(e.target.value) })}
          placeholder="Charge (kg)"
          aria-label="Charge en kg (si lesté)"
        />
      </div>
    </div>
  );
}
