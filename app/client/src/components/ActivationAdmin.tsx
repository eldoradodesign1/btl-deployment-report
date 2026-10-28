/* Halo Opaline reminder: BTL administration keeps the same dark glass cockpit, with coral reserved for destructive actions and cyan for the primary creation flow. */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ImageIcon, Pencil, Phone, Plus, Search, Store, Trash2, Upload, UserRound, X } from "lucide-react";
import type { Activation } from "@/data/vodacomData";
import { loadLocalData, saveLocalData } from "@/lib/analytics";
import { ActivationsPage as ReadOnlyActivationsPage } from "@/components/ModuleViews";
import type { Role } from "@/lib/roles";
import { getMerchantEvidenceUrl, type MerchantTransactionChanges, type MerchantTransactionCreate } from "@/lib/supabaseActions";
import { loadMerchantCreationContext, type MerchantCreationContext } from "@/lib/supabaseData";
import { ActivationJournal, type JournalRow } from "@/components/ActivationJournal";
import { Drawer, PillSelect, RowMenu, Seg, SuggestField, Toggle } from "@/orbit/DataKit";
import "./admin-activation.css";

type Props = {
  filtered: Activation[];
  allData?: Activation[];
  rangeLabel: string;
  role: Role;
  onEdit: (index: number, field: "a" | "s" | "cl" | "n", value: string) => Promise<void>;
  onCreate?: (record: Activation) => Promise<void>;
  onDelete?: (record: Activation) => Promise<void>;
  onMerchantCreate?: (transaction: MerchantTransactionCreate) => Promise<void>;
  onMerchantUpdate?: (record: Activation, changes: MerchantTransactionChanges) => Promise<void>;
  onMerchantDelete?: (record: Activation) => Promise<void>;
  merchantCampaignId?: string;
  initialQuery?: string;
};
type Draft = Pick<Activation, "d" | "a" | "s" | "c" | "t" | "cl" | "n">;

const number = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)).replace(".", "");
const signature = (item: Activation) => [item.d, item.a, item.s, item.c, item.t, item.cl, item.n].join("¦");

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const handleOutsidePointer = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", handleOutsidePointer); return () => document.removeEventListener("mousedown", handleOutsidePointer); }, [open]);
  return <div ref={containerRef} className="admin-field admin-choice"><span>{label}</span><button type="button" className="admin-choice-trigger" onClick={() => setOpen((current) => !current)}>{value}<ChevronDown className={`admin-choice-chevron ${open ? "is-open" : ""}`} size={14} /></button>{open && <div className="admin-choice-menu">{options.map((option) => <button type="button" key={option} className={option === value ? "is-selected" : ""} onClick={() => { onChange(option); setOpen(false); }}>{option}</button>)}</div>}</div>;
}

function draftFrom(source: Activation[], date?: string): Draft {
  return { d: date ?? source[0]?.d ?? "2026-07-23", a: "", s: "", c: "Shop", t: "Opt-in Privilège", cl: "", n: "" };
}

export default function ActivationAdminPage(props: Props) {
  if (props.role === "vodacom") return <ReadOnlyActivationsPage {...props} initialQuery={props.initialQuery} />;
  const isMerchantCampaign = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "brand_ambassador";
  if (isMerchantCampaign) return <BtlMerchantTransactionAdminV4 {...props} />;
  return <BtlActivationAdmin {...props} />;
}

