// Design philosophy: Halo Opaline — Merchant data tools extend the cockpit as restrained instrument panels.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { ChevronDown, FileSpreadsheet, Upload, X } from "lucide-react";
import { readSession } from "@/lib/roles";
import { loadCampaigns, loadMerchantCreationContext, type MerchantCreationContext } from "@/lib/supabaseData";
import { logBtlDataChange } from "@/lib/supabase";
import { importMerchantTransactions, loadMerchantTransactionImportIssues, updateMerchantCampaignTargets, type MerchantCampaignTargets, type MerchantImportIssue, type MerchantImportRecord } from "@/lib/supabaseActions";
import "./merchant-data-tools.css";

type Targets = MerchantCampaignTargets & { campaignId: string; campaignName: string };
type PreviewLine = { rowNumber: number; raw: Record<string, string>; missing: string[]; record?: MerchantImportRecord };
type StoredIssue = { id: string; source_filename: string; row_number: number; missing_fields: string[]; created_at: string };
type Status = "recorded" | "verified" | "rejected";

const fields = {
  date: ["date", "date transaction", "occurred at", "jour"],
  ambassador: ["ambassadeur", "ambassador", "ba", "nom ambassadeur"],
  point: ["point de vente", "pos", "pdv", "point"],
  amount: ["montant", "amount", "valeur"],
  evidence: ["evidence path", "preuve", "photo", "capture", "chemin preuve", "image"],
  reference: ["reference", "transaction reference", "ref"],
  shortCode: ["short code", "short-code", "shortcode", "code court"],
  clientNumber: ["numero client", "numero", "telephone", "client number", "msisdn"],
  status: ["statut", "status"],
  comment: ["commentaire", "comment", "note"],
} as const;

const normal = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const dateFrom = (value: string) => {
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.replaceAll(".", "/").split("/");
  return parts.length === 3 ? `${parts[2].length === 2 ? `20${parts[2]}` : parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}` : "";
};

function usePortalTarget(selector: string) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const find = () => setTarget(document.querySelector<HTMLElement>(selector));
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selector]);
  return target;
}

async function parseMerchantFile(file: File, context: MerchantCreationContext) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  const headerIndex = rows.findIndex((row) => row.some((value) => fields.date.includes(normal(String(value)) as never)) && row.some((value) => fields.ambassador.includes(normal(String(value)) as never)));
  if (headerIndex < 0) throw new Error("Les colonnes Date et Ambassadeur sont requises pour ce fichier Merchant.");
  const headers = rows[headerIndex].map((value) => normal(String(value)));
  const cell = (row: unknown[], key: keyof typeof fields) => {
    const position = headers.findIndex((header) => fields[key].includes(header as never));
    return position < 0 ? "" : String(row[position] ?? "").trim();
  };
  const ambassadors = new Map(context.ambassadors.map((item) => [normal(item.label), item]));
  const points = new Map(context.points.map((item) => [normal(item.label), item]));
  const status: Record<string, Status> = { verified: "verified", verifie: "verified", verifiee: "verified", rejected: "rejected", rejete: "rejected", rejetee: "rejected" };
  const output: PreviewLine[] = [];

  rows.slice(headerIndex + 1).forEach((row, index) => {
    if (!row.some((value) => String(value).trim())) return;
    const raw = Object.fromEntries(headers.map((header, position) => [header || `colonne ${position + 1}`, String(row[position] ?? "").trim()]));
    const date = dateFrom(cell(row, "date"));
    const ambassadorName = cell(row, "ambassador");
    const pointName = cell(row, "point");
    const amount = Number(cell(row, "amount").replace(/\s/g, "").replace(",", "."));
    const evidencePath = cell(row, "evidence");
    const ambassador = ambassadors.get(normal(ambassadorName));
    const point = points.get(normal(pointName));
    const missing = [
      !date ? "Date" : "",
      !ambassadorName ? "Ambassadeur" : !ambassador ? "Ambassadeur non reconnu" : "",
      !pointName ? "Point de vente" : !point ? "Point de vente non reconnu" : "",
      !Number.isFinite(amount) || amount < 0 ? "Montant" : "",
      !evidencePath ? "Chemin de preuve photo" : "",
    ].filter(Boolean);
    const rowNumber = headerIndex + index + 2;
    if (missing.length || !ambassador || !point || !context.campaignRunId) {
      output.push({ rowNumber, raw, missing });
      return;
    }
    output.push({
      rowNumber,
      raw,
      missing: [],
      record: {
        rowNumber,
        campaignRunId: context.campaignRunId,
        baId: ambassador.id,
        posId: point.id,
        date,
        reference: cell(row, "reference"),
        shortCode: cell(row, "shortCode"),
        clientNumber: cell(row, "clientNumber"),
        amount,
        status: status[normal(cell(row, "status"))] ?? "recorded",
        comment: cell(row, "comment"),
        evidencePath,
        rawPayload: raw,
      },
    });
  });
  return output;
}

