import { useEffect, useId, useState } from 'react';
import { formatDateKeyFr } from '../lib/date';

export interface GapPoint {
  date: string;
  value: number | null;
}

interface GapEvolutionChartProps {
  title: string;
  unit: string;
  data: GapPoint[];
}

const HEIGHT = 120;
const PADDING = { top: 10, bottom: 20, left: 4, right: 4 };

interface Plotted {
  x: number;
  y: number;
  value: number;
  date: string;
  index: number;
}

function linePath(points: Plotted[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function areaPath(points: Plotted[], baseline: number): string {
  if (points.length === 0) return '';
  const top = linePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${top} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

/** Graphique en ligne — au-dessus de la ligne de base = au-dessus de
 * l'objectif, en dessous = en dessous. Un point = un jour de la période ; un
 * jour sans donnée casse la ligne plutôt que d'être interpolé. */
export function GapEvolutionChart({ title, unit, data }: GapEvolutionChartProps) {
  const clipId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [data]);

  const values = data.map((d) => d.value).filter((v): v is number => v !== null);
  const maxAbs = values.length > 0 ? Math.max(1, ...values.map((v) => Math.abs(v))) : 1;

  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const baseline = PADDING.top + plotHeight / 2;
  const scale = plotHeight / 2 / maxAbs;

  const n = data.length;
  const slotWidth = n > 1 ? (100 - PADDING.left - PADDING.right) / (n - 1) : 0;

  const points: Plotted[] = data.map((d, i) => ({
    x: PADDING.left + i * slotWidth,
    y: d.value === null ? baseline : baseline - d.value * scale,
    value: d.value ?? 0,
    date: d.date,
    index: i,
  }));

  const definedRuns: Plotted[][] = [];
  let run: Plotted[] = [];
  data.forEach((d, i) => {
    if (d.value === null) {
      if (run.length > 0) definedRuns.push(run);
      run = [];
    } else {
      run.push(points[i]);
    }
  });
  if (run.length > 0) definedRuns.push(run);

  const showEveryLabel = n <= 8;
  const labelStep = showEveryLabel ? 1 : Math.ceil(n / 6);

  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="gap-chart">
      <div className="gap-chart-header">
        <span className="gap-chart-title">{title}</span>
        <span className="gap-chart-legend">
          <span className="gap-chart-legend-dot over" /> au-dessus
          <span className="gap-chart-legend-dot under" /> en dessous
        </span>
      </div>
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        className="gap-chart-svg"
        role="img"
        aria-label={`Évolution de l'écart ${title} sur la période`}
      >
        <defs>
          <clipPath id={`${clipId}-over`}>
            <rect x={0} y={0} width={100} height={baseline} />
          </clipPath>
          <clipPath id={`${clipId}-under`}>
            <rect x={0} y={baseline} width={100} height={HEIGHT - baseline} />
          </clipPath>
        </defs>

        <line
          x1={0}
          y1={baseline}
          x2={100}
          y2={baseline}
          className="gap-chart-baseline"
          vectorEffect="non-scaling-stroke"
        />

        {definedRuns.map((seg, si) => (
          <g key={si}>
            <path d={areaPath(seg, baseline)} className="gap-chart-area over" clipPath={`url(#${clipId}-over)`} />
            <path d={areaPath(seg, baseline)} className="gap-chart-area under" clipPath={`url(#${clipId}-under)`} />
            <path d={linePath(seg)} className="gap-chart-line" vectorEffect="non-scaling-stroke" />
            {seg.map((p) => (
              <circle
                key={p.index}
                cx={p.x}
                cy={p.y}
                r={activeIndex === p.index ? 3.2 : 2}
                className={`gap-chart-dot ${p.value > 0 ? 'over' : 'under'}${activeIndex === p.index ? ' active' : ''}`}
              />
            ))}
          </g>
        ))}

        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={Math.max(0, p.x - slotWidth / 2)}
              y={0}
              width={n > 1 ? slotWidth : 100}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            />
            {(i % labelStep === 0 || i === n - 1) && (
              <text x={p.x} y={HEIGHT - 4} className="gap-chart-axis-label">
                {formatDateKeyFr(data[i].date).slice(0, 5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      {active && (
        <div className="gap-chart-tooltip">
          <strong>{formatDateKeyFr(active.date)}</strong>
          {active.value === null ? (
            <span className="hint"> rien noté</span>
          ) : (
            <span>
              {' '}
              {active.value >= 0 ? '+' : ''}
              {Math.round(active.value)} {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
