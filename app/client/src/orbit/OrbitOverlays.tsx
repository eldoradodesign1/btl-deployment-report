// Info-bulles et menu contextuel Orbit, pour toute l'appli : remplacent ceux du navigateur.
// Info-bulles : tout élément avec un attribut title s'affiche dans une bulle Orbit (le title natif est retiré au survol).
// Menu contextuel : édition (couper, copier, coller, tout sélectionner) dans les champs, copie de la sélection ou d'un lien,
// puis les actions de l'appli (exporter, période, apparence, actualiser, copier le lien de la page).
import { CalendarDays, ClipboardPaste, Copy, Download, Link2, Palette, RefreshCw, Scissors, TextSelect } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Tip = { text: string; x: number; y: number; below: boolean } | null;
type Item = { label: string; icon: ReactNode; shortcut?: string; run: () => void; disabled?: boolean } | "sep";
type Menu = { x: number; y: number; items: Item[] } | null;

const isEditable = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  !!el && ((el instanceof HTMLInputElement && !["checkbox", "radio", "range", "button", "submit", "file"].includes(el.type)) || el instanceof HTMLTextAreaElement);

function insertText(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  field.focus();
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;
  field.setRangeText(text, start, end, "end");
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

export function OrbitOverlays() {
  const [tip, setTip] = useState<Tip>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const timer = useRef<number | undefined>(undefined);
  const owner = useRef<Element | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ── Info-bulles ──
  useEffect(() => {
    const restore = () => {
      window.clearTimeout(timer.current);
      const el = owner.current as HTMLElement | null;
      if (el?.dataset.orbitTitle !== undefined) { el.setAttribute("title", el.dataset.orbitTitle); delete el.dataset.orbitTitle; }
      owner.current = null;
      setTip(null);
    };
    const over = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const el = (event.target as Element | null)?.closest?.("[title]") as HTMLElement | null;
      if (!el || el === owner.current) return;
      restore();
      const text = el.getAttribute("title") ?? "";
      if (!text.trim()) return;
      el.dataset.orbitTitle = text;
      el.removeAttribute("title");
      owner.current = el;
      timer.current = window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        const below = r.top < 54;
        setTip({ text, x: Math.min(window.innerWidth - 16, Math.max(16, r.left + r.width / 2)), y: below ? r.bottom + 8 : r.top - 8, below });
      }, 380);
    };
    const out = (event: PointerEvent) => { if (owner.current && !owner.current.contains(event.relatedTarget as Node)) restore(); };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointerdown", restore, true);
    window.addEventListener("scroll", restore, true);
    return () => { document.removeEventListener("pointerover", over); document.removeEventListener("pointerout", out); document.removeEventListener("pointerdown", restore, true); window.removeEventListener("scroll", restore, true); };
  }, []);

  // ── Menu contextuel ──
  useEffect(() => {
    const open = (event: MouseEvent) => {
      event.preventDefault();
      const target = event.target as Element;
      const field = isEditable(target) ? target : null;
      const selection = window.getSelection()?.toString() ?? "";
      const link = target.closest?.("a[href]") as HTMLAnchorElement | null;
      const items: Item[] = [];
      if (field) {
        const has = (field.selectionEnd ?? 0) > (field.selectionStart ?? 0);
        const picked = () => field.value.slice(field.selectionStart ?? 0, field.selectionEnd ?? 0);
        items.push(
          { label: "Couper", icon: <Scissors size={15} />, shortcut: "Ctrl+X", disabled: !has || field.readOnly, run: () => { void navigator.clipboard?.writeText(picked()); insertText(field, ""); } },
          { label: "Copier", icon: <Copy size={15} />, shortcut: "Ctrl+C", disabled: !has, run: () => void navigator.clipboard?.writeText(picked()) },
          { label: "Coller", icon: <ClipboardPaste size={15} />, shortcut: "Ctrl+V", disabled: field.readOnly, run: () => { navigator.clipboard?.readText().then((text) => insertText(field, text)).catch(() => field.focus()); } },
          { label: "Tout sélectionner", icon: <TextSelect size={15} />, shortcut: "Ctrl+A", run: () => { field.focus(); field.select(); } },
          "sep",
        );
      } else {
        if (selection.trim()) items.push({ label: "Copier", icon: <Copy size={15} />, shortcut: "Ctrl+C", run: () => void navigator.clipboard?.writeText(selection) });
        if (link) items.push({ label: "Copier le lien", icon: <Link2 size={15} />, run: () => void navigator.clipboard?.writeText(link.href) });
        if (items.length) items.push("sep");
      }
      const inApp = !!document.querySelector(".app-shell");
      if (inApp) {
        items.push(
          { label: "Exporter le rapport", icon: <Download size={15} />, run: () => window.dispatchEvent(new Event("orbit:export")) },
          { label: "Choisir la période", icon: <CalendarDays size={15} />, run: () => document.querySelector<HTMLButtonElement>(".topbar .orbit-period-pill")?.click() },
          { label: "Apparence", icon: <Palette size={15} />, run: () => window.dispatchEvent(new Event("orbit:appearance")) },
        );
      }
      items.push(
        { label: "Actualiser", icon: <RefreshCw size={15} />, shortcut: "F5", run: () => window.location.reload() },
        { label: "Copier le lien de la page", icon: <Link2 size={15} />, run: () => void navigator.clipboard?.writeText(window.location.href) },
      );
      const width = 250, height = items.length * 38;
      setMenu({ x: Math.min(event.clientX, window.innerWidth - width - 8), y: Math.min(event.clientY, window.innerHeight - height - 8), items });
    };
    document.addEventListener("contextmenu", open);
    return () => document.removeEventListener("contextmenu", open);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (event: Event) => { if (!(event.target instanceof Node && menuRef.current?.contains(event.target))) setMenu(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", close, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", onKey);
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return () => { document.removeEventListener("pointerdown", close, true); window.removeEventListener("scroll", close, true); window.removeEventListener("blur", close); window.removeEventListener("keydown", onKey); };
  }, [menu]);

  return createPortal(
    <>
      {tip && <div className={`orbit-tip ${tip.below ? "is-below" : ""}`} role="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>}
      {menu && <div ref={menuRef} className="orbit-context glass-card" role="menu" style={{ left: menu.x, top: menu.y }} onKeyDown={(event) => {
        const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "ArrowDown") { event.preventDefault(); buttons[(i + 1) % buttons.length]?.focus(); }
        if (event.key === "ArrowUp") { event.preventDefault(); buttons[(i - 1 + buttons.length) % buttons.length]?.focus(); }
      }}>
        {menu.items.map((item, index) => item === "sep" ? <div key={index} className="orbit-context-sep" /> : (
          <button key={index} type="button" role="menuitem" disabled={item.disabled} onClick={() => { setMenu(null); item.run(); }}>{item.icon}<span>{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}</button>
        ))}
      </div>}
    </>,
    document.body,
  );
}
