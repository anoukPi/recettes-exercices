import { useState } from 'react';
import { formatDateKeyFr } from '../lib/date';

const shortDate = (d: string) => `${Number(d.slice(8))}.${d.slice(5, 7)}`;

export interface DailyValue {
  date: string;
  value: number | null;
}

const HEIGHT = 130;
const PADDING = { top: 10, bottom: 4 };

/** Barres jour par jour avec, si fourni, un trait pointillé pour l'objectif :
 * barre corail au-dessus de l'objectif, pétrole en dessous. Un jour sans
 * donnée reste vide. */
export function DailyValueChart({
  data,
  unit,
  target,
  signed = false,
}: {
  data: DailyValue[];
  unit: string;
  target?: number | null;
  /** Valeurs positives/négatives autour de 0 (écart calories). */
  signed?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const values = data.map((d) => d.value).filter((v): v is number => v !== null);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const n = Math.max(1, data.length);
  const slot = 100 / n;
  const barWidth = Math.max(0.6, slot * 0.62);

  let y: (v: number) => number;
  let zero: number;
  if (signed) {
    const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
    zero = PADDING.top + plotHeight / 2;
    y = (v) => zero - (v / maxAbs) * (plotHeight / 2);
  } else {
    const max = Math.max(1, target ?? 0, ...values) * 1.08;
    zero = PADDING.top + plotHeight;
    y = (v) => zero - (v / max) * plotHeight;
  }

  const labelStep = n <= 8 ? 1 : Math.ceil(n / 6);
  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="gap-chart daily-chart">
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        className="gap-chart-svg"
        role="img"
        aria-label="Évolution jour par jour"
      >
        <line x1={0} y1={zero} x2={100} y2={zero} className="gap-chart-baseline" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const x = i * slot + (slot - barWidth) / 2;
          if (d.value === null) return null;
          const top = Math.min(y(d.value), zero);
          const h = Math.max(0.5, Math.abs(y(d.value) - zero));
          const over = signed ? d.value > 0 : target != null && d.value > target * 1.1;
          return (
            <rect
              key={d.date}
              x={x}
              y={top}
              width={barWidth}
              height={h}
              rx={0.6}
              className={`daily-chart-bar${over ? ' over' : ''}${activeIndex === i ? ' active' : ''}`}
            />
          );
        })}
        {!signed && target != null && target > 0 && (
          <line
            x1={0}
            y1={y(target)}
            x2={100}
            y2={y(target)}
            className="daily-chart-target"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {data.map((d, i) => (
          <g key={d.date}>
            <rect
              x={i * slot}
              y={0}
              width={slot}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            />
          </g>
        ))}
      </svg>
      <div className="daily-chart-axis">
        {data.map((d, i) => (
          <span key={d.date}>{i % labelStep === 0 || i === n - 1 ? shortDate(d.date) : ''}</span>
        ))}
      </div>
      <div className="gap-chart-tooltip">
        {active ? (
          <>
            <strong>{formatDateKeyFr(active.date)}</strong>{' '}
            {active.value === null ? (
              <span className="hint">rien noté</span>
            ) : (
              <span>
                {signed && active.value >= 0 ? '+' : ''}
                {Math.round(active.value * 10) / 10} {unit}
              </span>
            )}
          </>
        ) : (
          <span className="hint">
            {target != null && !signed
              ? `Pointillé : objectif ${Math.round(target)} ${unit}. Touche une barre pour le détail.`
              : 'Touche une barre pour le détail.'}
          </span>
        )}
      </div>
    </div>
  );
}
