// Design philosophy: Halo Opaline — KPI cards use light, contrast and one quiet accent instead of visual noise.
import type { LucideIcon } from "lucide-react";

type Props = { label: string; value: string; detail: string; icon: LucideIcon; accent: "cyan" | "coral" | "lilac" | "mint" };

export default function MetricCard({ label, value, detail, icon: Icon, accent }: Props) {
  return <article className={`metric-card glass-card accent-${accent}`}><div className="metric-top"><span className="metric-icon"><Icon size={16} /></span><span className="metric-status">ACTUALISÉ</span></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>;
}
