/* Halo Opaline reminder: BTL administration keeps the same dark glass cockpit, with coral reserved for destructive actions and cyan for the primary creation flow. */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Plus, Search, Trash2, X } from "lucide-react";
import type { Activation } from "@/data/vodacomData";
import { loadLocalData, saveLocalData } from "@/lib/analytics";
import { ActivationsPage as ReadOnlyActivationsPage } from "@/components/ModuleViews";
import type { Role } from "@/lib/roles";
import "./admin-activation.css";

type Props = { filtered: Activation[]; rangeLabel: string; role: Role; onEdit: (index: number, field: "a" | "s" | "cl" | "n", value: string) => void };
type Draft = Pick<Activation, "d" | "a" | "s" | "c" | "t" | "cl" | "n">;

const actionOptions = ["Opt-in Privilège", "Activation Bundle", "Opt-in Roaming"];
const categoryOptions = ["Shop", "Aéroport", "Agence Jeffery"];
const number = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)).replace(".", "");
const signature = (item: Activation) => [item.d, item.a, item.s, item.c, item.t, item.cl, item.n].join("¦");

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const handleOutsidePointer = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", handleOutsidePointer); return () => document.removeEventListener("mousedown", handleOutsidePointer); }, [open]);
  return <div ref={containerRef} className="admin-field admin-choice"><span>{label}</span><button type="button" className="admin-choice-trigger" onClick={() => setOpen((current) => !current)}>{value}<span className={`admin-choice-chevron ${open ? "is-open" : ""}`}>⌄</span></button>{open && <div className="admin-choice-menu">{options.map((option) => <button type="button" key={option} className={option === value ? "is-selected" : ""} onClick={() => { onChange(option); setOpen(false); }}>{option}</button>)}</div>}</div>;
}

function draftFrom(source: Activation[]): Draft {
  const first = source[0];
  return { d: first?.d ?? "2026-07-23", a: first?.a ?? "", s: first?.s ?? "", c: first?.c ?? "Shop", t: "Opt-in Privilège", cl: "", n: "" };
}

export default function ActivationAdminPage(props: Props) {
  if (props.role === "vodacom") return <ReadOnlyActivationsPage {...props} />;
  return <BtlActivationAdmin {...props} />;
}

