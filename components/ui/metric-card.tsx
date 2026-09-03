type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </article>
  );
}

/** Compact secondary statistic, for the medians strip under the headline row. */
export function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-stat">
      <p className="metric-stat__value">{value}</p>
      <p className="metric-stat__label">{label}</p>
    </div>
  );
}
