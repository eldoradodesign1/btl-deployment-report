// Journal des activations (et des transactions Merchant en lecture) : recherche, tri, filtre shop, pagination,
// détail dans un tiroir à droite et suppression confirmée dans la ligne même.
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownUp, Check, ChevronLeft, ChevronRight, Eye, Plus, Search, Store, Trash2 } from "lucide-react";
import type { Activation } from "@/data/vodacomData";
import { Drawer, PillSelect, RowMenu, maskNumber } from "@/orbit/DataKit";

export type JournalRow = { item: Activation; key: string; index?: number };

const number = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
const amount = (value?: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value ?? 0));
export const journalDate = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`)).replace(".", "");
const longDate = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
const haystack = (item: Activation) => [item.d, item.a, item.s, item.t, item.cl, item.n, item.c, journalDate(item.d), item.merchant?.reference ?? ""].join(" ").toLowerCase();
const PAGE_SIZE = 10;

type Props = {
  rows: JournalRow[];
  merchant?: boolean;
  initialQuery?: string;
  createLabel?: string;
  onCreate?: () => void;
  onDelete?: (row: JournalRow) => Promise<void>;
  aside?: ReactNode;
  message?: string;
  note?: ReactNode;
};

export function ActivationJournal({ rows, merchant = false, initialQuery = "", createLabel, onCreate, onDelete, aside, message, note }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [order, setOrder] = useState<"recent" | "oldest">("recent");
  const [shop, setShop] = useState("all");
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Activation | null>(null);
  useEffect(() => { setQuery(initialQuery); setPage(1); }, [initialQuery]);
  useEffect(() => { if (aside) setDetail(null); }, [aside]);

  const shops = useMemo(() => Array.from(new Set(rows.map(({ item }) => item.s).filter(Boolean))).sort((left, right) => left.localeCompare(right, "fr")), [rows]);
  const result = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(({ item }) => (shop === "all" || item.s === shop) && haystack(item).includes(needle)).sort((left, right) => order === "oldest" ? left.item.d.localeCompare(right.item.d) : right.item.d.localeCompare(left.item.d));
  }, [rows, query, shop, order]);
  const pages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = result.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const record = merchant ? "transaction" : "activation";
  const place = merchant ? "Point de vente" : "Shop";

  const remove = async (row: JournalRow) => {
    if (!onDelete) return;
    setBusy(true);
    try { await onDelete(row); setConfirming(null); } finally { setBusy(false); }
  };

  const drawer = aside ?? (detail && <Drawer title={merchant ? "Détail de la transaction" : "Détail de l’activation"} onClose={() => setDetail(null)}>
    <dl className="dn-facts-list">
      <div><dt>Date</dt><dd>{longDate(detail.d)}</dd></div>
      <div><dt>{merchant ? "Ambassadeur" : "Agent"}</dt><dd>{detail.a}</dd></div>
      <div><dt>{place}</dt><dd>{detail.s}</dd></div>
      <div><dt>Catégorie</dt><dd>{detail.c || "—"}</dd></div>
      <div><dt>Type</dt><dd>{detail.t}</dd></div>
      <div><dt>Client</dt><dd>{detail.cl || "Non renseigné"}</dd></div>
      <div><dt>Numéro</dt><dd>{detail.n || "Non renseigné"}</dd></div>
      {merchant && <div><dt>Montant</dt><dd>{amount(detail.merchant?.amount)}</dd></div>}
    </dl>
  </Drawer>);

  return <div className={`dn-split ${drawer ? "has-drawer" : ""}`}>
    <section className="glass-card dn-card">
      <div className="dn-card-bar">
        <label className="orbit-search dn-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={merchant ? "Ambassadeur, point de vente, numéro…" : "Agent, shop, numéro…"} aria-label={`Rechercher une ${record}`} /></label>
        <PillSelect label="Ordre" icon={<ArrowDownUp size={14} />} value={order} options={[{ id: "recent", label: "Plus récentes" }, { id: "oldest", label: "Plus anciennes" }]} onChange={(value) => { setOrder(value as "recent" | "oldest"); setPage(1); }} />
        <PillSelect label={place} icon={<Store size={14} />} value={shop} options={[{ id: "all", label: merchant ? "Tous les points de vente" : "Tous les shops" }, ...shops.map((name) => ({ id: name, label: name }))]} onChange={(value) => { setShop(value); setPage(1); }} />
        <span className="dn-spacer" />
        <span className="dn-tag">{number(result.length)} ligne{result.length > 1 ? "s" : ""}</span>
        {onCreate && <button type="button" className="orbit-primary dn-primary" onClick={onCreate}><Plus size={15} /> {createLabel ?? `Nouvelle ${record}`}</button>}
      </div>
      {note}
      {visible.length ? <div className="dn-table-wrap"><table className="orbit-table dn-table">
        <thead><tr><th>Date</th><th>{merchant ? "Ambassadeur" : "Agent"}</th><th className="dn-hide-sm">{place}</th>{merchant ? <th className="r">Montant</th> : <th className="c">Opt-in</th>}<th className="dn-hide-sm">Client</th><th className="dn-col-menu"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{visible.map((row) => {
          const { item, key } = row;
          if (confirming === key) return <tr key={key} className="dn-confirm"><td colSpan={6}><div className="dn-confirm-line"><Trash2 size={16} /><b>Supprimer l’{record} du {journalDate(item.d)} ({item.a}) ?</b><span className="dn-spacer" /><button type="button" className="orbit-ghost" disabled={busy} onClick={() => setConfirming(null)}>Annuler</button><button type="button" className="dn-danger" disabled={busy} onClick={() => void remove(row)}>{busy ? "Suppression…" : "Supprimer"}</button></div></td></tr>;
          const optIn = item.t === "Opt-in Privilège";
          return <tr key={key}>
            <td>{journalDate(item.d)}</td>
            <td><strong>{item.a}</strong></td>
            <td className="dn-dim dn-hide-sm">{item.s}</td>
            {merchant ? <td className="r num">{amount(item.merchant?.amount)}</td> : <td className="c"><span className={`dn-tag ${optIn ? "is-ok" : ""}`} title={item.t}>{optIn && <Check size={12} />}{optIn ? "Oui" : "Non"}</span></td>}
            <td className="dn-dim dn-phone dn-hide-sm">{maskNumber(item.n)}</td>
            <td className="r"><RowMenu label={`Actions pour la ligne du ${journalDate(item.d)} (${item.a})`} items={[{ label: "Voir le détail", icon: <Eye size={14} />, onSelect: () => setDetail(item) }, ...(onDelete ? [{ label: "Supprimer", icon: <Trash2 size={14} />, danger: true, onSelect: () => setConfirming(key) }] : [])]} /></td>
          </tr>;
        })}</tbody>
      </table></div> : <div className="orbit-empty">{rows.length ? "Aucune ligne ne correspond à la recherche ou au filtre." : "Aucune ligne dans la période sélectionnée."}</div>}
      {message && <div className="dn-feedback"><Check size={15} /> {message}</div>}
      <div className="dn-pager"><span>Page {current} sur {pages}</span><span className="dn-spacer" /><button type="button" className="dn-icon-button" aria-label="Page précédente" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button><button type="button" className="dn-icon-button" aria-label="Page suivante" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button></div>
    </section>
    {drawer}
  </div>;
}
