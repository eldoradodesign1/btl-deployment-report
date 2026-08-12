// Design philosophy: Halo Opaline — progression is a quiet instrument embedded in the row, not a separate card.
type Props = { values: number[]; tone?: "cyan" | "lilac" | "coral"; width?: number; height?: number };

export default function Sparkline({ values, tone = "cyan", width = 92, height = 28 }: Props) {
  const safe = values.length ? values : [0]; const max = Math.max(...safe, 1); const min = Math.min(...safe); const spread = Math.max(1, max - min);
  const points = safe.map((value, index) => `${(index / Math.max(1, safe.length - 1)) * width},${height - 3 - ((value - min) / spread) * (height - 8)}`).join(" ");
  return <svg className={`sparkline spark-${tone}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Progression"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx={Number(points.split(" ").at(-1)?.split(",")[0] ?? 0)} cy={Number(points.split(" ").at(-1)?.split(",")[1] ?? 0)} r="2.5" fill="currentColor" /></svg>;
}