function MerchantProofDropzone({ file, previewUrl, onFile }: { file: File | null; previewUrl: string | null; onFile: (file?: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = (candidate?: File) => { if (candidate) onFile(candidate); };
  return <div className={`merchant-proof-dropzone ${file ? "has-file" : ""}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); pick(event.dataTransfer.files?.[0]); }}>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => pick(event.target.files?.[0])} />
    {previewUrl ? <img src={previewUrl} alt="Aperçu de la capture du transfert" /> : <span className="merchant-proof-icon"><Upload size={20} /></span>}
    <div><strong>{file ? file.name : "Capture du transfert obligatoire"}</strong><small>{file ? `${Math.ceil(file.size / 1024)} Ko · cliquez pour remplacer` : "Déposez une image ou cliquez pour sélectionner un fichier JPG, PNG ou WEBP."}</small></div>
    <em>OBLIGATOIRE</em>
  </div>;
}

function BtlMerchantTransactionAdminV4({ filtered, allData, rangeLabel, onMerchantCreate, onMerchantUpdate, onMerchantDelete, merchantCampaignId, initialQuery = "" }: Props) {
  type Form = MerchantDraft & { ambassador: string; point: string };
  const source = (allData ?? []).filter((record) => Boolean(record.merchant));
  const [context, setContext] = useState<MerchantCreationContext>({ campaignRunId: "", ambassadors: [], points: [] });
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState("all");
  const [ambassadorId, setAmbassadorId] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Activation | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Activation | null>(null);
  const [draft, setDraft] = useState<Form | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!merchantCampaignId) return;
    let live = true;
    void loadMerchantCreationContext(merchantCampaignId).then((next) => { if (live) setContext(next); }).catch(() => { if (live) setMessage("Les référentiels Merchant sont indisponibles."); });
    return () => { live = false; };
  }, [merchantCampaignId]);

  const ambassadors = useMemo(() => {
    const values = new Map<string, string>();
    source.forEach((record) => { if (record.merchant?.baId) values.set(record.merchant.baId, record.a); });
    context.ambassadors.forEach((item) => values.set(item.id, item.label));
    return Array.from(values, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label));
  }, [source, context.ambassadors]);
  const points = useMemo(() => {
    const values = new Map<string, string>();
    source.forEach((record) => { if (record.merchant?.posId) values.set(record.merchant.posId, record.s); });
    context.points.forEach((item) => values.set(item.id, item.label));
    return Array.from(values, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label));
  }, [source, context.points]);
  const rows = useMemo(() => filtered.filter((record) => Boolean(record.merchant)).filter((record) => {
    const matchesStatus = status === "all" || record.merchant?.status === status;
    const matchesAmbassador = ambassadorId === "all" || record.merchant?.baId === ambassadorId;
    const searchable = [record.d, record.a, record.s, record.merchant?.reference, record.merchant?.shortCode, record.n, record.merchant?.comment].join(" ").toLowerCase();
    return matchesStatus && matchesAmbassador && searchable.includes(query.trim().toLowerCase());
  }).sort((left, right) => right.d.localeCompare(left.d)), [filtered, status, ambassadorId, query]);

  const close = () => { setEditing(null); setCreating(false); setDeleting(null); setDraft(null); setProof(null); setProofPreview((value) => { if (value) URL.revokeObjectURL(value); return null; }); setProofUrl(null); };
  const setField = (field: keyof Form, value: string) => setDraft((current) => current ? { ...current, [field]: value } : current);
  const openCreate = () => { setMessage(""); setDraft({ date: source[0]?.d ?? "2026-08-19", reference: "", shortCode: "", clientNumber: "", amount: "0", status: "recorded", comment: "", ambassador: ambassadors[0]?.label ?? "", point: points[0]?.label ?? "" }); setProof(null); setProofPreview(null); setCreating(true); };
  const openEdit = (record: Activation) => { setMessage(""); setDraft({ ...merchantDraftFrom(record), ambassador: record.a, point: record.s }); setEditing(record); setProofUrl(null); if (record.merchant?.evidencePath) void getMerchantEvidenceUrl(record.merchant.evidencePath).then(setProofUrl).catch(() => setProofUrl(null)); };
  const selectProof = (file?: File) => { if (!file) return; if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return setMessage("Choisissez une image JPG, PNG ou WEBP de 8 Mo maximum."); setProofPreview((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(file); }); setProof(file); };
  const save = async () => {
    if (!draft) return;
    const amount = Number(draft.amount.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) return setMessage("Le montant doit être valide.");
    setBusy(true);
    try {
      if (editing) await onMerchantUpdate?.(editing, { date: draft.date, reference: draft.reference, shortCode: draft.shortCode ?? "", clientNumber: draft.clientNumber, amount, status: draft.status, comment: draft.comment });
      else {
        const baId = ambassadors.find((item) => item.label === draft.ambassador)?.id;
        const posId = points.find((item) => item.label === draft.point)?.id;
        if (!proof || !context.campaignRunId || !baId || !posId) throw new Error("Ambassadeur, point de vente et capture du transfert sont requis.");
        await onMerchantCreate?.({ campaignRunId: context.campaignRunId, baId, posId, date: draft.date, reference: draft.reference, shortCode: draft.shortCode ?? "", clientNumber: draft.clientNumber, amount, status: draft.status, comment: draft.comment, evidenceFile: proof });
      }
      const verb = editing ? "mise à jour" : "enregistrée";
      close(); setMessage(`Transaction ${verb}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "L’enregistrement a échoué."); } finally { setBusy(false); }
  };
  const remove = async () => { if (!deleting) return; setBusy(true); try { await onMerchantDelete?.(deleting); close(); setMessage("Transaction supprimée."); } catch (error) { setMessage(error instanceof Error ? error.message : "La suppression a échoué."); } finally { setBusy(false); } };
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * 10, current * 10);
  const statusOptions = [{ id: "all", label: "Tous les statuts" }, ...Object.entries(merchantStatusLabels).map(([id, label]) => ({ id, label }))];

  const drawer = draft ? <Drawer title={editing ? "Modifier la transaction" : "Ajouter une transaction"} onClose={close} busy={busy} footer={<><button type="button" className="orbit-ghost" onClick={close} disabled={busy}>Annuler</button><span className="dn-spacer" /><button type="button" className="orbit-primary dn-primary" disabled={busy || (creating && !proof)} onClick={() => void save()}>{editing ? <Pencil size={15} /> : <Upload size={15} />}{busy ? "Enregistrement…" : editing ? "Enregistrer" : "Téléverser & ajouter"}</button></>}>
    <p className="dn-caption">{editing ? `${editing.a} · ${editing.s}` : "La capture du transfert est requise avant l’enregistrement."}</p>
    <label className="dn-lb">Date<div className="dn-field"><CalendarDays size={15} /><input type="date" value={draft.date} onChange={(event) => setField("date", event.target.value)} /></div></label>
    {creating && <div className="dn-lb">Ambassadeur<PillSelect label="Ambassadeur" icon={<UserRound size={14} />} value={draft.ambassador || "Choisir un ambassadeur"} options={ambassadors.map((item) => ({ id: item.label, label: item.label }))} onChange={(value) => setField("ambassador", value)} /></div>}
    {creating && <div className="dn-lb">Point de vente<PillSelect label="Point de vente" icon={<Store size={14} />} value={draft.point || "Choisir un point de vente"} options={points.map((item) => ({ id: item.label, label: item.label }))} onChange={(value) => setField("point", value)} /></div>}
    <label className="dn-lb">Référence<div className="dn-field"><input value={draft.reference} onChange={(event) => setField("reference", event.target.value)} /></div></label>
    <label className="dn-lb">Short-code<div className="dn-field"><input value={draft.shortCode ?? ""} onChange={(event) => setField("shortCode", event.target.value)} placeholder="Code court" /></div></label>
    <label className="dn-lb">Numéro client<div className="dn-field"><Phone size={15} /><input value={draft.clientNumber} onChange={(event) => setField("clientNumber", event.target.value)} /></div></label>
    <label className="dn-lb">Montant<div className="dn-field"><input value={draft.amount} inputMode="decimal" onChange={(event) => setField("amount", event.target.value)} /></div></label>
    <div className="dn-lb">Statut<Seg label="Statut" value={draft.status} options={Object.entries(merchantStatusLabels).map(([id, label]) => ({ id: id as MerchantDraft["status"], label }))} onChange={(value) => setField("status", value)} /></div>
    <label className="dn-lb">Commentaire<textarea className="dn-field dn-textarea" value={draft.comment} onChange={(event) => setField("comment", event.target.value)} /></label>
    {creating ? <MerchantProofDropzone file={proof} previewUrl={proofPreview} onFile={selectProof} /> : <section className="merchant-evidence-preview"><div><span><ImageIcon size={15} /> Photo de transaction</span><small>Justificatif sécurisé de collecte</small></div>{proofUrl ? <img src={proofUrl} alt="Preuve de transaction" /> : <div className="merchant-evidence-state"><ImageIcon size={24} /><span>Aucune photo disponible.</span></div>}</section>}
    {message && <div className="dn-feedback"><Check size={15} /> {message}</div>}
  </Drawer> : null;

  return <div className="module-page dn-page activation-admin-page merchant-transaction-admin"><div className={`dn-split ${drawer ? "has-drawer" : ""}`}><section className="glass-card dn-card">
    <div className="dn-card-bar"><label className="orbit-search dn-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Référence, ambassadeur, numéro…" aria-label="Rechercher une transaction" /></label><PillSelect label="Statut" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} /><PillSelect label="Ambassadeur" icon={<UserRound size={14} />} value={ambassadorId} options={[{ id: "all", label: "Tous les ambassadeurs" }, ...ambassadors.map((item) => ({ id: item.id, label: item.label }))]} onChange={(value) => { setAmbassadorId(value); setPage(1); }} /><span className="dn-spacer" /><span className="dn-tag">{number(rows.length)} ligne{rows.length > 1 ? "s" : ""}</span><button type="button" className="orbit-primary dn-primary" onClick={openCreate}><Plus size={15} /> Nouvelle transaction</button></div>
    <p className="dn-caption">{rangeLabel} · capture du transfert requise à chaque création</p>
    {visible.length ? <div className="dn-table-wrap"><table className="orbit-table dn-table"><thead><tr><th>Date</th><th>Ambassadeur</th><th className="dn-hide-sm">Point de vente</th><th>Référence</th><th className="dn-hide-sm">Short-code</th><th className="r">Montant</th><th className="dn-hide-sm">État</th><th className="dn-col-menu"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((record) => deleting?.id === record.id ? <tr key={record.id} className="dn-confirm"><td colSpan={8}><div className="dn-confirm-line"><Trash2 size={16} /><b>Supprimer la transaction {record.merchant?.reference || "sans référence"} ({record.a}) ?</b><span className="dn-spacer" /><button type="button" className="orbit-ghost" disabled={busy} onClick={() => setDeleting(null)}>Annuler</button><button type="button" className="dn-danger" disabled={busy} onClick={() => void remove()}>{busy ? "Suppression…" : "Supprimer"}</button></div></td></tr> : <tr key={record.id} className="is-clickable" onClick={() => openEdit(record)}><td>{dateLabel(record.d)}</td><td><strong>{record.a}</strong></td><td className="dn-dim dn-hide-sm">{record.s}</td><td>{record.merchant?.reference || "—"}</td><td className="dn-dim dn-hide-sm">{record.merchant?.shortCode || "—"}</td><td className="r num">{number(record.merchant?.amount ?? 0)}</td><td className="dn-hide-sm"><span className={`dn-tag merchant-${record.merchant?.status ?? "recorded"}`}>{merchantStatusLabels[record.merchant?.status ?? "recorded"]}</span></td><td className="r" onClick={(event) => event.stopPropagation()}><RowMenu label={`Actions pour la transaction ${record.merchant?.reference || record.id}`} items={[{ label: "Modifier", icon: <Pencil size={14} />, onSelect: () => openEdit(record) }, { label: "Supprimer", icon: <Trash2 size={14} />, danger: true, onSelect: () => { close(); setDeleting(record); } }]} /></td></tr>)}</tbody></table></div> : <div className="orbit-empty">Aucune transaction dans la sélection. Vous pouvez néanmoins enregistrer la première.</div>}
    {message && !draft && <div className="dn-feedback"><Check size={15} /> {message}</div>}
    <div className="dn-pager"><span>Page {current} sur {pages}</span><span className="dn-spacer" /><button type="button" className="dn-icon-button" aria-label="Page précédente" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button><button type="button" className="dn-icon-button" aria-label="Page suivante" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button></div>
  </section>{drawer}</div></div>;
}

