import { useEffect, useRef, useState } from 'react';

export interface CriteriaSeries {
  key: string;
  label: string;
  emoji: string;
  color: string;
  dashed?: boolean;
  unit: string;
  values: (number | null)[];
  target?: number | null;
  format: (v: number) => string;
}

const HEIGHT = 240;
const TOP = 14;
const BOTTOM = 34;
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

/** Un seul graphique pour tous les critères affichés : les jours sur l'axe
 * horizontal (vert), un trait par critère. Si tous les critères ont la même
 * unité, l'axe vertical est gradué ; sinon chaque courbe a sa propre échelle
 * (son maximum de la période = haut du graphique) et les vraies valeurs du
 * jour touché s'affichent sous le graphique. */
export function CriteriaLineChart({
  dates,
  series,
  openDate,
  onOpen,
}: {
  dates: string[];
  series: CriteriaSeries[];
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

  const units = Array.from(new Set(series.map((s) => s.unit)));
  const shared = units.length === 1;

  // Échelle de chaque courbe : 1 (valeurs réelles) si unité commune, sinon
  // division par son plus grand écart à 0 sur la période (objectif compris).
  const scaleOf = (s: CriteriaSeries) => {
    if (shared) return 1;
    const m = Math.max(0, ...s.values.map((v) => Math.abs(v ?? 0)), Math.abs(s.target ?? 0));
    return m > 0 ? m : 1;
  };
  const scaled = series.map((s) => {
    const k = scaleOf(s);
    return {
      ...s,
      points: s.values.map((v) => (v === null ? null : v / k)),
      scaledTarget: s.target ? s.target / k : null,
    };
  });

  const all = scaled.flatMap((s) => [...s.points, s.scaledTarget]).filter((v): v is number => v !== null);
  const rawMin = Math.min(0, ...all);
  const rawMax = Math.max(shared ? 1 : 0.01, ...all);
  const pad = (rawMax - rawMin) * 0.06;
  const min = rawMin < 0 ? rawMin - pad : 0;
  const max = rawMax + pad;

  const left = shared ? 42 : 12;
  const n = Math.max(1, dates.length);
  const plotW = width - left - RIGHT;
  const slot = plotW / n;
  const x = (i: number) => left + slot * i + slot / 2;
  const plotH = HEIGHT - TOP - BOTTOM;
  const y = (v: number) => TOP + (1 - (v - min) / (max - min)) * plotH;
  const ticks = shared ? niceTicks(min, max) : [];
  const labelStep = n <= 10 ? 1 : n <= 16 ? 2 : 5;
  const openIndex = openDate ? dates.indexOf(openDate) : -1;

  return (
    <figure className="criteria-chart">
      <figcaption className="criteria-chart-legend">
        {series.map((s) => (
          <span key={s.key}>
            <svg width="18" height="6" aria-hidden="true">
              <line
                x1="1"
                y1="3"
                x2="17"
                y2="3"
                stroke={s.color}
                strokeWidth="3"
                strokeDasharray={s.dashed ? '4 3' : undefined}
                strokeLinecap="round"
              />
            </svg>
            {s.emoji} {s.label}
            {!shared && <span className="hint"> ({s.unit})</span>}
          </span>
        ))}
        {shared && units[0] && <span className="hint">en {units[0]}</span>}
      </figcaption>
      <div ref={wrapRef}>
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label="Critères jour par jour">
          {dates.map((date, i) => (
            <rect
              key={date}
              x={left + slot * i}
              y={TOP}
              width={slot}
              height={plotH}
              className={`criteria-chart-col${i % 2 ? ' odd' : ''}${openDate === date ? ' open' : ''}`}
              onClick={() => onOpen(date)}
            />
          ))}

          {ticks.map((t) => (
            <g key={t} pointerEvents="none">
              {t !== 0 && <line x1={left} y1={y(t)} x2={width - RIGHT} y2={y(t)} className="criteria-chart-grid" />}
              <text x={left - 6} y={y(t) + 3} className="criteria-chart-tick">
                {t.toLocaleString('fr-CH')}
              </text>
            </g>
          ))}

          {/* Axe des jours : horizontal, vert, sur la valeur 0. */}
          <line x1={left} y1={y(0)} x2={width - RIGHT} y2={y(0)} stroke={AXIS} strokeWidth={3} strokeLinecap="round" />
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

          {scaled.map((s) =>
            s.scaledTarget ? (
              <line
                key={`${s.key}-cible`}
                x1={left}
                y1={y(s.scaledTarget)}
                x2={width - RIGHT}
                y2={y(s.scaledTarget)}
                stroke={s.color}
                strokeWidth={1.2}
                strokeDasharray="1 4"
                strokeLinecap="round"
                opacity={0.9}
                pointerEvents="none"
              />
            ) : null,
          )}

          {scaled.map((s) => {
            const runs: string[] = [];
            let cur = '';
            s.points.forEach((v, i) => {
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
                  <path
                    key={ri}
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeDasharray={s.dashed ? '6 4' : undefined}
                  />
                ))}
                {s.points.map((v, i) =>
                  v === null ? null : (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(v)}
                      r={n > 16 ? 2.5 : 4}
                      fill={s.dashed ? '#fff' : s.color}
                      stroke={s.dashed ? s.color : '#fff'}
                      strokeWidth={s.dashed ? 2 : 1.2}
                    />
                  ),
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {openIndex >= 0 ? (
        <ul className="criteria-chart-readout">
          {series.map((s) => {
            const v = s.values[openIndex];
            return (
              <li key={s.key}>
                <span className="criteria-chart-dot" style={{ background: s.color }} />
                {s.emoji} {s.label} : <strong>{v === null ? '—' : `${s.format(v)} ${s.unit}`}</strong>
              </li>
            );
          })}
        </ul>
      ) : (
        !shared && (
          <p className="hint criteria-chart-note">
            Unités différentes : chaque courbe a sa propre échelle. Touche un jour pour lire les valeurs.
          </p>
        )
      )}
    </figure>
  );
}
