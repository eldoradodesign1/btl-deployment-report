// Design philosophy: Halo Opaline — the period control is the luminous, tangible center of the dashboard.
import { CalendarDays, ChevronRight, MessageSquareText, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Activation } from "@/data/vodacomData";

const DAY = 24 * 60 * 60 * 1000;
const toDate = (value: string) => new Date(`${value}T00:00:00`);
const isoDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const offsetBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / DAY);
const shortDate = (value: Date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(value).replace(".", "");
const fullDate = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(value)).replace(".", "");

function mondayOf(value: Date) {
  const result = new Date(value);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getWeekRanges(data: Activation[]) {
  const groups = new Map<string, string[]>();
  Array.from(new Set(data.map((item) => item.d))).sort().forEach((date) => {
    const monday = isoDate(mondayOf(toDate(date)));
    groups.set(monday, [...(groups.get(monday) ?? []), date]);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, dates], index) => ({ key, label: `Semaine ${index + 1}`, start: dates[0], end: dates.at(-1)!, activeDays: dates.length }));
}

type Props = { data: Activation[]; startDate: string; endDate: string; weeklyComment?: string; onChange: (startDate: string, endDate: string) => void; compact?: boolean; role?: "btl" | "vodacom"; onWeeklyCommentOpen?: (week: number, comment: string) => void };

