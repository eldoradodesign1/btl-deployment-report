// Design philosophy: Halo Opaline — KPI cards use light, contrast and one quiet accent instead of visual noise.
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

type Props = { label: string; value: string; detail: string; icon: LucideIcon; accent: "cyan" | "coral" | "lilac" | "mint" };

export default function MetricCard({ label, value, detail, icon: Icon, accent }: Props) {
  const target = Number(value.replace(/\s/g, "").replace(",", ".")); const isNumeric = Number.isFinite(target);
  const previousTarget = useRef(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (!isNumeric) { setDisplay(0); return; } const start = previousTarget.current; previousTarget.current = target; const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduced) { setDisplay(target); return; } const startedAt = performance.now(); let frame = 0; const tick = (now: number) => { const progress = Math.min(1, (now - startedAt) / 620); const eased = 1 - Math.pow(1 - progress, 4); setDisplay(start + (target - start) * eased); if (progress < 1) frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [isNumeric, target]);
  const shown = isNumeric ? new Intl.NumberFormat("fr-FR").format(Math.round(display)) : value;
  return <article className={`metric-card glass-card accent-${accent}`}><div className="metric-top"><span className="metric-icon"><Icon size={16} /></span><span className="metric-status">ACTUALISÉ</span></div><div className="metric-label">{label}</div><div className="metric-value" aria-live="polite">{shown}</div><div className="metric-detail">{detail}</div></article>;
}
