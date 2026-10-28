// Liste déroulante Orbit : remplace les <select> natifs. Panneau en verre, recherche intégrée quand la liste
// est longue, navigation au clavier (flèches, Entrée, Échap, première lettre), ouverture et fermeture en fondu.
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type OrbitOption = { value: string; label: string; hint?: string };

type Props = { value: string; options: OrbitOption[]; onChange: (value: string) => void; icon?: ReactNode; ariaLabel: string; className?: string };

export function OrbitSelect({ value, options, onChange, icon, ariaLabel, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ left: number; top: number; width: number; up: boolean }>({ left: 0, top: 0, width: 0, up: false });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const searchable = options.length > 10;
  const selected = options.find((option) => option.value === value) ?? options[0];
  const needle = query.trim().toLocaleLowerCase("fr");
  const shown = useMemo(() => options.filter((option) => !needle || option.label.toLocaleLowerCase("fr").includes(needle)), [needle, options]);

  const close = (focus = true) => {
    if (!open || closing) return;
    setClosing(true);
    window.setTimeout(() => { setOpen(false); setClosing(false); setQuery(""); if (focus) triggerRef.current?.focus(); }, 160);
  };
  const choose = (option: OrbitOption) => { onChange(option.value); close(); };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const up = r.bottom + 340 > window.innerHeight && r.top > 340;
    setPlace({ left: r.left, top: up ? r.top - 8 : r.bottom + 8, width: Math.max(r.width, 240), up });
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { const t = event.target as Node; if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false); };
    const onScroll = (event: Event) => { if (!panelRef.current?.contains(event.target as Node)) close(false); };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => { document.removeEventListener("pointerdown", onPointer); window.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", onScroll); };
  });

  useEffect(() => { panelRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [active, open]);

  const onKey = (event: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); setOpen(true); }
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (event.key === "Enter") { event.preventDefault(); if (shown[active]) choose(shown[active]); }
    else if (event.key === "Tab") close(false);
    else if (!searchable && event.key.length === 1) {
      const i = shown.findIndex((option) => option.label.toLocaleLowerCase("fr").startsWith(event.key.toLocaleLowerCase("fr")));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <>
      <button ref={triggerRef} type="button" className={`orbit-select ${open ? "is-open" : ""} ${className}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-label={`${ariaLabel} : ${selected?.label ?? ""}`} onClick={() => (open ? close() : setOpen(true))} onKeyDown={onKey}>
        {icon}<span className="orbit-select-value">{selected?.label}</span><ChevronDown size={15} className="orbit-select-chevron" />
      </button>
      {open && createPortal(
        <div ref={panelRef} className={`orbit-select-panel ${place.up ? "is-up" : ""} ${closing ? "is-closing" : ""}`} style={{ left: place.left, top: place.top, width: place.width }} onKeyDown={onKey}>
          {searchable && <label className="orbit-select-search"><Search size={14} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} placeholder="Rechercher" aria-label={`Rechercher dans ${ariaLabel.toLowerCase()}`} /></label>}
          <div id={listId} role="listbox" aria-label={ariaLabel} className="orbit-select-list" tabIndex={-1}>
            {shown.map((option, index) => (
              <div key={option.value || "__all"} role="option" data-index={index} aria-selected={option.value === value} className={`orbit-select-option ${index === active ? "is-active" : ""}`} onPointerEnter={() => setActive(index)} onClick={() => choose(option)}>
                <span>{option.label}{option.hint && <small>{option.hint}</small>}</span>{option.value === value && <Check size={15} />}
              </div>
            ))}
            {!shown.length && <p className="orbit-select-empty">Aucun résultat</p>}
          </div>
        </div>,
        document.querySelector(".app-shell") ?? document.body,
      )}
    </>
  );
}