function BtlMerchantTransactionAdminV3({ filtered, allData, rangeLabel, onMerchantCreate, onMerchantUpdate, onMerchantDelete, merchantCampaignId }: Props) {
  type CreateDraft = MerchantDraft & { ambassador: string; point: string };
  type Option = { id: string; label: string };
  const source = (allData ?? []).filter((record) => Boolean(record.merchant));
  const dates = source.map((item) => item.d).filter(Boolean).sort();
  const [creationContext, setCreationContext] = useState<MerchantCreationContext>({ campaignRunId: "", ambassadors: [], points: [] }); const [creationContextError, setCreationContextError] = useState("");
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [ambassador, setAmbassador] = useState("all"); const [creating, setCreating] = useState(false); const [editing, setEditing] = useState<Activation | null>(null); const [deleteCandidate, setDeleteCandidate] = useState<Activation | null>(null); const [draft, setDraft] = useState<MerchantDraft | null>(null); const [createDraft, setCreateDraft] = useState<CreateDraft>({ date: dates[0] ?? "2026-08-19", reference: "", shortCode: "", clientNumber: "", amount: "0", status: "recorded", comment: "", ambassador: "", point: "" }); const [evidenceFile, setEvidenceFile] = useState<File | null>(null); const [evidencePreview, setEvidencePreview] = useState<string | null>(null); const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null); const [evidenceMessage, setEvidenceMessage] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!merchantCampaignId) return; let active = true; void loadMerchantCreationContext(merchantCampaignId).then((context) => { if (active) setCreationContext(context); }).catch(() => { if (active) setCreationContextError("Les référentiels Merchant ne peuvent pas être chargés."); }); return () => { active = false; }; }, [merchantCampaignId]);
  const ambassadors = useMemo<Option[]>(() => { const values = new Map<string, string>(); source.forEach((record) => { if (record.merchant?.baId) values.set(record.merchant.baId, record.a); }); creationContext.ambassadors.forEach((option) => values.set(option.id, option.label)); return Array.from(values, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label)); }, [source, creationContext.ambassadors]);
  const points = useMemo<Option[]>(() => { const values = new Map<string, string>(); source.forEach((record) => { if (record.merchant?.posId) values.set(record.merchant.posId, record.s); }); creationContext.points.forEach((option) => values.set(option.id, option.label)); return Array.from(values, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label)); }, [source, creationContext.points]);
  const rows = useMemo(() => filtered.filter((record) => Boolean(record.merchant)).filter((record) => (status === "all" || record.merchant?.status === status) && (ambassador === "all" || record.merchant?.baId === ambassador) && [record.a, record.s, record.d, record.merchant?.reference, record.merchant?.shortCode, record.n, record.merchant?.comment].join(" ").toLowerCase().includes(query.trim().toLowerCase())).sort((left, right) => right.d.localeCompare(left.d)), [filtered, query, status, ambassador]);
  const resetModal = () => { setCreating(false); setEditing(null); setDeleteCandidate(null); setDraft(null); setEvidenceFile(null); setEvidencePreview((url) => { if (url) URL.revokeObjectURL(url); return null; }); setEvidenceUrl(null); setEvidenceMessage(""); };
  const selectEvidence = (file?: File) => { if (!file) return; if (!file.type.startsWith("image/")) return setMessage("Choisissez une capture au format image."); if (file.size > 8 * 1024 * 1024) return setMessage("La capture ne doit pas dépasser 8 Mo."); setEvidencePreview((url) => { if (url) URL.revokeObjectURL(url); return URL.createObjectURL(file); }); setEvidenceFile(file); setMessage(""); };
  const openCreate = () => { setMessage(""); setEvidenceFile(null); setEvidencePreview(null); setCreateDraft({ date: dates[0] ?? "2026-08-19", reference: "", shortCode: "", clientNumber: "", amount: "0", status: "recorded", comment: "", ambassador: ambassadors[0]?.label ?? "", point: points[0]?.label ?? "" }); setCreating(true); };
  const openEdit = (record: Activation) => { setDraft(merchantDraftFrom(record)); setEditing(record); setEvidenceUrl(null); setEvidenceMessage(record.merchant?.evidencePath ? "Chargement sécurisé de la photo…" : "Aucun justificatif photo n’est lié à cette transaction."); };
  useEffect(() => { const path = editing?.merchant?.evidencePath; if (!path) return; let active = true; void getMerchantEvidenceUrl(path).then((url) => { if (active) { setEvidenceUrl(url); setEvidenceMessage(url ? "" : "La photo est indisponible."); } }).catch(() => { if (active) setEvidenceMessage("La photo ne peut pas être chargée."); }); return () => { active = false; }; }, [editing?.id, editing?.merchant?.evidencePath]);
  const saveCreate = async () => { const campaignRunId = source[0]?.merchant?.campaignRunId ?? creationContext.campaignRunId; const amount = Number(createDraft.amount.replace(",", ".")); const baId = ambassadors.find((option) => option.label === createDraft.ambassador)?.id ?? ""; const posId = points.find((option) => option.label === createDraft.point)?.id ?? ""; if (!evidenceFile) return setMessage("La capture du transfert est obligatoire."); if (!onMerchantCreate || !campaignRunId || !baId || !posId || !Number.isFinite(amount) || amount < 0) return setMessage("Ambassadeur, point de vente et montant valide sont requis."); setBusy(true); try { await onMerchantCreate({ campaignRunId, baId, posId, date: createDraft.date, reference: createDraft.reference, clientNumber: createDraft.clientNumber, amount, status: createDraft.status, comment: createDraft.comment, evidenceFile }); resetModal(); setMessage("Transaction et capture du transfert enregistrées."); } catch (error) { setMessage(error instanceof Error ? error.message : "La création a échoué."); } finally { setBusy(false); } };
  const saveEdit = async () => { if (!editing || !draft || !onMerchantUpdate) return; const amount = Number(draft.amount.replace(",", ".")); if (!Number.isFinite(amount) || amount < 0) return setMessage("Le montant doit être un nombre positif ou nul."); setBusy(true); try { await onMerchantUpdate(editing, { ...draft, amount }); resetModal(); setMessage("Transaction Merchant mise à jour."); } catch (error) { setMessage(error instanceof Error ? error.message : "La mise à jour a échoué."); } finally { setBusy(false); } };
  const remove = async () => { if (!deleteCandidate || !onMerchantDelete) return; setBusy(true); try { await onMerchantDelete(deleteCandidate); resetModal(); setMessage("Transaction Merchant supprimée."); } catch (error) { setMessage(error instanceof Error ? error.message : "La suppression a échoué."); } finally { setBusy(false); } };
  const statusLabel = status === "all" ? "Tous les statuts" : merchantStatusLabels[status as MerchantDraft["status"]]; const ambassadorLabel = ambassador === "all" ? "Tous les ambassadeurs" : ambassadors.find((option) => option.id === ambassador)?.label ?? "Tous les ambassadeurs";
  return <div className="module-page activation-admin-page merchant-transaction-admin"><section className="module-heading glass-card"><div className="eyebrow">ADMINISTRATION BTL <span className="eyebrow-line" /></div><h1>Transactions</h1><p>Créez, modifiez ou retirez une transaction Merchant. Toutes les actions sont tracées dans le journal BTL.</p><div className="module-context"><span className="live-pulse" /> {rangeLabel} · {number(rows.length)} transaction(s) visible(s)</div></section><section className="module-panel glass-card activation-admin-panel"><div className="admin-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une transaction…" /><kbd>⌘ K</kbd></div><Choice label="Statut" value={statusLabel} options={["Tous les statuts", ...Object.values(merchantStatusLabels)]} onChange={(value) => setStatus(Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "all")} /><Choice label="Ambassadeur" value={ambassadorLabel} options={["Tous les ambassadeurs", ...ambassadors.map((option) => option.label)]} onChange={(value) => setAmbassador(ambassadors.find((option) => option.label === value)?.id ?? "all")} /><span className="toolbar-count">{number(rows.length)} lignes</span><button className="primary-button admin-add-button" onClick={openCreate}><Plus size={15} /> Nouvelle transaction</button></div><div className="admin-permission-note"><Check size={15} /> BTL · capture du transfert requise à chaque création</div>{creationContextError && <div className="admin-feedback">{creationContextError}</div>}{rows.length ? <div className="admin-activation-table merchant-transaction-table"><div className="admin-activation-head merchant-transaction-head"><span>Date</span><span>Ambassadeur</span><span>Point de vente</span><span>Référence</span><span>Montant</span><span>État</span><span /></div>{rows.map((record) => <div className="admin-activation-row merchant-transaction-row" key={record.id}><button className="admin-activation-main merchant-transaction-main" type="button" onClick={() => openEdit(record)}><span>{dateLabel(record.d)}</span><strong>{record.a}</strong><span>{record.s}</span><span>{record.merchant?.reference || "—"}</span><span>{number(record.merchant?.amount ?? 0)}</span><span><em className={`merchant-status merchant-status-${record.merchant?.status ?? "recorded"}`}>{merchantStatusLabels[record.merchant?.status ?? "recorded"]}</em></span></button><div className="admin-row-actions"><button className="admin-edit-button" onClick={() => openEdit(record)}><Pencil size={14} /></button><button className="admin-delete-button" onClick={() => setDeleteCandidate(record)}><Trash2 size={15} /></button></div></div>)}</div> : <div className="empty-module"><Search size={18} /><strong>Aucune transaction dans la sélection</strong><span>Vous pouvez néanmoins enregistrer la première transaction avec le bouton « Nouvelle transaction ».</span></div>}{message && <div className="admin-feedback"><Check size={15} /> {message}</div>}</section>{creating && <div className="admin-modal-backdrop"><section className="admin-modal glass-card"><div className="admin-modal-heading"><div><div className="eyebrow">NOUVELLE TRANSACTION</div><h2>Ajouter une transaction</h2><p>La capture du transfert est requise avant l’enregistrement.</p></div><button className="close-detail" onClick={resetModal}><X size={16} /></button></div><div className="admin-form-grid"><label className="admin-field"><span>Date</span><input value={createDraft.date} onChange={(event) => setCreateDraft({ ...createDraft, date: event.target.value })} /></label><Choice label="Ambassadeur" value={createDraft.ambassador || "Choisir un ambassadeur"} options={ambassadors.map((option) => option.label)} onChange={(value) => setCreateDraft({ ...createDraft, ambassador: value })} /><Choice label="Point de vente" value={createDraft.point || "Choisir un point de vente"} options={points.map((option) => option.label)} onChange={(value) => setCreateDraft({ ...createDraft, point: value })} /><label className="admin-field"><span>Référence</span><input value={createDraft.reference} onChange={(event) => setCreateDraft({ ...createDraft, reference: event.target.value })} /></label><label className="admin-field"><span>Numéro client</span><input value={createDraft.clientNumber} onChange={(event) => setCreateDraft({ ...createDraft, clientNumber: event.target.value })} /></label><label className="admin-field"><span>Montant</span><input value={createDraft.amount} onChange={(event) => setCreateDraft({ ...createDraft, amount: event.target.value })} /></label><Choice label="Statut" value={merchantStatusLabels[createDraft.status]} options={Object.values(merchantStatusLabels)} onChange={(value) => setCreateDraft({ ...createDraft, status: (Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "recorded") as MerchantDraft["status"] })} /><label className="admin-field admin-field-wide"><span>Commentaire</span><textarea value={createDraft.comment} onChange={(event) => setCreateDraft({ ...createDraft, comment: event.target.value })} /></label><div className="admin-field-wide"><MerchantProofDropzone file={evidenceFile} previewUrl={evidencePreview} onFile={selectEvidence} /></div></div><div className="admin-modal-actions"><button className="soft-button" onClick={resetModal}>Annuler</button><button className="primary-button" disabled={busy || !evidenceFile || !creationContext.campaignRunId} onClick={() => void saveCreate()}><Upload size={15} /> {busy ? "Téléversement…" : "Téléverser & ajouter"}</button></div></section></div>}{editing && draft && <div className="admin-modal-backdrop"><section className="admin-modal glass-card"><div className="admin-modal-heading"><div><div className="eyebrow">TRANSACTION MERCHANT</div><h2>Modifier la transaction</h2><p>{editing.a} · {editing.s}</p></div><button className="close-detail" onClick={resetModal}><X size={16} /></button></div><div className="admin-form-grid"><label className="admin-field"><span>Date</span><input value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label className="admin-field"><span>Référence</span><input value={draft.reference} onChange={(event) => setDraft({ ...draft, reference: event.target.value })} /></label><label className="admin-field"><span>Numéro client</span><input value={draft.clientNumber} onChange={(event) => setDraft({ ...draft, clientNumber: event.target.value })} /></label><label className="admin-field"><span>Montant</span><input value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} /></label><Choice label="Statut" value={merchantStatusLabels[draft.status]} options={Object.values(merchantStatusLabels)} onChange={(value) => setDraft({ ...draft, status: (Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "recorded") as MerchantDraft["status"] })} /><label className="admin-field admin-field-wide"><span>Commentaire</span><textarea value={draft.comment} onChange={(event) => setDraft({ ...draft, comment: event.target.value })} /></label></div><section className="merchant-evidence-preview"><div><span><ImageIcon size={15} /> Photo de transaction</span><small>Justificatif sécurisé de collecte</small></div>{evidenceUrl ? <img src={evidenceUrl} alt="Preuve de transaction" /> : <div className="merchant-evidence-state"><ImageIcon size={24} /><span>{evidenceMessage || "Aucune photo disponible."}</span></div>}</section><div className="admin-modal-actions"><button className="soft-button" onClick={resetModal}>Annuler</button><button className="primary-button" disabled={busy} onClick={() => void saveEdit()}><Pencil size={15} /> {busy ? "Enregistrement…" : "Enregistrer"}</button></div></section></div>}{deleteCandidate && <div className="admin-modal-backdrop"><section className="admin-modal admin-danger-modal glass-card"><div className="admin-danger-icon"><AlertTriangle size={22} /></div><div className="admin-modal-heading"><div><div className="eyebrow">ACTION BTL PERSISTANTE</div><h2>Supprimer cette transaction ?</h2><p>{deleteCandidate.merchant?.reference || "Sans référence"}</p></div></div><div className="admin-modal-actions"><button className="soft-button" onClick={resetModal}>Annuler</button><button className="danger-button" disabled={busy} onClick={() => void remove()}><Trash2 size={15} /> Confirmer & supprimer</button></div></section></div>}</div>;
}

