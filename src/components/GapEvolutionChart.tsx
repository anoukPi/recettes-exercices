import { useEffect, useState } from 'react';
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
const BAR_RADIUS = 4;
const MAX_BAR_THICKNESS = 24;

/** Chemin d'une barre partant de la ligne de base (yBase) vers yEnd, avec les
 * deux coins du bout arrondis et les deux coins à la base restés carrés —
 * pour une barre qui monte (yEnd < yBase) ou qui descend (yEnd > yBase). */
function roundedBarPath(x: number, width: number, yBase: number, yEnd: number): string {
  const goingUp = yEnd < yBase;
  const height = Math.abs(yBase - yEnd);
  const r = Math.min(BAR_RADIUS, width / 2, height);
  if (height <= 0.5) return '';

  if (goingUp) {
    const top = yEnd;
    return [
      `M ${x} ${yBase}`,
      `L ${x} ${top + r}`,
      `Q ${x} ${top} ${x + r} ${top}`,
      `L ${x + width - r} ${top}`,
      `Q ${x + width} ${top} ${x + width} ${top + r}`,
      `L ${x + width} ${yBase}`,
      'Z',
    ].join(' ');
  }
  const bottom = yEnd;
  return [
    `M ${x} ${yBase}`,
    `L ${x} ${bottom - r}`,
    `Q ${x} ${bottom} ${x + r} ${bottom}`,
    `L ${x + width - r} ${bottom}`,
    `Q ${x + width} ${bottom} ${x + width} ${bottom - r}`,
    `L ${x + width} ${yBase}`,
    'Z',
  ].join(' ');
}

/** Petit graphique en barres divergentes — au-dessus de la ligne = au-dessus
 * de l'objectif, en dessous = en dessous. Une case = un jour de la période. */
export function GapEvolutionChart({ title, unit, data }: GapEvolutionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [data]);

  const values = data.map((d) => d.value).filter((v): v is number => v !== null);
  const maxAbs = values.length > 0 ? Math.max(1, ...values.map((v) => Math.abs(v))) : 1;

  const padding = { top: 10, bottom: 20, left: 4, right: 4 };
  const plotHeight = HEIGHT - padding.top - padding.bottom;
  const baseline = padding.top + plotHeight / 2;
  const scale = (plotHeight / 2) / maxAbs;

  const n = data.length;
  const slotWidth = 100 / n;
  const barWidth = Math.min(MAX_BAR_THICKNESS, slotWidth * 0.6);

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
        <line
          x1={0}
          y1={baseline}
          x2={100}
          y2={baseline}
          className="gap-chart-baseline"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((point, i) => {
          const x = i * slotWidth + (slotWidth - barWidth) / 2;
          const yEnd = point.value === null ? baseline : baseline - point.value * scale;
          const path = point.value === null ? '' : roundedBarPath(x, barWidth, baseline, yEnd);
          const isOver = (point.value ?? 0) > 0;
          return (
            <g key={point.date}>
              {/* zone de tap plus grande que la barre elle-même */}
              <rect
                x={i * slotWidth}
                y={0}
                width={slotWidth}
                height={HEIGHT}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
              />
              {path && (
                <path
                  d={path}
                  className={`gap-chart-bar ${isOver ? 'over' : 'under'}${activeIndex === i ? ' active' : ''}`}
                />
              )}
              {(i % labelStep === 0 || i === n - 1) && (
                <text x={i * slotWidth + slotWidth / 2} y={HEIGHT - 4} className="gap-chart-axis-label">
                  {formatDateKeyFr(point.date).slice(0, 5)}
                </text>
              )}
            </g>
          );
        })}
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
