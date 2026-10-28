// Période : une pastille dans l'en-tête qui ouvre un panneau ancré (une feuille sur téléphone).
// Semaines datées, calendrier avec les jours d'activité, curseur au jour près ; tout reste synchronisé
// et s'applique tout de suite. Le bouton du bas annonce ce que la sélection contient.
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Activation } from "@/data/vodacomData";
import { getWeekRanges } from "@/components/DateRangeFilter";

const DAY = 24 * 60 * 60 * 1000;
const toDate = (value: string) => new Date(`${value}T00:00:00`);
const iso = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const short = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(toDate(value)).replace(".", "");
const full = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(toDate(value));
const monthTitle = (value: Date) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(value);
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Props = { data: Activation[]; startDate: string; endDate: string; recordLabel: string; onChange: (startDate: string, endDate: string) => void };

export function PeriodPicker({ data, startDate, endDate, recordLabel, onChange }: Props) {
  const dates = useMemo(() => Array.from(new Set(data.map((item) => item.d))).sort(), [data]);
  const activeDays = useMemo(() => new Set(dates), [dates]);
  const weeks = useMemo(() => getWeekRanges(data).map((week) => ({ ...week, count: data.filter((item) => item.d >= week.start && item.d <= week.end).length })), [data]);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [month, setMonth] = useState(() => { const d = toDate(startDate || dates[0] || iso(new Date())); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const minDate = dates[0];
  const maxDate = dates.at(-1);
  const selected = useMemo(() => data.filter((item) => item.d >= startDate && item.d <= endDate).length, [data, endDate, startDate]);

  const close = () => {
    if (!open || closing) return;
    setClosing(true);
    window.setTimeout(() => { setOpen(false); setClosing(false); setPending(null); }, 180);
  };
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { const target = event.target as Node; if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) close(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  });
  useEffect(() => { if (open) { const d = toDate(startDate); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!minDate || !maxDate) return null;
  const maxOffset = Math.max(1, Math.round((toDate(maxDate).getTime() - toDate(minDate).getTime()) / DAY));
  const offsetOf = (value: string) => Math.round((toDate(value).getTime() - toDate(minDate).getTime()) / DAY);
  const fromOffset = (offset: number) => iso(new Date(toDate(minDate).getTime() + offset * DAY));
  const startOffset = offsetOf(startDate);
  const endOffset = offsetOf(endDate);
  const pct = (offset: number) => `${Math.min(100, Math.max(0, (offset / maxOffset) * 100))}%`;
  const firstMonth = new Date(toDate(minDate).getFullYear(), toDate(minDate).getMonth(), 1);
  const lastMonth = new Date(toDate(maxDate).getFullYear(), toDate(maxDate).getMonth(), 1);
  const secondMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  // Sur téléphone, la feuille ne montre qu’un mois : la navigation va jusqu’au dernier.
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
  const canPrev = month > firstMonth;
  const canNext = narrow ? month < lastMonth : secondMonth < lastMonth;

  const pickDay = (day: string) => {
    if (!pending) { setPending(day); onChange(day, day); return; }
    const [a, b] = pending <= day ? [pending, day] : [day, pending];
    setPending(null);
    onChange(a, b);
  };

  const renderMonth = (first: Date) => {
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < lead; i += 1) cells.push(<span key={`v${i}`} />);
    for (let d = 1; d <= days; d += 1) {
      const day = iso(new Date(first.getFullYear(), first.getMonth(), d));
      const outside = day < minDate || day > maxDate;
      const inRange = day >= startDate && day <= endDate;
      const edge = day === startDate || day === endDate;
      cells.push(<button key={day} type="button" disabled={outside} className={`orbit-cal-day ${inRange ? "is-in" : ""} ${edge ? "is-edge" : ""} ${activeDays.has(day) ? "has-data" : ""}`} aria-pressed={inRange} aria-label={full(day)} onClick={() => pickDay(day)}>{d}</button>);
    }
    return <div className="orbit-cal"><strong>{monthTitle(first)}</strong><div className="orbit-cal-grid">{WEEKDAYS.map((w, i) => <span key={i} className="orbit-cal-head">{w}</span>)}{cells}</div></div>;
  };

  return (
    <div ref={rootRef} className="orbit-period">
      <button type="button" className={`orbit-period-pill ${open ? "is-open" : ""}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? close() : setOpen(true))}>
        <CalendarDays size={16} /><span>{short(startDate)} → {short(endDate)}</span><ChevronDown size={15} className="orbit-period-chevron" />
      </button>
      {open && createPortal(<div ref={panelRef} className={`orbit-period-panel glass-card ${closing ? "is-closing" : ""}`} role="dialog" aria-label="Choisir la période">
        <div className="orbit-period-sheet-head"><span className="orbit-period-handle" aria-hidden="true" /><h4>Période</h4><button type="button" className="orbit-link" onClick={() => onChange(minDate, maxDate)}>Réinitialiser</button></div>
        <div className="orbit-period-weeks">
          <span className="orbit-period-label">Semaines</span>
          <button type="button" className={startDate === minDate && endDate === maxDate ? "is-active" : ""} onClick={() => onChange(minDate, maxDate)}><b>Tout</b><span>Campagne complète</span><small>{data.length}</small></button>
          {weeks.map((week, index) => <button type="button" key={week.key} className={startDate === week.start && endDate === week.end ? "is-active" : ""} onClick={() => onChange(week.start, week.end)}><b>S{index + 1}</b><span>{week.start === week.end ? short(week.start) : `${short(week.start)} – ${short(week.end)}`}</span><small>{week.count}</small></button>)}
        </div>
        <div className="orbit-period-main">
          <div className="orbit-period-months">
            <button type="button" className="orbit-period-nav" disabled={!canPrev} aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
            {renderMonth(month)}{!narrow && secondMonth <= lastMonth && renderMonth(secondMonth)}
            <button type="button" className="orbit-period-nav" disabled={!canNext} aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
          </div>
          <div className="dual-range compact-dual-range orbit-period-range" style={{ "--range-start": pct(startOffset), "--range-end": pct(endOffset) } as CSSProperties}>
            <div className="range-track"><div className="range-fill" /></div>
            <input type="range" min={0} max={maxOffset} value={startOffset} onChange={(event) => onChange(fromOffset(Math.min(Number(event.target.value), endOffset)), endDate)} aria-label="Date de début" />
            <input type="range" min={0} max={maxOffset} value={endOffset} onChange={(event) => onChange(startDate, fromOffset(Math.max(Number(event.target.value), startOffset)))} aria-label="Date de fin" />
          </div>
          <div className="orbit-period-dates"><span>Du <b>{full(startDate)}</b></span><span>au <b>{full(endDate)}</b></span></div>
          <div className="orbit-period-foot">
            <button type="button" className="orbit-link" onClick={() => onChange(minDate, maxDate)}>Toute la campagne</button>
            <button type="button" className="orbit-primary" onClick={close}>Voir {new Intl.NumberFormat("fr-FR").format(selected)} {recordLabel}</button>
          </div>
        </div>
      </div>, document.querySelector(".app-shell") ?? document.body)}
    </div>
  );
}