export default function DateRangeFilter({ data, startDate, endDate, weeklyComment, onChange, compact = false, role = "vodacom", onWeeklyCommentOpen }: Props) {
  const dates = useMemo(() => Array.from(new Set(data.map((item) => item.d))).sort(), [data]);
  const weeks = useMemo(() => getWeekRanges(data), [data]);
  const [compactOpen, setCompactOpen] = useState(() => compact && typeof window !== "undefined" && window.innerWidth > 760);
  const [compactDesktop, setCompactDesktop] = useState(() => compact && typeof window !== "undefined" && window.innerWidth > 760);
  const compactRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!compact) return;
    const syncCompactViewport = () => setCompactDesktop(window.innerWidth > 760);
    syncCompactViewport();
    window.addEventListener("resize", syncCompactViewport);
    return () => window.removeEventListener("resize", syncCompactViewport);
  }, [compact]);
  useEffect(() => {
    if (!compactDesktop) setCompactOpen(false);
  }, [compactDesktop]);
  useEffect(() => {
    if (!compact || !compactOpen || compactDesktop) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (compactRef.current && !compactRef.current.contains(target)) setCompactOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [compact, compactOpen]);
  if (!dates.length) return <section className="period-card glass-card empty-period-card" aria-label="Filtre de période"><div className="period-heading"><div className="eyebrow"><CalendarDays size={14} /> Fenêtre d’analyse</div><div className="period-heading-copy"><h2>Aucune période chargée</h2><p>Importez un fichier CSV, XLSX ou XLS depuis « Import & sources » pour activer les filtres et les graphiques.</p></div><div className="period-empty-status"><span className="live-pulse" /> En attente d’import</div></div><div className="empty-period-body"><div className="empty-period-orbit"><SlidersHorizontal size={20} /></div><div><strong>Le cockpit est prêt pour vos données.</strong><span>Les dates, semaines, KPI, analyses et exports apparaîtront automatiquement après import.</span></div></div></section>;
  const minDate = dates[0];
  const maxDate = dates.at(-1)!;
  const min = toDate(minDate);
  const maxOffset = Math.max(1, offsetBetween(min, toDate(maxDate)));
  const startOffset = offsetBetween(min, toDate(startDate));
  const endOffset = offsetBetween(min, toDate(endDate));
  const allActive = startDate === minDate && endDate === maxDate;
  const startPercent = `${Math.min(100, Math.max(0, (startOffset / maxOffset) * 100))}%`;
  const endPercent = `${Math.min(100, Math.max(0, (endOffset / maxOffset) * 100))}%`;
  const selectOffset = (offset: number, side: "start" | "end") => {
    if (side === "start") onChange(isoDate(new Date(min.getTime() + Math.min(offset, endOffset) * DAY)), endDate);
    else onChange(startDate, isoDate(new Date(min.getTime() + Math.max(offset, startOffset) * DAY)));
  };

  if (compact) return <div ref={compactRef} className={`compact-period-slider ${compactOpen ? "is-open" : ""}`} aria-label="Filtre de période compact"><button type="button" className="compact-period-pill" onClick={() => setCompactOpen((value) => !value)} aria-expanded={compactOpen}><SlidersHorizontal size={13} /><span><small>PÉRIODE</small><strong>{shortDate(toDate(startDate))} → {shortDate(toDate(endDate))}</strong></span><ChevronRight className={`compact-period-pill-chevron ${compactOpen ? "is-open" : ""}`} size={13} /></button>{(compactDesktop || compactOpen) && <div className="compact-period-dropdown"><div className="compact-period-dropdown-heading"><span>Affiner au jour près</span><strong>{shortDate(toDate(startDate))} → {shortDate(toDate(endDate))}</strong></div><div className="dual-range compact-dual-range" style={{ "--range-start": startPercent, "--range-end": endPercent } as React.CSSProperties}><div className="range-track"><div className="range-fill" /></div><div className="range-handle-tooltip range-start-tooltip" style={{ left: startPercent }}><span>Début</span><strong>{shortDate(toDate(startDate))}</strong></div><div className="range-handle-tooltip range-end-tooltip" style={{ left: endPercent }}><span>Fin</span><strong>{shortDate(toDate(endDate))}</strong></div><input type="range" min={0} max={maxOffset} value={startOffset} onChange={(event) => selectOffset(Number(event.target.value), "start")} aria-label="Date de début" /><input type="range" min={0} max={maxOffset} value={endOffset} onChange={(event) => selectOffset(Number(event.target.value), "end")} aria-label="Date de fin" /></div></div>}</div>;

  return <section className="period-card glass-card" aria-label="Filtre de période">
    <div className="eyebrow" style={{ marginBottom: 11 }}><CalendarDays size={14} /> Fenêtre d’analyse</div><div className="period-heading"><div className="period-heading-copy"><h2>Quelle période souhaitez-vous lire ?</h2><p>{dates.length} jours d’activité détectés dans la campagne importée.</p></div><div className="period-current"><span>Lecture actuelle</span><strong>{fullDate(startDate)} <ChevronRight size={15} /> {fullDate(endDate)}</strong></div></div>
    <div className="week-strip"><button className={`week-button ${allActive ? "is-active" : ""}`} onClick={() => onChange(minDate, maxDate)}><span className="week-label">Tout</span><span className="week-dates">Campagne complète</span></button>{weeks.map((week) => { const active = startDate === week.start && endDate === week.end; return <button key={week.key} className={`week-button ${active ? "is-active" : ""}`} onClick={() => onChange(week.start, week.end)}><span className="week-label">{week.label}</span><span className="week-dates">{shortDate(toDate(week.start))} — {shortDate(toDate(week.end))}</span><span className="week-count">{week.activeDays} j.</span></button>; })}</div>
    <div className="range-head"><div><SlidersHorizontal size={14} /> Affiner au jour près</div><span>Min. {fullDate(minDate)} · Max. {fullDate(maxDate)}</span></div>
    <div className="dual-range" style={{ "--range-start": startPercent, "--range-end": endPercent } as React.CSSProperties}><div className="range-track"><div className="range-fill" /></div><div className="range-handle-tooltip range-start-tooltip" style={{ left: startPercent }}><span>Début</span><strong>{shortDate(toDate(startDate))}</strong></div><div className="range-handle-tooltip range-end-tooltip" style={{ left: endPercent }}><span>Fin</span><strong>{shortDate(toDate(endDate))}</strong></div><input type="range" min={0} max={maxOffset} value={startOffset} onChange={(event) => selectOffset(Number(event.target.value), "start")} aria-label="Date de début" /><input type="range" min={0} max={maxOffset} value={endOffset} onChange={(event) => selectOffset(Number(event.target.value), "end")} aria-label="Date de fin" /></div>
    <div className="range-values"><div><span>Date début</span><strong>{fullDate(startDate)}</strong></div><div className="range-line" /><div className="range-value-end"><span>Date fin</span><strong>{fullDate(endDate)}</strong></div></div>
    {(weeklyComment || role === "btl") && <div className="weekly-comment-strip"><span>COMMENTAIRE HEBDOMADAIRE</span><p>{weeklyComment || "Aucun commentaire hebdomadaire enregistré pour cette sélection."}</p>{role === "btl" && onWeeklyCommentOpen && <button type="button" onClick={() => onWeeklyCommentOpen(Math.max(1, weeks.findIndex((week) => week.start === startDate && week.end === endDate) + 1), weeklyComment ?? "")}><>{weeklyComment ? <MessageSquareText size={14} /> : <Sparkles size={14} />}</> {weeklyComment ? "Modifier" : "Générer par IA"}</button>}</div>}
  </section>;
}
