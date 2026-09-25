import { useEffect, useRef, useState } from 'react';

export interface CriteriaSeries {
  key: string;
  label: string;
  emoji: string;
  color: string;
  values: (number | null)[];
  target?: number | null;
}

const HEIGHT = 230;
const TOP = 14;
const BOTTOM = 34;
const LEFT = 42;
const RIGHT = 10;
const AXIS = 'var(--accent)';

const WEEKDAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function niceTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const raw = span / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Courbes jour par jour : les jours sur l'axe horizontal (vert), la valeur
 * en vertical, un trait coloré par critère. Les critères d'une même unité
 * partagent l'axe ; un pointillé de la couleur du critère marque son objectif.
 * Dessiné à la taille réelle du conteneur pour garder un texte lisible. */
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const all = series.flatMap((s) => [...s.values, s.target ?? null]).filter((v): v is number => v !== null);
  const rawMin = Math.min(0, ...all);
  const rawMax = Math.max(1, ...all);
  const pad = (rawMax - rawMin) * 0.06;
  const min = rawMin < 0 ? rawMin - pad : 0;
  const max = rawMax + pad;

  const n = Math.max(1, dates.length);
  const plotW = width - LEFT - RIGHT;
  const slot = plotW / n;
  const x = (i: number) => LEFT + slot * i + slot / 2;
  const plotH = HEIGHT - TOP - BOTTOM;
  const y = (v: number) => TOP + (1 - (v - min) / (max - min)) * plotH;
  const ticks = niceTicks(min, max);
  const labelStep = n <= 10 ? 1 : n <= 16 ? 2 : 5;

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
      <div ref={wrapRef}>
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={`Valeurs par jour en ${unit}`}>
          {dates.map((date, i) => (
            <rect
              key={date}
              x={LEFT + slot * i}
              y={TOP}
              width={slot}
              height={plotH}
              className={`criteria-chart-col${i % 2 ? ' odd' : ''}${openDate === date ? ' open' : ''}`}
              onClick={() => onOpen(date)}
            />
          ))}

          {ticks.map((t) => (
            <g key={t} pointerEvents="none">
              {t !== 0 && <line x1={LEFT} y1={y(t)} x2={width - RIGHT} y2={y(t)} className="criteria-chart-grid" />}
              <text x={LEFT - 6} y={y(t) + 3} className="criteria-chart-tick">
                {t.toLocaleString('fr-CH')}
              </text>
            </g>
          ))}

          {/* Axe des jours : horizontal, vert, sur la valeur 0. */}
          <line x1={LEFT} y1={y(0)} x2={width - RIGHT} y2={y(0)} stroke={AXIS} strokeWidth={3} strokeLinecap="round" />
          {dates.map((date, i) => {
            if (i % labelStep !== 0 && i !== n - 1) return null;
            const d = new Date(`${date}T12:00:00`);
            return (
              <g key={date} pointerEvents="none">
                <line x1={x(i)} y1={y(0) - 4} x2={x(i)} y2={y(0) + 4} stroke={AXIS} strokeWidth={2} />
                <text x={x(i)} y={HEIGHT - BOTTOM + 15} className="criteria-chart-day">
                  {n <= 10 ? WEEKDAY_SHORT[d.getDay()] : d.getDate()}
                </text>
                {n <= 10 && (
                  <text x={x(i)} y={HEIGHT - BOTTOM + 28} className="criteria-chart-date">
                    {d.getDate()}
                  </text>
                )}
              </g>
            );
          })}

          {series.map((s) =>
            s.target ? (
              <line
                key={`${s.key}-cible`}
                x1={LEFT}
                y1={y(s.target)}
                x2={width - RIGHT}
                y2={y(s.target)}
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                opacity={0.8}
                pointerEvents="none"
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
                cur += `${cur ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
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
                    <circle key={i} cx={x(i)} cy={y(v)} r={n > 16 ? 2.5 : 4} fill={s.color} stroke="#fff" strokeWidth={1.2} />
                  ),
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
