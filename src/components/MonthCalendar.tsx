import { useMonthCalories } from '../lib/useMonthCalories';
import { toDateKey } from '../lib/date';

interface MonthCalendarProps {
  monthKey: string; // 'YYYY-MM'
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (monthKey: string) => void;
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dayStatusClass(calories: number, target: number): string {
  const pct = target > 0 ? (calories / target) * 100 : 0;
  if (pct < 60 || pct > 140) return 'cal-day-far';
  if (pct < 85 || pct > 115) return pct < 85 ? 'cal-day-under' : 'cal-day-over';
  return 'cal-day-ok';
}

export function MonthCalendar({ monthKey, selectedDate, onSelectDate, onChangeMonth }: MonthCalendarProps) {
  const { caloriesByDate, targetCalories, loading } = useMonthCalories(monthKey);
  const [year, month] = monthKey.split('-').map(Number);
  const today = toDateKey(new Date());

  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = firstOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <button type="button" onClick={() => onChangeMonth(shiftMonth(monthKey, -1))}>
          ←
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" onClick={() => onChangeMonth(shiftMonth(monthKey, 1))}>
          →
        </button>
      </div>
      {loading && <p className="hint">Calcul en cours…</p>}
      <div className="month-calendar-grid">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={`${d}-${i}`} className="month-calendar-weekday">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />;
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = caloriesByDate[dateKey];
          const isFuture = dateKey > today;
          const statusClass =
            !isFuture && status?.hasData && targetCalories
              ? dayStatusClass(status.calories, targetCalories)
              : '';
          return (
            <button
              key={dateKey}
              type="button"
              className={`month-calendar-day ${statusClass}${dateKey === selectedDate ? ' selected' : ''}${
                dateKey === today ? ' today' : ''
              }`}
              onClick={() => onSelectDate(dateKey)}
              disabled={isFuture}
              title={status?.hasData ? `${Math.round(status.calories)} kcal` : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="hint">
        Vert = proche de l'objectif calorique, orange/rouge = écart notable, gris = rien noté.
      </p>
    </div>
  );
}
