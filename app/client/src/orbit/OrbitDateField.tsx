// Champ de date Orbit : remplace <input type="date">. Un bouton montre la date, un calendrier en verre s'ouvre en dessous.
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const toDate = (value: string) => new Date(`${value}T00:00:00`);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmt = (value: string) => value ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(toDate(value)) : "Choisir une date";
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function OrbitDateField({ value, onChange, min, max, ariaLabel = "Date" }: { value: string; onChange: (value: string) => void; min?: string; max?: string; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const d = value ? toDate(value) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [place, setPlace] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPlace({ left: Math.min(r.left, window.innerWidth - 260), top: r.bottom + 260 > window.innerHeight ? r.top - 268 : r.bottom + 8 });
    if (value) { const d = toDate(value); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { const t = event.target as Node; if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (month.getDay() + 6) % 7;
  const title = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(month);
  return (
    <>
      <button ref={triggerRef} type="button" className="orbit-date-field" aria-haspopup="dialog" aria-expanded={open} aria-label={`${ariaLabel} : ${fmt(value)}`} onClick={() => setOpen((v) => !v)}>
        <CalendarDays size={15} /><span>{fmt(value)}</span>
      </button>
      {open && createPortal(
        <div ref={panelRef} className="orbit-date-panel" role="dialog" aria-label={ariaLabel} style={{ left: place.left, top: place.top }}>
          <div className="orbit-date-head">
            <button type="button" aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
            <strong>{title}</strong>
            <button type="button" aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
          </div>
          <div className="orbit-cal-grid">
            {WEEKDAYS.map((w, i) => <span key={i} className="orbit-cal-head">{w}</span>)}
            {Array.from({ length: lead }, (_, i) => <span key={`v${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const day = iso(new Date(month.getFullYear(), month.getMonth(), i + 1));
              const off = (min && day < min) || (max && day > max);
              return <button key={day} type="button" disabled={!!off} className={`orbit-cal-day ${day === value ? "is-edge" : ""}`} onClick={() => { onChange(day); setOpen(false); }}>{i + 1}</button>;
            })}
          </div>
        </div>,
        document.querySelector(".app-shell") ?? document.body,
      )}
    </>
  );
}