function BtlMerchantTransactionAdminV2({ filtered, allData, rangeLabel, onMerchantCreate, onMerchantUpdate, onMerchantDelete }: Props) {
  const source = (allData ?? []).filter((record) => Boolean(record.merchant));
  const dates = source.map((item) => item.d).filter(Boolean).sort();
  const minDate = dates[0] ?? "";
  const maxDate = dates.at(-1) ?? "";
  type CreateDraft = MerchantDraft & { ambassador: string; point: string };
  type SelectionOption = { id: string; label: string };
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [ambassador, setAmbassador] = useState("all"); const [editing, setEditing] = useState<Activation | null>(null); const [creating, setCreating] = useState(false); const [confirmDelete, setConfirmDelete] = useState<Activation | null>(null); const [draft, setDraft] = useState<MerchantDraft | null>(null); const [createDraft, setCreateDraft] = useState<CreateDraft>({ date: minDate || "2026-08-19", reference: "", clientNumber: "", amount: "0", status: "recorded", comment: "", ambassador: "", point: "" }); const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null); const [evidenceMessage, setEvidenceMessage] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const ambassadors = useMemo<SelectionOption[]>(() => { const values = new Map<string, string>(); source.forEach((item) => { if (item.merchant?.baId) values.set(item.merchant.baId, item.a); }); return Array.from(values, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label)); }, [source]);
  const points = useMemo<SelectionOption[]>(() => { const values = new Map<string, string>(); source.forEach((item) => { if (item.merchant?.posId) values.set(item.merchant.posId, item.s); }); return Array.from(values, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label)); }, [source]);
  const rows = useMemo(() => filtered.filter((item) => Boolean(item.merchant)).filter((item) => (status === "all" || item.merchant?.status === status) && (ambassador === "all" || item.merchant?.baId === ambassador) && [item.a, item.s, item.d, item.merchant?.reference, item.n, item.merchant?.comment].join(" ").toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => b.d.localeCompare(a.d)), [filtered, query, status, ambassador]);
  const setDraftField = (field: keyof MerchantDraft, value: string) => setDraft((current) => current ? { ...current, [field]: value } : null);
  const closeModal = () => { setEditing(null); setCreating(false); setConfirmDelete(null); setEvidenceUrl(null); setEvidenceMessage(""); };
  const openEdit = (record: Activation) => { setDraft(merchantDraftFrom(record)); setEditing(record); setEvidenceUrl(null); setEvidenceMessage(record.merchant?.evidencePath ? "Chargement sécurisé de la photo…" : "Aucun justificatif photo n’est lié à cette transaction."); };
  useEffect(() => { const path = editing?.merchant?.evidencePath; if (!editing || !path) return; let live = true; void getMerchantEvidenceUrl(path).then((url) => { if (live) { setEvidenceUrl(url); setEvidenceMessage(url ? "" : "La photo est indisponible."); } }).catch(() => { if (live) setEvidenceMessage("La photo ne peut pas être chargée avec vos droits actuels."); }); return () => { live = false; }; }, [editing?.id, editing?.merchant?.evidencePath]);
  const save = async () => { if (!editing || !draft || !onMerchantUpdate) return; const amount = Number(draft.amount.replace(",", ".")); if (!Number.isFinite(amount) || amount < 0) return setMessage("Le montant doit être un nombre positif ou nul."); setBusy(true); try { await onMerchantUpdate(editing, { date: draft.date, reference: draft.reference, clientNumber: draft.clientNumber, amount, status: draft.status, comment: draft.comment }); closeModal(); setMessage("Transaction Merchant mise à jour."); } catch (error) { setMessage(error instanceof Error ? error.message : "La mise à jour a échoué."); } finally { setBusy(false); } };
  const create = async () => { const seed = source[0]?.merchant; const baId = ambassadors.find((option) => option.label === (createDraft as typeof createDraft & { ambassador?: string }).ambassador)?.id ?? seed?.baId ?? ""; const posId = points.find((option) => option.label === (createDraft as typeof createDraft & { point?: string }).point)?.id ?? seed?.posId ?? ""; const amount = Number(createDraft.amount.replace(",", ".")); if (!onMerchantCreate || !seed) return setMessage("Aucun référentiel Merchant disponible pour créer cette transaction."); if (!baId || !posId || !Number.isFinite(amount) || amount < 0) return setMessage("Ambassadeur, point de vente et montant valide sont requis."); setBusy(true); try { await onMerchantCreate({ campaignRunId: seed.campaignRunId, baId, posId, date: createDraft.date, reference: createDraft.reference, clientNumber: createDraft.clientNumber, amount, status: createDraft.status, comment: createDraft.comment }); closeModal(); setMessage("Transaction Merchant ajoutée."); } catch (error) { setMessage(error instanceof Error ? error.message : "La création a échoué."); } finally { setBusy(false); } };
  const remove = async () => { if (!confirmDelete || !onMerchantDelete) return; setBusy(true); try { await onMerchantDelete(confirmDelete); closeModal(); setMessage("Transaction Merchant supprimée."); } catch (error) { setMessage(error instanceof Error ? error.message : "La suppression a échoué."); } finally { setBusy(false); } };
  const statusLabel = status === "all" ? "Tous les statuts" : merchantStatusLabels[status as MerchantDraft["status"]]; const ambassadorLabel = ambassador === "all" ? "Tous les ambassadeurs" : ambassadors.find((option) => option.id === ambassador)?.label ?? "Tous les ambassadeurs"; const selectedAmbassador = (createDraft as typeof createDraft & { ambassador?: string }).ambassador ?? ambassadors[0]?.label ?? "Choisir un ambassadeur"; const selectedPoint = (createDraft as typeof createDraft & { point?: string }).point ?? points[0]?.label ?? "Choisir un point de vente";
  return <div className="module-page activation-admin-page merchant-transaction-admin"><section className="module-heading glass-card"><div className="eyebrow">ADMINISTRATION BTL <span className="eyebrow-line" /></div><h1>Transactions</h1><p>Créez, modifiez ou retirez une transaction Merchant. Toutes les actions sont enregistrées dans Supabase et tracées dans le journal BTL.</p><div className="module-context"><span className="live-pulse" /> {rangeLabel} · {number(rows.length)} transaction(s) visible(s)</div></section><section className="module-panel glass-card activation-admin-panel"><div className="admin-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une transaction…" /><kbd>⌘ K</kbd></div><Choice label="Statut" value={statusLabel} options={["Tous les statuts", ...Object.values(merchantStatusLabels)]} onChange={(value) => setStatus(Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "all")} /><Choice label="Ambassadeur" value={ambassadorLabel} options={["Tous les ambassadeurs", ...ambassadors.map((option) => option.label)]} onChange={(value) => setAmbassador(ambassadors.find((option) => option.label === value)?.id ?? "all")} /><span className="toolbar-count">{number(rows.length)} lignes</span><button className="primary-button admin-add-button" onClick={() => { setCreateDraft({ date: minDate || "2026-08-19", reference: "", clientNumber: "", amount: "0", status: "recorded", comment: "", ambassador: ambassadors[0]?.label ?? "", point: points[0]?.label ?? "" } as typeof createDraft); setCreating(true); }}><Plus size={15} /> Nouvelle transaction</button></div><div className="admin-permission-note"><Check size={15} /> BTL · création, édition et suppression persistantes dans Supabase</div>{rows.length ? <div className="admin-activation-table merchant-transaction-table"><div className="admin-activation-head merchant-transaction-head"><span>Date</span><span>Ambassadeur</span><span>Point de vente</span><span>Référence</span><span>Montant</span><span>État</span><span /></div>{rows.map((item) => <div className="admin-activation-row merchant-transaction-row" key={item.id}><button className="admin-activation-main merchant-transaction-main" type="button" onClick={() => openEdit(item)}><span>{dateLabel(item.d)}</span><strong>{item.a}</strong><span>{item.s}</span><span>{item.merchant?.reference || "—"}</span><span>{number(item.merchant?.amount ?? 0)}</span><span><em className={`merchant-status merchant-status-${item.merchant?.status ?? "recorded"}`}>{merchantStatusLabels[item.merchant?.status ?? "recorded"]}</em></span></button><div className="admin-row-actions"><button className="admin-edit-button" onClick={() => openEdit(item)}><Pencil size={14} /></button><button className="admin-delete-button" onClick={() => setConfirmDelete(item)}><Trash2 size={15} /></button></div></div>)}</div> : <div className="empty-module"><Search size={18} /><strong>Aucune transaction dans la sélection</strong></div>}{message && <div className="admin-feedback"><Check size={15} /> {message}</div>}</section>{creating && <div className="admin-modal-backdrop"><section className="admin-modal glass-card"><div className="admin-modal-heading"><div><div className="eyebrow">NOUVELLE TRANSACTION</div><h2>Ajouter une transaction</h2><p>La photo de preuve est ajoutée ensuite par la collecte terrain.</p></div><button className="close-detail" onClick={closeModal}><X size={16} /></button></div><div className="admin-form-grid"><label className="admin-field"><span>Date</span><input value={createDraft.date} onChange={(event) => setCreateDraft({ ...createDraft, date: event.target.value })} /></label><Choice label="Ambassadeur" value={selectedAmbassador} options={ambassadors.map((option) => option.label)} onChange={(value) => setCreateDraft({ ...createDraft, ambassador: value } as typeof createDraft)} /><Choice label="Point de vente" value={selectedPoint} options={points.map((option) => option.label)} onChange={(value) => setCreateDraft({ ...createDraft, point: value } as typeof createDraft)} /><label className="admin-field"><span>Référence</span><input value={createDraft.reference} onChange={(event) => setCreateDraft({ ...createDraft, reference: event.target.value })} /></label><label className="admin-field"><span>Numéro client</span><input value={createDraft.clientNumber} onChange={(event) => setCreateDraft({ ...createDraft, clientNumber: event.target.value })} /></label><label className="admin-field"><span>Montant</span><input value={createDraft.amount} onChange={(event) => setCreateDraft({ ...createDraft, amount: event.target.value })} /></label><Choice label="Statut" value={merchantStatusLabels[createDraft.status]} options={Object.values(merchantStatusLabels)} onChange={(value) => setCreateDraft({ ...createDraft, status: (Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "recorded") as MerchantDraft["status"] })} /><label className="admin-field admin-field-wide"><span>Commentaire</span><textarea value={createDraft.comment} onChange={(event) => setCreateDraft({ ...createDraft, comment: event.target.value })} /></label></div><div className="admin-modal-actions"><button className="soft-button" onClick={closeModal}>Annuler</button><button className="primary-button" disabled={busy} onClick={() => void create()}><Plus size={15} /> {busy ? "Création…" : "Confirmer & ajouter"}</button></div></section></div>}{editing && draft && <div className="admin-modal-backdrop"><section className="admin-modal glass-card"><div className="admin-modal-heading"><div><div className="eyebrow">TRANSACTION MERCHANT</div><h2>Modifier la transaction</h2><p>{editing.a} · {editing.s}</p></div><button className="close-detail" onClick={closeModal}><X size={16} /></button></div><div className="admin-form-grid"><label className="admin-field"><span>Date</span><input value={draft.date} onChange={(event) => setDraftField("date", event.target.value)} /></label><label className="admin-field"><span>Référence</span><input value={draft.reference} onChange={(event) => setDraftField("reference", event.target.value)} /></label><label className="admin-field"><span>Numéro client</span><input value={draft.clientNumber} onChange={(event) => setDraftField("clientNumber", event.target.value)} /></label><label className="admin-field"><span>Montant</span><input value={draft.amount} onChange={(event) => setDraftField("amount", event.target.value)} /></label><Choice label="Statut" value={merchantStatusLabels[draft.status]} options={Object.values(merchantStatusLabels)} onChange={(value) => setDraftField("status", (Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "recorded") as MerchantDraft["status"])} /><label className="admin-field admin-field-wide"><span>Commentaire</span><textarea value={draft.comment} onChange={(event) => setDraftField("comment", event.target.value)} /></label></div><section className="merchant-evidence-preview"><div><span><ImageIcon size={15} /> Photo de transaction</span><small>Justificatif sécurisé de collecte</small></div>{evidenceUrl ? <img src={evidenceUrl} alt="Preuve de transaction" /> : <div className="merchant-evidence-state"><ImageIcon size={24} /><span>{evidenceMessage || "Aucune photo disponible."}</span></div>}</section><div className="admin-modal-actions"><button className="soft-button" onClick={closeModal}>Annuler</button><button className="primary-button" disabled={busy} onClick={() => void save()}><Pencil size={15} /> {busy ? "Enregistrement…" : "Enregistrer"}</button></div></section></div>}{confirmDelete && <div className="admin-modal-backdrop"><section className="admin-modal admin-danger-modal glass-card"><div className="admin-danger-icon"><AlertTriangle size={22} /></div><div className="admin-modal-heading"><div><div className="eyebrow">ACTION BTL PERSISTANTE</div><h2>Supprimer cette transaction ?</h2><p>{confirmDelete.merchant?.reference || "Sans référence"}</p></div></div><div className="admin-modal-actions"><button className="soft-button" onClick={closeModal}>Annuler</button><button className="danger-button" disabled={busy} onClick={() => void remove()}><Trash2 size={15} /> Confirmer & supprimer</button></div></section></div>}</div>;
}

