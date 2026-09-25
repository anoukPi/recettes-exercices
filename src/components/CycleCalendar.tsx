import { useState } from 'react';
import { addDays, toDateKey } from '../lib/date';
import { cycleDayInfo, PHASE_LABELS } from '../lib/cycle';
import type { CycleEntry } from '../types';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Calendrier du cycle : règles notées ou estimées, période fertile,
 * ovulation, phases folliculaire et lutéale — une couleur par phase. */
export function CycleCalendar({
  entries,
  periodLengthDays,
}: {
  entries: CycleEntry[];
  periodLengthDays: number | null;
}) {
  const today = toDateKey(new Date());
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const first = `${monthKey}-01`;
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const leading = (new Date(y, m - 1, 1).getDay() + 6) % 7; // lundi = 0

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ];
  const notedStarts = new Set(entries.map((e) => e.entry_date));

  return (
    <div className="cycle-calendar">
      <div className="cycle-calendar-header">
        <button type="button" onClick={() => setMonthKey((k) => shiftMonth(k, -1))} aria-label="Mois précédent">
          ←
        </button>
        <strong>{monthLabel(monthKey)}</strong>
        <button type="button" onClick={() => setMonthKey((k) => shiftMonth(k, 1))} aria-label="Mois suivant">
          →
        </button>
      </div>
      <div className="cycle-calendar-grid">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`} className="cycle-calendar-weekday">
            {d}
          </span>
        ))}
        {cells.map((dateKey, i) => {
          if (!dateKey) return <span key={`empty-${i}`} />;
          const info = cycleDayInfo(dateKey, entries, periodLengthDays);
          const classes = [
            'cycle-day',
            info ? `phase-${info.phase}` : '',
            info?.predicted ? 'predicted' : '',
            dateKey === today ? 'today' : '',
            notedStarts.has(dateKey) ? 'noted-start' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span
              key={dateKey}
              className={classes}
              title={info ? `${PHASE_LABELS[info.phase]} — jour ${info.cycleDay}${info.predicted ? ' (estimé)' : ''}` : undefined}
            >
              {Number(dateKey.slice(8))}
            </span>
          );
        })}
      </div>
      <ul className="cycle-legend">
        <li>
          <span className="cycle-swatch phase-regles" /> Règles
        </li>
        <li>
          <span className="cycle-swatch phase-regles predicted" /> Règles prévues
        </li>
        <li>
          <span className="cycle-swatch phase-fertile" /> Fertile
        </li>
        <li>
          <span className="cycle-swatch phase-ovulation" /> Ovulation
        </li>
        <li>
          <span className="cycle-swatch phase-folliculaire" /> Folliculaire
        </li>
        <li>
          <span className="cycle-swatch phase-luteale" /> Lutéale
        </li>
      </ul>
    </div>
  );
}
