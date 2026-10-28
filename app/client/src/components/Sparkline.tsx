// Design philosophy: Halo Opaline — progression is a quiet instrument embedded in the row, not a separate card.
import { useMemo, useState } from "react";

type Props = { values: number[]; targets?: number[]; dates?: string[]; tone?: "cyan" | "lilac" | "coral"; width?: number; height?: number };

export default function Sparkline({ values, targets = [], dates = [], tone = "cyan", width = 180, height = 32 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const safe = values.length ? values : [0]; const safeTargets = safe.map((_, index) => targets[index] ?? 0); const max = Math.max(...safe, ...safeTargets, 1); const min = Math.min(0, ...safe, ...safeTargets); const spread = Math.max(1, max - min);
  const coords = useMemo(() => safe.map((value, index) => ({ x: (index / Math.max(1, safe.length - 1)) * width, y: height - 3 - ((value - min) / spread) * (height - 8), value, date: dates[index] ?? "" })), [dates, height, min, safe, spread, values, width]);
  const targetCoords = useMemo(() => safeTargets.map((value, index) => ({ x: (index / Math.max(1, safeTargets.length - 1)) * width, y: height - 3 - ((value - min) / spread) * (height - 8) })), [height, min, safeTargets, spread, width]);
  const points = coords.map(({ x, y }) => `${x},${y}`).join(" ");
  const targetPoints = targetCoords.map(({ x, y }) => `${x},${y}`).join(" ");
  const hoveredPoint = hovered == null ? null : coords[hovered];
  const label = hoveredPoint?.date ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${hoveredPoint.date}T00:00:00`)).replace(".", "") : "";
  return <div className={`sparkline-wrap spark-${tone}`} onMouseLeave={() => setHovered(null)}><svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Progression des activations et objectif"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{targets.length > 0 && <polyline className="sparkline-target" points={targetPoints} fill="none" strokeLinecap="round" strokeLinejoin="round" />}{coords.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r={hovered === index ? 3.2 : 2.1} fill="currentColor" onMouseEnter={() => setHovered(index)} />)}</svg>{hoveredPoint && hovered != null && <div className="sparkline-tooltip"><strong>{label}</strong><span>{hoveredPoint.value} activations{targets[hovered] != null ? ` · objectif ${targets[hovered]}` : ""}</span></div>}</div>;
}