function MerchantTargets() {
  const target = usePortalTarget(".merchant-target-matrix");
  const [value, setValue] = useState<Targets | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const enabled = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "brand_ambassador" && readSession()?.role === "btl";

  useEffect(() => {
    if (!enabled) return;
    void loadCampaigns().then((campaigns) => {
      const selectedId = localStorage.getItem("btl-selected-campaign") ?? "";
      const campaign = campaigns.find((item) => item.id === selectedId && item.campaignType === "brand_ambassador") ?? campaigns.find((item) => item.campaignType === "brand_ambassador");
      if (campaign) setValue({ campaignId: campaign.id, campaignName: campaign.name, dailyPosTarget: campaign.dailyPosTarget ?? 15, transactionsPerPosTarget: campaign.transactionsPerPosTarget ?? 3 });
    }).catch(() => setMessage("Les objectifs Merchant ne peuvent pas être chargés."));
  }, [enabled]);
  useEffect(() => {
    if (!target || !enabled) return;
    target.classList.add("is-inline-editable");
    return () => target.classList.remove("is-inline-editable");
  }, [target, enabled]);

  if (!target || !enabled || !value) return null;
  const adjust = async (key: keyof MerchantCampaignTargets, direction: number) => {
    const next = { ...value, [key]: Math.max(1, value[key] + direction) };
    setValue(next); setBusy(true); setMessage("");
    try {
      await updateMerchantCampaignTargets(next.campaignId, next);
      setMessage("Objectifs Merchant enregistrés dans Supabase.");
    } catch (error) {
      setValue(value);
      setMessage(error instanceof Error ? error.message : "Les objectifs Merchant n’ont pas pu être enregistrés.");
    } finally { setBusy(false); }
  };
  const stepper = (key: keyof MerchantCampaignTargets) => <div className="number-stepper"><button type="button" disabled={busy || value[key] <= 1} onClick={() => void adjust(key, -1)}>−</button><input value={value[key]} aria-label={key} readOnly /><button type="button" disabled={busy} onClick={() => void adjust(key, 1)}>+</button></div>;
  const inline = <div className="merchant-inline-target-matrix" aria-live="polite"><div className="target-matrix-head"><span>Indicateur</span><span>Cible</span><span>Lecture</span></div><div className="target-matrix-row"><strong>Points de vente actifs</strong>{stepper("dailyPosTarget")}<span>POS / jour</span></div><div className="target-matrix-row"><strong>Transactions par POS</strong>{stepper("transactionsPerPosTarget")}<span>transactions / POS</span></div><div className="target-matrix-foot"><span>Objectif transactionnel quotidien</span><strong>{value.dailyPosTarget * value.transactionsPerPosTarget}</strong><strong>{value.dailyPosTarget} × {value.transactionsPerPosTarget}</strong></div>{message && <p className="merchant-inline-status">{message}</p>}</div>;
  return createPortal(inline, target);
}

