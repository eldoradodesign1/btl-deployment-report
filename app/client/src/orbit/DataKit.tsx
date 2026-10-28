// Petites briques de l'espace Données : choix segmenté, menu en pastille, menu « … », tiroir latéral et champ à suggestions.
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, MoreHorizontal, X } from "lucide-react";

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) close(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("mousedown", onPointer); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open, close]);
  return ref;
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (value: T) => void; label: string }) {
  return (
    <div className="orbit-seg dn-seg" role="tablist" aria-label={label}>
      {options.map((option) => <button key={option.id} type="button" role="tab" aria-selected={option.id === value} onClick={() => onChange(option.id)}>{option.label}</button>)}
    </div>
  );
}

export function PillSelect({ icon, value, options, onChange, label }: { icon?: ReactNode; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const current = options.find((option) => option.id === value)?.label ?? value;
  return (
    <div ref={ref} className="dn-pop-wrap">
      <button type="button" className={`dn-pill ${open ? "is-open" : ""}`} aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((state) => !state)}>{icon}{current}<ChevronDown size={14} className="dn-chev" /></button>
      {open && <div className="dn-pop" role="listbox">{options.map((option) => <button key={option.id} type="button" role="option" aria-selected={option.id === value} className={option.id === value ? "is-on" : ""} onClick={() => { onChange(option.id); setOpen(false); }}>{option.label}{option.id === value && <Check size={14} />}</button>)}</div>}
    </div>
  );
}

export function RowMenu({ label, items }: { label: string; items: { label: string; icon?: ReactNode; danger?: boolean; onSelect: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div ref={ref} className="dn-pop-wrap dn-row-menu">
      <button type="button" className="dn-more" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((state) => !state)}><MoreHorizontal size={17} /></button>
      {open && <div className="dn-pop is-right" role="menu">{items.map((item) => <button key={item.label} type="button" role="menuitem" className={item.danger ? "is-danger" : ""} onClick={() => { setOpen(false); item.onSelect(); }}>{item.icon}{item.label}</button>)}</div>}
    </div>
  );
}

export function Drawer({ title, onClose, children, footer, busy = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; busy?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);
  return (
    <aside className="dn-drawer glass-card" role="dialog" aria-modal="false" aria-label={title}>
      <div className="dn-drawer-head"><h2>{title}</h2><button type="button" className="dn-icon-button" onClick={onClose} disabled={busy} aria-label="Fermer"><X size={16} /></button></div>
      <div className="dn-drawer-body">{children}</div>
      {footer && <div className="dn-drawer-foot">{footer}</div>}
    </aside>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} className={`dn-switch ${checked ? "is-on" : ""}`} aria-label={label} onClick={() => onChange(!checked)} />;
}

// Champ libre avec suggestions : la saisie reste possible, la liste aide à retrouver un nom existant.
export function SuggestField({ icon, value, onChange, options, placeholder, label }: { icon?: ReactNode; value: string; onChange: (value: string) => void; options: { value: string; hint?: string }[]; placeholder?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const needle = value.trim().toLowerCase();
  const matches = options.filter((option) => option.value.toLowerCase().includes(needle) && option.value !== value).slice(0, 6);
  return (
    <div ref={ref} className="dn-pop-wrap">
      <div className={`dn-field ${open ? "is-focus" : ""}`}>{icon}<input value={value} aria-label={label} placeholder={placeholder} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); }} /><ChevronDown size={14} className="dn-chev" /></div>
      {open && matches.length > 0 && <div className="dn-pop is-wide" role="listbox">{matches.map((option) => <button key={option.value} type="button" role="option" aria-selected={false} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.value}</span>{option.hint && <em>{option.hint}</em>}</button>)}</div>}
    </div>
  );
}

export const maskNumber = (value: string) => {
  const digits = value.replace(/\s/g, "");
  if (!digits) return "—";
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 3)} •••• ${digits.slice(-3)}`;
};
