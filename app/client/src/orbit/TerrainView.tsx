// Terrain : classement des agents ou des shops en tableau triable, avec fiche détaillée de la ligne choisie.
// Chiffres recalculés à partir des activations de la période ; rien n'est écrit.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Lock, Search, Store, UserRound, X, Zap } from "lucide-react";
import type { Activation } from "@/data/vodacomData";
import { ACTIONS } from "@/lib/analytics";
import type { Role } from "@/lib/roles";
import { campaignTerms } from "@/lib/campaigns";
import { dayTitle } from "@/orbit/dates";

type Field = "a" | "s";
type SortKey = "name" | "main" | "count" | "optIn" | "days" | "share";
type Row = { name: string; rank: number; count: number; optIn: number; days: Set<string>; main: string; agents: number; byDate: Map<string, number> };
type Props = { page: string; filtered: Activation[]; rangeLabel: string; role: Role; onSwitch: (page: string) => void; onOpenActivations: (query: string) => void };

const number = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
const decimal = (value: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const percent = (part: number, total: number) => Math.round((part / Math.max(total, 1)) * 100);
const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

function buildRows(source: Activation[], field: Field): Row[] {
  const other: Field = field === "a" ? "s" : "a";
  const groups = new Map<string, Activation[]>();
  source.forEach((item) => groups.set(item[field], [...(groups.get(item[field]) ?? []), item]));
  return Array.from(groups.entries()).map(([name, items]) => {
    const counterpart = new Map<string, number>(); const byDate = new Map<string, number>();
    items.forEach((item) => { counterpart.set(item[other], (counterpart.get(item[other]) ?? 0) + 1); byDate.set(item.d, (byDate.get(item.d) ?? 0) + 1); });
    const main = Array.from(counterpart.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))[0]?.[0] ?? "—";
    return { name, rank: 0, count: items.length, optIn: items.filter((item) => item.t === ACTIONS[0]).length, days: new Set(byDate.keys()), main, agents: counterpart.size, byDate };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr")).map((row, index) => ({ ...row, rank: index + 1 }));
}

function CumulativeCurve({ dates, byDate }: { dates: string[]; byDate: Map<string, number> }) {
  const width = 300; const height = 84; let total = 0;
  const points = dates.map((date) => (total += byDate.get(date) ?? 0));
  const max = Math.max(total, 1); const step = dates.length > 1 ? width / (dates.length - 1) : width;
  const xy = (value: number, index: number) => `${(dates.length > 1 ? index * step : width).toFixed(1)},${(height - 4 - (value / max) * (height - 12)).toFixed(1)}`;
  const line = points.map(xy).join(" ");
  return <svg className="tr-curve" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="tr-curve-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(var(--o-aur2))" stopOpacity=".42" /><stop offset="1" stopColor="rgb(var(--o-aur2))" stopOpacity="0" /></linearGradient><linearGradient id="tr-curve-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="rgb(var(--o-aur1))" /><stop offset=".6" stopColor="rgb(var(--o-aur2))" /><stop offset="1" stopColor="rgb(var(--o-aur3))" /></linearGradient></defs>{[.25, .5, .75].map((f) => <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} className="tr-curve-grid" vectorEffect="non-scaling-stroke" />)}<polygon points={`0,${height} ${line} ${width},${height}`} fill="url(#tr-curve-fill)" /><polyline points={line} fill="none" stroke="url(#tr-curve-line)" strokeWidth="2.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
}

export function TerrainView({ page, filtered, rangeLabel, role, onSwitch, onOpenActivations }: Props) {
  const merchant = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "brand_ambassador";
  const terms = campaignTerms(merchant ? "brand_ambassador" : undefined);
  const field: Field = page === "shops" ? "s" : "a";
  const [query, setQuery] = useState(""); const [scope, setScope] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "count", asc: false });
  const [selected, setSelected] = useState<string | null>(() => isPhone() ? null : "");
  const [phone, setPhone] = useState(isPhone);
  useEffect(() => { const query = window.matchMedia("(max-width: 760px)"); const sync = () => setPhone(query.matches); query.addEventListener("change", sync); return () => query.removeEventListener("change", sync); }, []);
  const scopeField: Field = field === "a" ? "s" : "a";
  const scopeOptions = useMemo(() => Array.from(new Set(filtered.map((item) => item[scopeField]))).sort((a, b) => a.localeCompare(b, "fr")), [filtered, scopeField]);
  const activeScope = scopeOptions.includes(scope) ? scope : "";
  const source = useMemo(() => activeScope ? filtered.filter((item) => item[scopeField] === activeScope) : filtered, [activeScope, filtered, scopeField]);
  const rows = useMemo(() => buildRows(source, field), [source, field]);
  const periodDates = useMemo(() => Array.from(new Set(source.map((item) => item.d))).sort(), [source]);
  const agentsCount = useMemo(() => new Set(filtered.map((item) => item.a)).size, [filtered]); const shopsCount = useMemo(() => new Set(filtered.map((item) => item.s)).size, [filtered]);
  const needle = query.trim().toLocaleLowerCase("fr");
  const value = (row: Row, key: SortKey): number | string => key === "name" ? row.name : key === "main" ? (field === "a" ? row.main : row.agents) : key === "optIn" ? row.optIn / Math.max(row.count, 1) : key === "days" ? row.days.size : row.count;
  const shown = rows.filter((row) => !needle || row.name.toLocaleLowerCase("fr").includes(needle) || (field === "a" && row.main.toLocaleLowerCase("fr").includes(needle))).sort((a, b) => { const left = value(a, sort.key); const right = value(b, sort.key); const order = typeof left === "string" ? left.localeCompare(String(right), "fr") : left - (right as number); return (sort.asc ? order : -order) || a.rank - b.rank; });
  // "" = première ligne par défaut (ordinateur) ; null = fiche fermée.
  const current = selected === null ? null : rows.find((row) => row.name === selected) ?? shown[0] ?? null;
  const participant = field === "a" ? terms.participant : terms.location;
  const columns: { key: SortKey; label: string; align?: "r"; className?: string }[] = [{ key: "name", label: participant }, { key: "main", label: field === "a" ? `${terms.location} principal` : `${terms.participants} actifs`, align: field === "a" ? undefined : "r", className: "tr-col-main" }, { key: "count", label: terms.records, align: "r" }, ...(!merchant ? [{ key: "optIn" as SortKey, label: "Opt-in", align: "r" as const, className: "tr-col-opt" }] : []), { key: "days", label: "Jours", align: "r", className: "tr-col-days" }, { key: "share", label: "Part", align: "r" }];
  const toggleSort = (key: SortKey) => setSort((state) => state.key === key ? { key, asc: !state.asc } : { key, asc: key === "name" || key === "main" && field === "a" });
  // Sur téléphone, la fiche devient une feuille du bas rendue à la racine de l'appli (hors des parents animés).
  const place = (node: ReactNode) => phone ? createPortal(node, document.querySelector(".app-shell") ?? document.body) : node;
  const absences = current ? periodDates.filter((date) => !current.byDate.has(date)).length : 0;

  return <div className={`module-page orbit-terrain tr-terrain ${current ? "has-detail" : ""}`}>
    <div className="orbit-toolbar"><div className="orbit-seg" role="tablist" aria-label="Terrain"><button type="button" role="tab" aria-selected={field === "a"} onClick={() => onSwitch("agents")}>{terms.participants} · {agentsCount}</button><button type="button" role="tab" aria-selected={field === "s"} onClick={() => onSwitch("shops")}>{terms.locations} · {shopsCount}</button></div><span className="orbit-toolbar-note">{rangeLabel}</span></div>
    <div className="tr-layout">
      <section className="glass-card tr-card">
        <div className="tr-tools"><label className="orbit-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={field === "a" ? `Rechercher un ${terms.participant.toLowerCase()}` : `Rechercher un ${terms.location.toLowerCase()}`} /></label><label className="tr-scope">{scopeField === "s" ? <Store size={15} /> : <UserRound size={15} />}<select value={activeScope} onChange={(event) => setScope(event.target.value)} aria-label={scopeField === "s" ? `Filtrer par ${terms.location.toLowerCase()}` : `Filtrer par ${terms.participant.toLowerCase()}`}><option value="">{scopeField === "s" ? `Tous les ${terms.locations.toLowerCase()}` : `Tous les ${terms.participants.toLowerCase()}`}</option>{scopeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={14} /></label><span className="tr-count">{shown.length} {(field === "a" ? terms.participants : terms.locations).toLowerCase()}</span></div>
        <div className="tr-table-wrap"><table className="orbit-table tr-table"><thead><tr><th className="c">#</th>{columns.map((column) => <th key={column.key} className={`${column.align ?? ""} ${column.className ?? ""}`} aria-sort={sort.key === column.key ? (sort.asc ? "ascending" : "descending") : undefined}><button type="button" className={`tr-sort ${sort.key === column.key ? "is-active" : ""}`} onClick={() => toggleSort(column.key)}>{column.label}{sort.key === column.key ? sort.asc ? <ChevronUp size={13} /> : <ChevronDown size={13} /> : <ChevronDown size={13} className="tr-sort-idle" />}</button></th>)}</tr></thead>
          <tbody>{shown.map((row) => <tr key={row.name} className={current?.name === row.name ? "is-selected" : ""} onClick={() => setSelected(current?.name === row.name && isPhone() ? null : row.name)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(row.name); } }}><td className="c"><span className="orbit-rank">{row.rank}</span></td><td><strong>{row.name}</strong>{field === "a" && <small className="tr-phone-sub">{row.main}</small>}</td><td className={`tr-col-main ${field === "s" ? "r" : ""}`}>{field === "a" ? <span className="tr-ellipsis" title={row.main}>{row.main}</span> : row.agents}</td><td className="r num">{number(row.count)}</td>{!merchant && <td className="r tr-col-opt">{percent(row.optIn, row.count)} %</td>}<td className="r tr-col-days">{row.days.size}</td><td className="r orbit-share">{percent(row.count, source.length)} %</td></tr>)}</tbody></table></div>
        {!shown.length && <p className="orbit-empty">{needle ? `Aucun résultat pour « ${query.trim()} ».` : `Aucune donnée sur ${rangeLabel}.`}</p>}
      </section>
      {current && place(<><div className="tr-veil" onClick={() => setSelected(null)} aria-hidden="true" /><aside className="glass-card tr-drawer" aria-label={`Fiche de ${current.name}`} key={current.name}>
        <div className="tr-row"><span className="tr-avatar">{initialsOf(current.name)}</span><div className="tr-who"><h3>{current.name}</h3><span className="tr-sub">{field === "a" ? current.main : `${current.agents} ${terms.participants.toLowerCase()} actifs`} · rang {current.rank}</span></div><button type="button" className="tr-close" aria-label="Fermer la fiche" onClick={() => setSelected(null)}><X size={16} /></button></div>
        <div className="tr-figure"><strong>{number(current.count)}</strong><span>{terms.records.toLowerCase()} · {percent(current.count, source.length)} % du total</span></div>
        <CumulativeCurve dates={periodDates} byDate={current.byDate} />
        <div className="tr-facts">{!merchant && <span><b>{percent(current.optIn, current.count)} %</b> opt-in</span>}<span><b>{current.days.size}</b> jours</span><span><b>{decimal(current.count / Math.max(current.days.size, 1))}</b> par jour</span></div>
        <div className="tr-presence"><span className="tr-label">Présence</span><div className="tr-dots">{periodDates.map((date) => { const count = current.byDate.get(date); return <span key={date} className={count ? "" : "is-absent"} title={`${dayTitle(date)} · ${count ? `${count} ${terms.records.toLowerCase()}` : "absent"}`} />; })}</div><span className="tr-sub">{absences ? `${absences} absence${absences > 1 ? "s" : ""} sur ${periodDates.length} jours` : `Présent les ${periodDates.length} jours actifs`}</span></div>
        <div className="tr-actions"><button type="button" className="tr-ghost" onClick={() => onOpenActivations(current.name)}><Zap size={14} />Ses {terms.records.toLowerCase()}</button>{role === "vodacom" && <span className="tr-lock"><Lock size={12} />Renommer : BTL</span>}</div>
      </aside></>)}
    </div>
  </div>;
}