function MerchantImporter() {
  const toolbar = usePortalTarget(".merchant-transaction-admin .admin-toolbar");
  const quality = usePortalTarget(".module-page:has(.quality-banner)");
  const previewFooter = usePortalTarget(".merchant-import-dialog footer");
  const inputRef = useRef<HTMLInputElement>(null);
  const [campaignId, setCampaignId] = useState("");
  const [context, setContext] = useState<MerchantCreationContext | null>(null);
  const [filename, setFilename] = useState("");
  const [lines, setLines] = useState<PreviewLine[]>([]);
  const [issues, setIssues] = useState<StoredIssue[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const enabled = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "brand_ambassador" && readSession()?.role === "btl";
  const refreshIssues = (id: string) => void loadMerchantTransactionImportIssues(id).then((rows) => setIssues(rows as StoredIssue[])).catch(() => undefined);

  useEffect(() => {
    if (!enabled) return;
    const id = localStorage.getItem("btl-selected-campaign") ?? "";
    if (!id) return;
    setCampaignId(id);
    void loadMerchantCreationContext(id).then(setContext).catch(() => setNotice("Les référentiels Merchant ne peuvent pas être chargés."));
    refreshIssues(id);
  }, [enabled]);

  const choose = async (file?: File) => {
    if (!file || !context) return;
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) { setNotice("Choisissez un fichier CSV, XLSX ou XLS."); return; }
    setBusy(true); setNotice("");
    try { setLines(await parseMerchantFile(file, context)); setFilename(file.name); setOpen(true); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Le fichier ne peut pas être lu."); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!campaignId) return;
    const session = readSession();
    const records = lines.flatMap((line) => line.record ? [line.record] : []);
    const invalid: MerchantImportIssue[] = lines.filter((line) => !line.record).map((line) => ({ rowNumber: line.rowNumber, rawPayload: line.raw, missingFields: line.missing }));
    setBusy(true); setNotice("");
    try {
      const result = await importMerchantTransactions({ campaignId, sourceFilename: filename, actorName: session?.profile?.full_name ?? "BTL", records, issues: invalid });
      await logBtlDataChange({ actorName: session?.profile?.full_name ?? "BTL", action: "merchant_transactions.imported", summary: `${result.inserted} transaction(s) Merchant importée(s) depuis ${filename}`, entityType: "ba_transactions", entityId: campaignId, metadata: { imported: result.inserted, issues: result.issues, source: filename } });
      setNotice(`${result.inserted} ligne(s) enregistrée(s) ; ${result.issues} anomalie(s) sont visibles dans Qualité des données.`);
      refreshIssues(campaignId);
    } catch (error) { setNotice(error instanceof Error ? error.message : "L’import n’a pas pu être finalisé."); }
    finally { setBusy(false); }
  };

  if (!enabled) return null;
  const valid = lines.filter((line) => Boolean(line.record)).length;
  const display = (line: PreviewLine, field: string) => line.raw[field] || line.raw[field === "ambassadeur" ? "ambassador" : field === "point de vente" ? "pos" : ""] || "—";
  const importButton = <><input ref={inputRef} className="merchant-import-input" type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(event) => void choose(event.target.files?.[0])} /><button type="button" className="merchant-import-trigger" disabled={busy || !context} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void choose(event.dataTransfer.files?.[0]); }}><FileSpreadsheet size={14} /> {busy ? "Lecture…" : "Importer CSV / XLSX"}</button></>;

  return <>{toolbar && createPortal(importButton, toolbar)}{previewFooter && valid === 0 && lines.length > 0 && createPortal(<button type="button" className="primary-button merchant-archive-issues" disabled={busy} onClick={() => void save()}><Upload size={14} /> {busy ? "Archivage…" : `Archiver ${lines.length} anomalie(s)`}</button>, previewFooter)}{quality && issues.length > 0 && createPortal(<section className="merchant-quality-panel glass-card"><div><div className="eyebrow">IMPORT MERCHANT</div><h2>Champs à compléter</h2><p>{issues.length} ligne(s) d’import restent visibles jusqu’à leur régularisation.</p></div><div className="merchant-quality-list">{issues.slice(0, 8).map((issue) => <div key={issue.id}><span>Ligne {issue.row_number}</span><strong>{issue.missing_fields.join(" · ")}</strong><small>{issue.source_filename}</small></div>)}</div></section>, quality)}{open && <div className="merchant-tool-backdrop" onMouseDown={() => !busy && setOpen(false)}><section className="merchant-tool-dialog merchant-import-dialog glass-card" onMouseDown={(event) => event.stopPropagation()}><div className="merchant-tool-heading"><div><div className="eyebrow">IMPORT MERCHANT</div><h2>Aperçu des transactions</h2><p>{filename} · {valid} prête(s) à écrire · {lines.length - valid} à compléter</p></div><button type="button" className="close-detail" onClick={() => setOpen(false)}><X size={16} /></button></div><div className="merchant-import-columns"><span>Ligne</span><span>Ambassadeur</span><span>Point de vente</span><span>État</span></div><div className="merchant-import-list">{lines.map((line) => <div className={line.record ? "is-valid" : "is-incomplete"} key={line.rowNumber}><span>#{line.rowNumber}</span><strong>{display(line, "ambassadeur")}</strong><span>{display(line, "point de vente")}</span><em>{line.record ? "Prête" : line.missing.join(" · ")}</em></div>)}</div>{notice && <p className="merchant-tool-message">{notice}</p>}<footer><button type="button" className="soft-button" onClick={() => setOpen(false)}>Fermer</button><button type="button" className="primary-button" disabled={busy || valid === 0} onClick={() => void save()}><Upload size={14} /> {busy ? "Import…" : `Importer ${valid} ligne(s)`}</button></footer></section></div>}</>;
}

export default function MerchantDataTools() { return <><MerchantTargets /><MerchantImporter /></>; }