// Catégorie déduite du shop : celle déjà utilisée pour ce shop, sinon d'après son nom.
function categoryFor(shop: string, source: Activation[]) {
  const known = source.find((item) => item.s === shop && item.c)?.c;
  if (known) return known;
  if (/a[ée]roport|airport/i.test(shop)) return "Aéroport";
  if (/jeff(e)?r(e)?y/i.test(shop)) return "Agence Jeffery";
  return "Shop";
}

function BtlActivationAdmin({ filtered, allData, onCreate, onDelete, initialQuery }: Props) {
  const source = allData ?? loadLocalData([]);
  const dates = source.map((item) => item.d).sort();
  const minDate = dates[0] ?? "2026-07-23";
  const maxDate = dates.at(-1) ?? "2026-08-08";
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(source, maxDate));
  const rows = useMemo<JournalRow[]>(() => {
    const positions = new Map<string, number[]>();
    source.forEach((item, index) => positions.set(signature(item), [...(positions.get(signature(item)) ?? []), index]));
    const seen = new Map<string, number>();
    return filtered.map((item) => { const key = signature(item); const occurrence = seen.get(key) ?? 0; seen.set(key, occurrence + 1); const index = positions.get(key)?.[occurrence] ?? -1; return { item, index, key: `${index}-${key}-${occurrence}` }; });
  }, [filtered, source]);
  const agents = useMemo(() => {
    const usual = new Map<string, Map<string, number>>();
    source.forEach((item) => { if (!item.a) return; const shops = usual.get(item.a) ?? new Map<string, number>(); shops.set(item.s, (shops.get(item.s) ?? 0) + 1); usual.set(item.a, shops); });
    return Array.from(usual, ([name, shops]) => ({ value: name, hint: Array.from(shops).sort((left, right) => right[1] - left[1])[0]?.[0] })).sort((left, right) => left.value.localeCompare(right.value, "fr"));
  }, [source]);
  const shops = useMemo(() => Array.from(new Set(source.map((item) => item.s).filter(Boolean))).sort((left, right) => left.localeCompare(right, "fr")).map((value) => ({ value })), [source]);

  const updateDraft = (field: keyof Draft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const chooseAgent = (value: string) => setDraft((current) => { const usual = agents.find((agent) => agent.value === value)?.hint; return { ...current, a: value, s: usual && !current.s ? usual : current.s }; });
  const openForm = () => { setDraft(draftFrom(source, maxDate)); setFormError(""); setMessage(""); setFormOpen(true); };
  const closeForm = () => { if (!busy) setFormOpen(false); };
  const addActivation = async () => {
    const clean = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as Draft;
    clean.c = categoryFor(clean.s, source);
    const date = new Date(`${clean.d}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.d) || Number.isNaN(date.getTime()) || clean.d < minDate || clean.d > maxDate) return setFormError(`La date doit être comprise entre ${minDate} et ${maxDate}.`);
    if (!clean.a || !clean.s || !clean.t) return setFormError("Date, agent, shop et type d’action sont obligatoires.");
    const nextRecord: Activation = { ...clean };
    if (source.some((item) => signature(item) === signature(nextRecord))) return setFormError("Cette activation existe déjà dans la source.");
    setBusy(true);
    try { if (onCreate) await onCreate(nextRecord); else saveLocalData([nextRecord, ...source]); } catch (reason) { setBusy(false); return setFormError(reason instanceof Error ? reason.message : "L’activation n’a pas pu être enregistrée dans Supabase."); }
    setBusy(false);
    setFormOpen(false);
    setMessage("Activation ajoutée. Les indicateurs et exports seront recalculés après actualisation.");
  };
  const deleteActivation = async ({ item, index = -1 }: JournalRow) => {
    if (index < 0) return;
    try { if (onDelete) await onDelete(item); else saveLocalData(source.filter((_, position) => position !== index)); } catch (reason) { return setMessage(reason instanceof Error ? reason.message : "La suppression Supabase a échoué."); }
    setMessage("Activation supprimée. Les indicateurs et exports seront recalculés après actualisation.");
  };
  const optIn = draft.t === "Opt-in Privilège";

  const drawer = formOpen ? <Drawer title="Ajouter une activation" onClose={closeForm} busy={busy} footer={<><button type="button" className="orbit-ghost" onClick={closeForm} disabled={busy}>Annuler</button><span className="dn-spacer" /><button type="button" className="orbit-primary dn-primary" onClick={() => void addActivation()} disabled={busy}>{busy ? "Ajout…" : "Ajouter"}</button></>}>
    <label className="dn-lb">Date<div className="dn-field"><CalendarDays size={15} /><input type="date" value={draft.d} min={minDate} max={maxDate} onChange={(event) => updateDraft("d", event.target.value)} /></div></label>
    <div className="dn-lb">Agent<SuggestField label="Agent" icon={<UserRound size={15} />} value={draft.a} onChange={chooseAgent} options={agents} placeholder="Nom de l’agent" /></div>
    <div className="dn-lb">Shop<SuggestField label="Shop" icon={<Store size={15} />} value={draft.s} onChange={(value) => updateDraft("s", value)} options={shops} placeholder="Nom du shop" />{draft.s.trim() && <small className="dn-hint">Catégorie : {categoryFor(draft.s.trim(), source)}</small>}</div>
    <label className="dn-lb">Numéro du client<div className="dn-field"><Phone size={15} /><input value={draft.n} inputMode="numeric" placeholder="+243" onChange={(event) => updateDraft("n", event.target.value.replace(/\D/g, ""))} /></div></label>
    <div className="dn-switch-row"><span>Opt-in Privilège</span><Toggle label="Opt-in Privilège" checked={optIn} onChange={(checked) => updateDraft("t", checked ? "Opt-in Privilège" : "Activation Bundle")} /></div>
    {!optIn && <div className="dn-lb">Type d’activation<Seg label="Type d’activation" value={draft.t} options={[{ id: "Activation Bundle", label: "Bundle" }, { id: "Opt-in Roaming", label: "Roaming" }]} onChange={(value) => updateDraft("t", value)} /></div>}
    {formError && <div className="dn-feedback is-error"><AlertTriangle size={15} /> {formError}</div>}
  </Drawer> : null;

  return <div className="module-page dn-page activation-admin-page"><ActivationJournal rows={rows} initialQuery={initialQuery} onCreate={openForm} onDelete={deleteActivation} aside={drawer} message={message} /></div>;
}

type MerchantDraft = {
  date: string;
  reference: string;
  shortCode?: string;
  clientNumber: string;
  amount: string;
  status: "recorded" | "verified" | "rejected";
  comment: string;
};

const merchantStatusLabels: Record<MerchantDraft["status"], string> = {
  recorded: "Enregistrée",
  verified: "Vérifiée",
  rejected: "Rejetée",
};

function merchantDraftFrom(record: Activation): MerchantDraft {
  return {
    date: record.d,
    reference: record.merchant?.reference ?? record.cl,
    shortCode: record.merchant?.shortCode ?? "",
    clientNumber: record.n,
    amount: String(record.merchant?.amount ?? 0),
    status: record.merchant?.status ?? "recorded",
    comment: record.merchant?.comment ?? "",
  };
}

function BtlMerchantTransactionAdmin({ filtered, allData, rangeLabel, onMerchantUpdate, onMerchantDelete }: Props) {
  const source = (allData ?? []).filter((record) => Boolean(record.merchant));
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const [editing, setEditing] = useState<Activation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Activation | null>(null);
  const [draft, setDraft] = useState<MerchantDraft | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pageSize = 8;
  const dates = source.map((item) => item.d).filter(Boolean).sort();
  const minDate = dates[0] ?? "";
  const maxDate = dates.at(-1) ?? "";
  const rows = useMemo(() => filtered.filter((item) => Boolean(item.merchant)).filter((item) => [item.d, item.a, item.s, item.cl, item.n, item.merchant?.status, item.merchant?.comment].join(" ").toLowerCase().includes(query.trim().toLowerCase())).sort((left, right) => sortAsc ? left.d.localeCompare(right.d) : right.d.localeCompare(left.d)), [filtered, query, sortAsc]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((Math.min(page, pages) - 1) * pageSize, Math.min(page, pages) * pageSize);
  const openEditor = (record: Activation) => { setDraft(merchantDraftFrom(record)); setEditing(record); setMessage(""); };
  const closeEditor = () => { setEditing(null); setDraft(null); };
  const updateDraft = (field: keyof MerchantDraft, value: string) => setDraft((current) => current ? { ...current, [field]: value } : current);
  const saveTransaction = async () => {
    if (!editing || !draft || !onMerchantUpdate) return;
    const amount = Number(draft.amount.replace(",", "."));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || (minDate && draft.date < minDate) || (maxDate && draft.date > maxDate)) return setMessage(`La date doit rester dans la campagne source : ${minDate} → ${maxDate}.`);
    if (!Number.isFinite(amount) || amount < 0) return setMessage("Le montant doit être un nombre positif ou nul.");
    setBusy(true);
    try {
      await onMerchantUpdate(editing, { date: draft.date, reference: draft.reference, clientNumber: draft.clientNumber, amount, status: draft.status, comment: draft.comment });
      closeEditor();
      setMessage("Transaction Merchant mise à jour. Les indicateurs et exports ont été recalculés.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La transaction n’a pas pu être mise à jour dans Supabase.");
    } finally { setBusy(false); }
  };
  const deleteTransaction = async () => {
    if (!confirmDelete || !onMerchantDelete) return;
    setBusy(true);
    try {
      await onMerchantDelete(confirmDelete);
      setConfirmDelete(null);
      setMessage("Transaction Merchant supprimée. Les indicateurs et exports ont été recalculés.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La transaction n’a pas pu être supprimée dans Supabase.");
    } finally { setBusy(false); }
  };
  useEffect(() => {
    const handleOutsidePointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const backdrop = target.closest(".admin-modal-backdrop");
      if (!backdrop || target !== backdrop || busy) return;
      if (confirmDelete) setConfirmDelete(null); else closeEditor();
    };
    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, [busy, confirmDelete]);
  return <div className="module-page activation-admin-page merchant-transaction-admin"><section className="module-heading glass-card"><div className="eyebrow">ADMINISTRATION BTL <span className="eyebrow-line" /></div><h1>Transactions</h1><p>Modifiez une transaction Merchant ou retirez-la après confirmation. Les changements sont persistés dans Supabase et tracés dans le journal BTL.</p><div className="module-context"><span className="live-pulse" /> {rangeLabel} · {number(rows.length)} transaction(s) visible(s)</div></section><section className="module-panel glass-card activation-admin-panel"><div className="admin-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Rechercher une transaction…" /><kbd>⌘ K</kbd></div><button className="soft-button" onClick={() => setSortAsc((value) => !value)}>Date {sortAsc ? "croissante" : "décroissante"}</button><span className="toolbar-count">{number(rows.length)} lignes</span></div><div className="admin-permission-note"><Check size={15} /> BTL · édition et suppression persistantes dans Supabase après confirmation</div>{visible.length ? <><div className="admin-activation-table merchant-transaction-table"><div className="admin-activation-head merchant-transaction-head"><span>Date</span><span>Ambassadeur</span><span>Point de vente</span><span>Référence</span><span>Montant</span><span>État</span><span /></div>{visible.map((item) => <div className="admin-activation-row merchant-transaction-row" key={item.id}><button className="admin-activation-main merchant-transaction-main" type="button" onClick={() => openEditor(item)}><span>{dateLabel(item.d)}</span><strong>{item.a}</strong><span>{item.s}</span><span>{item.merchant?.reference || "—"}</span><span>{number(item.merchant?.amount ?? 0)}</span><span><em className={`merchant-status merchant-status-${item.merchant?.status ?? "recorded"}`}>{merchantStatusLabels[item.merchant?.status ?? "recorded"]}</em></span></button><div className="admin-row-actions"><button className="admin-edit-button" type="button" aria-label={`Modifier la transaction ${item.merchant?.reference || item.id}`} onClick={() => openEditor(item)}><Pencil size={14} /></button><button className="admin-delete-button" type="button" aria-label={`Supprimer la transaction ${item.merchant?.reference || item.id}`} onClick={() => setConfirmDelete(item)}><Trash2 size={15} /></button></div></div>)}</div><div className="pagination"><span>Page {Math.min(page, pages)} sur {pages}</span><div><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button><button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>›</button></div></div></> : <div className="empty-module"><Search size={18} /><strong>Aucune transaction dans la sélection</strong><span>Modifiez la recherche ou la période active.</span></div>}{message && <div className="admin-feedback"><Check size={15} /> {message}</div>}</section>{editing && draft && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="merchant-edit-modal-title"><div className="admin-modal-heading"><div><div className="eyebrow">TRANSACTION MERCHANT</div><h2 id="merchant-edit-modal-title">Modifier la transaction</h2><p>{editing.a} · {editing.s} · les références terrain restent inchangées.</p></div><button className="close-detail" onClick={closeEditor} disabled={busy} aria-label="Fermer"><X size={16} /></button></div><div className="admin-form-grid"><label className="admin-field"><span>Date · AAAA-MM-JJ</span><input value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} placeholder="2026-08-19" /></label><label className="admin-field"><span>Référence</span><input value={draft.reference} onChange={(event) => updateDraft("reference", event.target.value)} placeholder="Référence de transaction" /></label><label className="admin-field"><span>Numéro client</span><input value={draft.clientNumber} onChange={(event) => updateDraft("clientNumber", event.target.value.replace(/[^\d+\s-]/g, ""))} placeholder="Numéro ou identifiant" /></label><label className="admin-field"><span>Montant</span><input value={draft.amount} inputMode="decimal" onChange={(event) => updateDraft("amount", event.target.value.replace(/[^\d,.]/g, ""))} placeholder="0" /></label><Choice label="Statut" value={merchantStatusLabels[draft.status]} options={Object.values(merchantStatusLabels)} onChange={(value) => { const status = (Object.entries(merchantStatusLabels).find(([, label]) => label === value)?.[0] ?? "recorded") as MerchantDraft["status"]; updateDraft("status", status); }} /><label className="admin-field admin-field-wide"><span>Commentaire · optionnel</span><textarea value={draft.comment} onChange={(event) => updateDraft("comment", event.target.value)} placeholder="Contexte de la transaction" /></label></div><div className="admin-modal-actions"><button className="soft-button" onClick={closeEditor} disabled={busy}>Annuler</button><button className="primary-button" onClick={() => void saveTransaction()} disabled={busy}><Pencil size={15} /> {busy ? "Enregistrement…" : "Enregistrer"}</button></div></section></div>}{confirmDelete && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-danger-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="merchant-delete-modal-title"><div className="admin-danger-icon"><AlertTriangle size={22} /></div><div className="admin-modal-heading"><div><div className="eyebrow">ACTION BTL PERSISTANTE</div><h2 id="merchant-delete-modal-title">Supprimer cette transaction ?</h2><p>{dateLabel(confirmDelete.d)} · {confirmDelete.a} · {confirmDelete.merchant?.reference || "Sans référence"}</p></div><button className="close-detail" onClick={() => setConfirmDelete(null)} disabled={busy} aria-label="Fermer"><X size={16} /></button></div><div className="admin-modal-actions"><button className="soft-button" onClick={() => setConfirmDelete(null)} disabled={busy}>Annuler</button><button className="danger-button" onClick={() => void deleteTransaction()} disabled={busy}><Trash2 size={15} /> {busy ? "Suppression…" : "Confirmer & supprimer"}</button></div></section></div>}</div>;
}
