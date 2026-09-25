// Courbe d'évolution d'un test (page Tests, onglet Tests du Bilan).
function formatValue(n: number): string {
  return n.toLocaleString('fr-CH', { maximumFractionDigits: 2 });
}

export function TrendChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length < 2) return null;

  const width = 320;
  const height = 110;
  const padding = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="Tendance">
      <path d={path} fill="none" stroke="var(--petrole)" strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="var(--corail)" />
      ))}
      <text x={padding} y={height - 6} className="trend-chart-label" fill="var(--text-muted)">
        min {formatValue(min)} {unit}
      </text>
      <text x={width - padding} y={height - 6} textAnchor="end" className="trend-chart-label" fill="var(--text-muted)">
        max {formatValue(max)} {unit}
      </text>
    </svg>
  );
}
