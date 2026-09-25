export interface CriteriaSeries {
  key: string;
  label: string;
  emoji: string;
  color: string;
  values: (number | null)[];
  target?: number | null;
}

const ROW = 26;
const TOP = 26;
const LEFT = 58;
const RIGHT = 14;
const WIDTH = 340;

const WEEKDAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function dayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()}`;
}

function niceTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const raw = span / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Graphique « couché » : un jour par ligne (y), la valeur en x, un trait
 * coloré par critère. Les critères d'une même unité partagent l'axe ; un
 * pointillé de la couleur du critère marque son objectif. */
export function CriteriaLineChart({
  dates,
  series,
  unit,
  openDate,
  onOpen,
}: {
  dates: string[];
  series: CriteriaSeries[];
  unit: string;
  openDate: string | null;
  onOpen: (date: string) => void;
}) {
  const all = series.flatMap((s) => [...s.values, s.target ?? null]).filter((v): v is number => v !== null);
  const min = Math.min(0, ...all);
  const max = Math.max(1, ...all) * 1.05;
  const plotW = WIDTH - LEFT - RIGHT;
  const x = (v: number) => LEFT + ((v - min) / (max - min)) * plotW;
  const y = (i: number) => TOP + i * ROW + ROW / 2;
  const height = TOP + dates.length * ROW + 6;
  const ticks = niceTicks(min, max / 1.05);

  return (
    <figure className="criteria-chart">
      <figcaption className="criteria-chart-legend">
        {series.map((s) => (
          <span key={s.key}>
            <span className="criteria-chart-swatch" style={{ background: s.color }} />
            {s.emoji} {s.label}
          </span>
        ))}
        <span className="hint">en {unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={`Valeurs par jour en ${unit}`}>
        {dates.map((date, i) => (
          <g
            key={date}
            className={`criteria-chart-row${openDate === date ? ' open' : ''}`}
            onClick={() => onOpen(date)}
          >
            <rect x={0} y={TOP + i * ROW} width={WIDTH} height={ROW} className="criteria-chart-rowbg" />
            <text x={4} y={y(i) + 4} className="criteria-chart-day">
              {dayLabel(date)}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              y1={TOP - 4}
              x2={x(t)}
              y2={height - 6}
              className={t === 0 ? 'criteria-chart-zero' : 'criteria-chart-grid'}
            />
            <text x={x(t)} y={TOP - 9} className="criteria-chart-tick">
              {t.toLocaleString('fr-CH')}
            </text>
          </g>
        ))}
        {series.map((s) =>
          s.target ? (
            <line
              key={`${s.key}-cible`}
              x1={x(s.target)}
              y1={TOP}
              x2={x(s.target)}
              y2={height - 6}
              stroke={s.color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.8}
            />
          ) : null,
        )}
        {series.map((s) => {
          const runs: string[] = [];
          let cur = '';
          s.values.forEach((v, i) => {
            if (v === null) {
              if (cur) runs.push(cur);
              cur = '';
            } else {
              cur += `${cur ? 'L' : 'M'}${x(v).toFixed(1)} ${y(i)} `;
            }
          });
          if (cur) runs.push(cur);
          return (
            <g key={s.key} pointerEvents="none">
              {runs.map((d, ri) => (
                <path key={ri} d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" />
              ))}
              {s.values.map((v, i) =>
                v === null ? null : (
                  <circle key={i} cx={x(v)} cy={y(i)} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.2} />
                ),
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