function BtlActivationAdmin({ filtered, rangeLabel }: Props) {
  const source = loadLocalData([]);
  const dates = source.map((item) => item.d).sort();
  const minDate = dates[0] ?? "2026-07-23";
  const maxDate = dates.at(-1) ?? "2026-08-08";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ item: Activation; index: number } | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(source));
  const pageSize = 8;
  const rows = useMemo(() => {
    const active = new Set(filtered);
    const positions = new Map<string, number[]>();
    source.forEach((item, index) => positions.set(signature(item), [...(positions.get(signature(item)) ?? []), index]));
    const seen = new Map<string, number>();
    return filtered.map((item) => { const key = signature(item); const occurrence = seen.get(key) ?? 0; seen.set(key, occurrence + 1); return { item, index: positions.get(key)?.[occurrence] ?? -1 }; }).filter(({ item }) => active.has(item) && [item.d, item.a, item.s, item.t, item.cl, item.n].join(" ").toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sortAsc ? a.item.d.localeCompare(b.item.d) : b.item.d.localeCompare(a.item.d));
  }, [filtered, query, sortAsc, source]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((Math.min(page, pages) - 1) * pageSize, Math.min(page, pages) * pageSize);

  const updateDraft = (field: keyof Draft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const openForm = () => { setDraft(draftFrom(source)); setMessage(""); setFormOpen(true); };
  const addActivation = () => {
    const clean = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as Draft;
    const date = new Date(`${clean.d}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.d) || Number.isNaN(date.getTime()) || clean.d < minDate || clean.d > maxDate) return setMessage(`La date doit être comprise entre ${minDate} et ${maxDate}.`);
    if (!clean.a || !clean.s || !clean.t) return setMessage("Date, hôtesse, shop et type d’action sont obligatoires.");
    const nextRecord: Activation = { ...clean };
    if (source.some((item) => signature(item) === signature(nextRecord))) return setMessage("Cette activation existe déjà dans la source locale.");
    saveLocalData([nextRecord, ...source]);
    setFormOpen(false);
    setMessage("Activation ajoutée. Les indicateurs et exports seront recalculés après actualisation.");
    window.location.reload();
  };
  const deleteActivation = () => {
    if (!confirmDelete || confirmDelete.index < 0) return;
    saveLocalData(source.filter((_, index) => index !== confirmDelete.index));
    setConfirmDelete(null);
    setMessage("Activation supprimée. Les indicateurs et exports seront recalculés après actualisation.");
    window.location.reload();
  };

  useEffect(() => {
    const handleOutsidePointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const backdrop = target.closest(".admin-modal-backdrop");
      if (!backdrop || target !== backdrop) return;
      if (backdrop.querySelector('[aria-labelledby="delete-modal-title"]')) setConfirmDelete(null);
      else setFormOpen(false);
    };
    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, []);

  return <div className="module-page activation-admin-page"><section className="module-heading glass-card"><div className="eyebrow">ADMINISTRATION BTL <span className="eyebrow-line" /></div><h1>Activations</h1><p>Ajoutez ou retirez une ligne de campagne. Les tableaux, KPI, graphiques et exports suivent la source locale.</p><div className="module-context"><span className="live-pulse" /> {rangeLabel} · {number(rows.length)} activation(s) visibles</div></section><section className="module-panel glass-card activation-admin-panel"><div className="admin-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Rechercher une activation…" /><kbd>⌘ K</kbd></div><button className="soft-button" onClick={() => setSortAsc((value) => !value)}>Date {sortAsc ? "croissante" : "décroissante"}</button><span className="toolbar-count">{number(rows.length)} lignes</span><button className="primary-button admin-add-button" onClick={openForm}><Plus size={15} /> Nouvelle activation</button></div><div className="admin-permission-note"><Check size={15} /> BTL · création et suppression actives · source conservée dans ce navigateur</div>{visible.length ? <><div className="admin-activation-table"><div className="admin-activation-head"><span>Date</span><span>Hôtesse</span><span>Shop</span><span>Type</span><span>Client</span><span>Numéro</span><span /></div>{visible.map(({ item, index }) => <div className="admin-activation-row" key={`${index}-${signature(item)}`}><button className="admin-activation-main" type="button" onClick={() => setMessage(`${item.t} · ${dateLabel(item.d)} · ${item.a}`)}><span>{dateLabel(item.d)}</span><strong>{item.a}</strong><span>{item.s}</span><span><em className={`action-pill action-${item.t.includes("Privilège") ? "privilege" : item.t.includes("Bundle") ? "bundle" : "roaming"}`}>{item.t}</em></span><span>{item.cl || "—"}</span><span className="phone-cell">{item.n || "—"}</span></button><button className="admin-delete-button" type="button" aria-label={`Supprimer l’activation de ${item.a}`} onClick={() => setConfirmDelete({ item, index })}><Trash2 size={15} /></button></div>)}</div><div className="pagination"><span>Page {Math.min(page, pages)} sur {pages}</span><div><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button><button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>›</button></div></div></> : <div className="empty-module"><Search size={18} /><strong>Aucune activation dans la sélection</strong><span>Modifiez la recherche ou la période active.</span></div>}{message && <div className="admin-feedback"><Check size={15} /> {message}</div>}</section>{formOpen && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="activation-modal-title"><div className="admin-modal-heading"><div><div className="eyebrow">NOUVELLE LIGNE</div><h2 id="activation-modal-title">Ajouter une activation</h2><p>La date doit rester dans la campagne source : {minDate} → {maxDate}.</p></div><button className="close-detail" onClick={() => setFormOpen(false)} aria-label="Fermer"><X size={16} /></button></div><div className="admin-form-grid"><label className="admin-field"><span>Date · AAAA-MM-JJ</span><input value={draft.d} onChange={(event) => updateDraft("d", event.target.value)} placeholder="2026-07-23" /></label><label className="admin-field"><span>Hôtesse</span><input value={draft.a} onChange={(event) => updateDraft("a", event.target.value)} placeholder="Nom de l’hôtesse" /></label><label className="admin-field"><span>Shop</span><input value={draft.s} onChange={(event) => updateDraft("s", event.target.value)} placeholder="Nom du shop" /></label><Choice label="Type d’action" value={draft.t} options={actionOptions} onChange={(value) => updateDraft("t", value)} /><Choice label="Catégorie" value={draft.c} options={categoryOptions} onChange={(value) => updateDraft("c", value)} /><label className="admin-field"><span>Client · optionnel</span><input value={draft.cl} onChange={(event) => updateDraft("cl", event.target.value)} placeholder="Nom du client" /></label><label className="admin-field"><span>Numéro · optionnel</span><input value={draft.n} onChange={(event) => updateDraft("n", event.target.value.replace(/\D/g, ""))} placeholder="Numéro client" inputMode="numeric" /></label></div><div className="admin-modal-actions"><button className="soft-button" onClick={() => setFormOpen(false)}>Annuler</button><button className="primary-button" onClick={addActivation}><Plus size={15} /> Ajouter</button></div></section></div>}{confirmDelete && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-danger-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"><div className="admin-danger-icon"><AlertTriangle size={22} /></div><div className="admin-modal-heading"><div><div className="eyebrow">ACTION IRRÉVERSIBLE LOCALE</div><h2 id="delete-modal-title">Supprimer cette activation ?</h2><p>{dateLabel(confirmDelete.item.d)} · {confirmDelete.item.a} · {confirmDelete.item.s}</p></div><button className="close-detail" onClick={() => setConfirmDelete(null)} aria-label="Fermer"><X size={16} /></button></div><div className="admin-modal-actions"><button className="soft-button" onClick={() => setConfirmDelete(null)}>Annuler</button><button className="danger-button" onClick={deleteActivation}><Trash2 size={15} /> Supprimer</button></div></section></div>}</div>;
}
