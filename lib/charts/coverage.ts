/**
 * How many records actually report a metric.
 *
 * Several metrics are sparse enough that plotting them as zero is misleading
 * rather than merely empty: citations are non-zero for 321 of 2,691 projects
 * and downloads for 867. Ranking by citations therefore draws eighteen
 * zero-length bars out of twenty-five, and a zero-citation bubble is the same
 * dot as a genuine one. The sunburst's colour bar already treats this correctly
 * via `bins.zeros`; this is the same idea for the other charts.
 */
export type Coverage = {
  covered: number;
  total: number;
  share: number;
  /** True when fewer than half the records report the metric. */
  sparse: boolean;
};

export function metricCoverage<T>(
  records: T[],
  valueOf: (record: T) => number | null | undefined,
): Coverage {
  let covered = 0;
  for (const record of records) {
    const value = valueOf(record);
    if (typeof value === "number" && value > 0) covered += 1;
  }
  const total = records.length;
  return {
    covered,
    total,
    share: total > 0 ? covered / total : 0,
    sparse: total > 0 && covered / total < 0.5,
  };
}
