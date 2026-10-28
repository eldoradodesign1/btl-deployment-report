// Fenêtre d'export « nouvelle fabrication » (maquette Aurora, écran 9) : l'aperçu paginé à gauche,
// les choix à droite. Les interrupteurs composent réellement le PDF (pages) et l'Excel (onglets).
// Les feuilles d'aperçu gardent des couleurs fixes : elles sont capturées telles quelles dans le PDF.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, LoaderCircle, X } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Activation } from "@/data/vodacomData";
import { campaignTerms } from "@/lib/campaigns";
import { exportReportWorkbookV2, periodDays, type ExportSections } from "@/lib/excelReportV2";
import { PeriodPicker } from "@/orbit/PeriodPicker";
import { OrbitIcon } from "@/orbit/OrbitIcon";

export type ReportExportV2Props = {
  data: Activation[];
  filtered: Activation[];
  fullTargetDaily: [string, number][];
  startDate: string;
  endDate: string;
  rangeLabel: string;
  formatNumber: (value: number) => string;
  formatDate: (date: string) => string;
  weeklyComment?: string;
  customPeriodComment?: string;
  onPeriodChange: (startDate: string, endDate: string) => void;
  onClose: () => void;
  onUseClassic: () => void;
};

type Format = "pdf" | "xlsx";
type SectionKey = keyof ExportSections;
type PageKind = "overview" | "team" | "targets" | "comment";

const PAGE_W = 1123;
const PAGE_H = 794;
const SECTIONS_KEY = "btl-export-sections";
const DEFAULT_SECTIONS: ExportSections = { synthesis: true, progression: true, participants: true, locations: true, comment: true, targets: true, detail: false };
const PALETTE = ["#18a59e", "#4a74e8", "#8a6cf0", "#e2553a", "#d3871c", "#3a4a6a"];

const readSections = (): ExportSections => { try { return { ...DEFAULT_SECTIONS, ...(JSON.parse(localStorage.getItem(SECTIONS_KEY) ?? "{}") as Partial<ExportSections>) }; } catch { return DEFAULT_SECTIONS; } };
const ranked = (rows: Activation[], pick: (row: Activation) => string) => { const map = new Map<string, number>(); rows.forEach((row) => { const key = pick(row) || "—"; map.set(key, (map.get(key) ?? 0) + 1); }); return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")); };
const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const fmt = (value: number, decimals = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);

function useReport(filtered: Activation[], fullTargetDaily: [string, number][], startDate: string, endDate: string) {
  return useMemo(() => {
    const days = periodDays(startDate, endDate);
    const targetByDate = new Map(fullTargetDaily);
    const done = new Map<string, number>(); filtered.forEach((row) => done.set(row.d, (done.get(row.d) ?? 0) + 1));
    const daily = days.map((day) => ({ day, value: done.get(day) ?? 0, target: targetByDate.get(day) ?? 0 }));
    const total = filtered.length;
    const activeDays = daily.filter((point) => point.value > 0).length;
    const target = daily.reduce((sum, point) => sum + point.target, 0);
    const participants = ranked(filtered, (row) => row.a);
    const locations = ranked(filtered, (row) => row.s);
    const types = ranked(filtered, (row) => row.t);
    const amount = filtered.reduce((sum, row) => sum + Number(row.merchant?.amount ?? 0), 0);
    const weeks: { start: string; end: string; value: number; target: number }[] = [];
    daily.forEach((point) => { const date = new Date(`${point.day}T00:00:00`); const current = weeks.at(-1); if (current && date.getDay() !== 1) { current.end = point.day; current.value += point.value; current.target += point.target; } else weeks.push({ start: point.day, end: point.day, value: point.value, target: point.target }); });
    return { daily, total, activeDays, target, participants, locations, types, amount, weeks, average: activeDays ? total / activeDays : 0, rate: target ? (total / target) * 100 : 0 };
  }, [filtered, fullTargetDaily, startDate, endDate]);
}
type Report = ReturnType<typeof useReport>;

type PageContext = { report: Report; sections: ExportSections; title: string; rangeLabel: string; records: string; participantsLabel: string; locationsLabel: string; merchant: boolean; comment: string; commentLabel: string; formatDate: (date: string) => string; commentOnOverview: boolean; commentOnTeam: boolean };

function Donut({ parts, total }: { parts: [string, number][]; total: number }) {
  const radius = 54; const length = 2 * Math.PI * radius; let cursor = 0;
  return <svg className="xv2-donut" viewBox="0 0 150 150" width="150" height="150" aria-hidden="true">
    <circle cx="75" cy="75" r={radius} fill="none" stroke="#e8edf5" strokeWidth="22" />
    {parts.map(([label, value], index) => { const share = total ? value / total : 0; const dash = share * length; const offset = -cursor * length; cursor += share; return <circle key={label} cx="75" cy="75" r={radius} fill="none" stroke={PALETTE[index % PALETTE.length]} strokeWidth="22" strokeDasharray={`${dash} ${length - dash}`} strokeDashoffset={offset} transform="rotate(-90 75 75)" />; })}
    <text x="75" y="77" textAnchor="middle" fontSize="24" fontWeight="700" fill="#142039" fontFamily="Arial, sans-serif">{fmt(total)}</text>
    <text x="75" y="96" textAnchor="middle" fontSize="11" fill="#687896" fontFamily="Arial, sans-serif">total</text>
  </svg>;
}

function LineChart({ report, withTarget, height }: { report: Report; withTarget: boolean; height: number }) {
  const width = 1000; const pad = { l: 40, r: 12, t: 14, b: 26 };
  const points = report.daily;
  const max = Math.max(1, ...points.map((point) => point.value), ...(withTarget ? points.map((point) => point.target) : []));
  const x = (index: number) => pad.l + (index / Math.max(1, points.length - 1)) * (width - pad.l - pad.r);
  const y = (value: number) => pad.t + (1 - value / max) * (height - pad.t - pad.b);
  const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const area = `${pad.l},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`;
  const target = points.map((point, index) => `${x(index).toFixed(1)},${y(point.target).toFixed(1)}`).join(" ");
  return <svg className="xv2-line" viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
    {[0, 0.5, 1].map((ratio) => <line key={ratio} x1={pad.l} x2={width - pad.r} y1={pad.t + ratio * (height - pad.t - pad.b)} y2={pad.t + ratio * (height - pad.t - pad.b)} stroke="#e3e9f2" strokeWidth="1" />)}
    <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" fontSize="11" fill="#687896" fontFamily="Arial, sans-serif">{fmt(max)}</text>
    <text x={pad.l - 6} y={y(0) + 4} textAnchor="end" fontSize="11" fill="#687896" fontFamily="Arial, sans-serif">0</text>
    {points.length > 1 && <polygon points={area} fill="#18a59e" fillOpacity="0.12" />}
    {withTarget && points.length > 1 && <polyline points={target} fill="none" stroke="#d3871c" strokeWidth="2" strokeDasharray="6 5" />}
    {points.length > 1 && <polyline points={line} fill="none" stroke="#18a59e" strokeWidth="2.6" strokeLinejoin="round" />}
  </svg>;
}

function Bars({ title, rows, total, color, limit }: { title: string; rows: [string, number][]; total: number; color: string; limit: number }) {
  const max = rows[0]?.[1] ?? 1;
  return <div className="xv2-bars"><h4>{title}</h4>{rows.length ? rows.slice(0, limit).map(([name, value]) => <div className="xv2-bar" key={name}><span>{name}</span><div><i style={{ width: `${(value / max) * 100}%`, background: color }} /></div><b>{fmt(value)}</b><em>{pct(value, total)} %</em></div>) : <p className="xv2-none">Aucune donnée sur la période.</p>}{rows.length > limit && <p className="xv2-more">+ {rows.length - limit} autres (détail complet dans l’Excel)</p>}</div>;
}

function CommentBlock({ ctx }: { ctx: PageContext }) {
  return <div className="xv2-comment"><span>{ctx.commentLabel}</span><p>{ctx.comment}</p></div>;
}

function PageSheet({ kind, index, count, ctx }: { kind: PageKind; index: number; count: number; ctx: PageContext }) {
  const { report, sections } = ctx;
  const subtitle = kind === "overview" ? "Vue d’ensemble" : kind === "team" ? `${sections.participants ? ctx.participantsLabel : ""}${sections.participants && sections.locations ? " et " : ""}${sections.locations ? ctx.locationsLabel.toLowerCase() : ""}` : kind === "targets" ? "Objectifs" : "Commentaire";
  const kpis: [string, string][] = [
    [ctx.records.toLowerCase(), fmt(report.total)],
    ...(ctx.merchant ? [["montant", fmt(report.amount)] as [string, string]] : report.types.slice(0, 1).map(([label, value]) => [label.toLowerCase(), fmt(value)] as [string, string])),
    [ctx.participantsLabel.toLowerCase(), fmt(report.participants.length)],
    [ctx.locationsLabel.toLowerCase(), fmt(report.locations.length)],
    ["jours d’activité", fmt(report.activeDays)],
    ["moyenne / jour", fmt(report.average, 1)],
    ...(sections.targets ? [["de l’objectif", `${fmt(Math.round(report.rate))} %`] as [string, string]] : []),
  ];
  const showComment = kind === "comment" || (kind === "overview" && ctx.commentOnOverview) || (kind === "team" && ctx.commentOnTeam) || (kind === "targets" && sections.comment && !!ctx.comment);
  const both = sections.participants && sections.locations;
  return <article className={`xv2-page xv2-page-${kind}`} style={{ width: PAGE_W, height: PAGE_H }}>
    <header className="xv2-page-head"><OrbitIcon size={34} /><div><b>{ctx.title}</b><small>{subtitle}</small></div><span>{ctx.rangeLabel}</span></header>
    <div className="xv2-page-body">
      {kind === "overview" && <>
        {sections.synthesis && <section className="xv2-synthesis">
          <div className="xv2-kpis">{kpis.map(([label, value]) => <div key={label}><b>{value}</b><small>{label}</small></div>)}</div>
          <div className="xv2-split"><Donut parts={report.types} total={report.total} /><div className="xv2-legend">{report.types.slice(0, 6).map(([label, value], i) => <span key={label}><i style={{ background: PALETTE[i % PALETTE.length] }} />{label}<b>{fmt(value)}</b><em>{pct(value, report.total)} %</em></span>)}</div></div>
        </section>}
        {sections.progression && <section className="xv2-progress"><h4>Progression de la période{sections.targets && <small><i className="xv2-key done" />Réalisé <i className="xv2-key goal" />Objectif</small>}</h4><LineChart report={report} withTarget={sections.targets} height={sections.synthesis ? (ctx.commentOnOverview ? 190 : 300) : (ctx.commentOnOverview ? 360 : 470)} /><div className="xv2-axis"><span>{report.daily[0] ? ctx.formatDate(report.daily[0].day) : "—"}</span><span>{report.daily.at(-1) ? ctx.formatDate(report.daily.at(-1)!.day) : "—"}</span></div></section>}
      </>}
      {kind === "team" && <section className={`xv2-team ${both ? "two" : "one"}`}>
        {sections.participants && <Bars title={`${ctx.records} par ${ctx.participantsLabel === "Hôtesses" ? "hôtesse" : ctx.participantsLabel.toLowerCase().replace(/s$/, "")}`} rows={report.participants} total={report.total} color="#4a74e8" limit={ctx.commentOnTeam ? 9 : 13} />}
        {sections.locations && <Bars title={`${ctx.records} par ${ctx.locationsLabel.toLowerCase().replace(/s$/, "")}`} rows={report.locations} total={report.total} color="#18a59e" limit={ctx.commentOnTeam ? 9 : 13} />}
      </section>}
      {kind === "targets" && <section className="xv2-targets">
        <div className="xv2-kpis three"><div><b>{fmt(report.total)}</b><small>réalisé</small></div><div><b>{fmt(report.target)}</b><small>objectif</small></div><div><b>{fmt(Math.round(report.rate))} %</b><small>atteinte</small></div><div><b className={report.total - report.target < 0 ? "neg" : "pos"}>{report.total - report.target > 0 ? "+" : ""}{fmt(report.total - report.target)}</b><small>écart</small></div></div>
        <table className="xv2-table"><thead><tr><th>Semaine</th><th>Réalisé</th><th>Objectif</th><th>Atteinte</th><th>Écart</th></tr></thead><tbody>{report.weeks.slice(0, showComment ? 8 : 12).map((week) => <tr key={week.start}><td>{ctx.formatDate(week.start)} → {ctx.formatDate(week.end)}</td><td>{fmt(week.value)}</td><td>{fmt(week.target)}</td><td><span className="xv2-meter"><i style={{ width: `${Math.min(100, pct(week.value, week.target))}%` }} /></span>{pct(week.value, week.target)} %</td><td className={week.value - week.target < 0 ? "neg" : "pos"}>{week.value - week.target > 0 ? "+" : ""}{fmt(week.value - week.target)}</td></tr>)}</tbody></table>{report.weeks.length > (showComment ? 8 : 12) && <p className="xv2-more">+ {report.weeks.length - (showComment ? 8 : 12)} semaines dans l’onglet Objectifs de l’Excel</p>}
      </section>}
      {showComment && <CommentBlock ctx={ctx} />}
    </div>
    <footer className="xv2-page-foot"><span>Kinshasa — République Démocratique du Congo</span><span>Page {index + 1} sur {count}</span></footer>
  </article>;
}

export default function ReportExportV2({ data, filtered, fullTargetDaily, startDate, endDate, rangeLabel, formatNumber, formatDate, weeklyComment = "", customPeriodComment = "", onPeriodChange, onClose, onUseClassic }: ReportExportV2Props) {
  const merchant = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "brand_ambassador";
  const terms = campaignTerms(merchant ? "brand_ambassador" : "hostess");
  const participantsLabel = merchant ? terms.participants : "Hôtesses";
  const title = merchant ? "RAPPORT D’ACTIVITÉ — MERCHANT EDUCATIONAL CAMPAIGN" : "RAPPORT D’ACTIVITÉ — CAMPAGNE VODACOM PRIVILÈGE";
  const comment = (weeklyComment || customPeriodComment).trim();
  const commentLabel = weeklyComment ? "COMMENTAIRE HEBDOMADAIRE" : "COMMENTAIRE DE LA PÉRIODE";
  const [format, setFormat] = useState<Format>("pdf");
  const [sections, setSections] = useState<ExportSections>(readSections);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(0.5);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const report = useReport(filtered, fullTargetDaily, startDate, endDate);

  const hasComment = sections.comment && comment.length > 0;
  const pages = useMemo(() => {
    const list: PageKind[] = [];
    if (sections.synthesis || sections.progression) list.push("overview");
    if (sections.participants || sections.locations) list.push("team");
    if (sections.targets) list.push("targets");
    if (hasComment && !sections.targets && !list.length) list.push("comment");
    return list;
  }, [sections, hasComment]);
  const commentOnOverview = hasComment && !sections.targets && pages[0] === "overview";
  const commentOnTeam = hasComment && !sections.targets && pages[0] === "team";
  const ctx: PageContext = { report, sections, title, rangeLabel, records: terms.records, participantsLabel, locationsLabel: terms.locations, merchant, comment, commentLabel, formatDate, commentOnOverview, commentOnTeam };
  const current = Math.min(page, Math.max(0, pages.length - 1));
  const excelOnlyParts = format === "xlsx" && sections.detail;
  const nothing = format === "pdf" ? pages.length === 0 : !(sections.synthesis || sections.progression || sections.participants || sections.locations || sections.targets || hasComment || sections.detail);

  useEffect(() => { try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections)); } catch { /* préférence facultative */ } }, [sections]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector(".orbit-period-panel")) onClose();
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.key === "ArrowLeft") setPage((value) => Math.max(0, value - 1));
      if (event.key === "ArrowRight") setPage((value) => Math.min(pages.length - 1, value + 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pages.length]);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => { const width = stage.clientWidth; const height = stage.clientHeight || width; setScale(Math.max(0.2, Math.min(width / PAGE_W, height / PAGE_H))); };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const toggle = (key: SectionKey) => setSections((value) => ({ ...value, [key]: !value[key] }));
  const parts: { key: SectionKey; label: string; hint?: string; disabled?: boolean }[] = [
    { key: "synthesis", label: "Synthèse" },
    { key: "progression", label: "Progression" },
    { key: "participants", label: participantsLabel },
    { key: "locations", label: terms.locations },
    { key: "comment", label: "Commentaire de la période", hint: comment ? undefined : "Aucun commentaire sur cette période", disabled: !comment },
    { key: "targets", label: "Objectifs" },
    { key: "detail", label: "Détail ligne à ligne", hint: format === "pdf" ? "Réservé à l’Excel" : "Onglet « Détail » visible", disabled: format === "pdf" },
  ];

  const downloadPdf = async () => {
    const root = captureRef.current;
    if (!root) return;
    await document.fonts?.ready;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".xv2-page"));
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, windowHeight: PAGE_H });
      if (index) doc.addPage("a4", "landscape");
      doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 297, 210, undefined, "FAST");
    }
    doc.save(`rapport-activite-${startDate}-${endDate}.pdf`);
  };
  const downloadXlsx = () => exportReportWorkbookV2({ filtered, fullTargetDaily, startDate, endDate, rangeLabel, title, comment, commentLabel, terms, participantsLabel, sections: { ...sections, comment: hasComment } });
  const download = async () => {
    if (busy || nothing) return;
    setBusy(true); setError("");
    try { if (format === "pdf") await downloadPdf(); else downloadXlsx(); }
    catch (cause) { console.error(cause); setError("Le fichier n’a pas pu être fabriqué. Réessayez, ou utilisez l’export classique."); }
    finally { setBusy(false); }
  };

  return <div className="report-modal-backdrop xv2-veil" role="dialog" aria-modal="true" aria-labelledby="xv2-title" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="xv2-modal">
      <section className="xv2-preview" aria-label="Aperçu du rapport">
        <div className="xv2-preview-bar"><span>{pages.length ? `Aperçu · page ${current + 1} sur ${pages.length}` : "Aperçu"}</span><button type="button" className="xv2-round" aria-label="Page précédente" disabled={current <= 0} onClick={() => setPage(Math.max(0, current - 1))}><ChevronLeft size={16} /></button><button type="button" className="xv2-round" aria-label="Page suivante" disabled={current >= pages.length - 1} onClick={() => setPage(Math.min(pages.length - 1, current + 1))}><ChevronRight size={16} /></button></div>
        <div className="xv2-stage" ref={stageRef}>
          {format === "pdf" && pages.length > 0 && <div className="xv2-sheet-frame" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}><div style={{ transform: `scale(${scale})`, transformOrigin: "top left" } as CSSProperties}><PageSheet kind={pages[current]} index={current} count={pages.length} ctx={ctx} /></div></div>}
          {format === "xlsx" && <div className="xv2-xlsx-plan"><FileSpreadsheet size={28} /><b>Classeur Excel</b><p>Chaque chiffre est une formule qui lit les lignes de la période : modifiez une ligne du détail, les totaux suivent.</p><ul>{sections.synthesis && <li>Synthèse</li>}{sections.progression && <li>Progression · réalisé et cumuls jour par jour</li>}{sections.participants && <li>{participantsLabel} · classement, parts, moyennes</li>}{sections.locations && <li>{terms.locations} · classement, parts, moyennes</li>}{sections.targets && <li>Objectifs · semaine par semaine, atteinte cumulée</li>}{hasComment && !sections.synthesis && <li>Commentaire</li>}<li className={sections.detail ? "" : "muted"}>Détail ligne à ligne {sections.detail ? "" : "(onglet masqué, toujours utilisé par les formules)"}</li><li className="muted">Sources (onglet masqué)</li></ul></div>}
          {format === "pdf" && !pages.length && <p className="xv2-empty">Activez au moins une partie pour composer le rapport.</p>}
        </div>
      </section>
      <aside className="xv2-side">
        <div className="xv2-side-head"><h2 id="xv2-title">Exporter le rapport</h2><button type="button" className="xv2-round" onClick={onClose} aria-label="Fermer"><X size={17} /></button></div>
        <p className="xv2-sub">{rangeLabel} · {formatNumber(filtered.length)} {terms.records.toLowerCase()}</p>
        <div className="xv2-period orbit-export-period"><PeriodPicker data={data} startDate={startDate} endDate={endDate} recordLabel={terms.records.toLowerCase()} onChange={onPeriodChange} /></div>
        <div className="xv2-seg" role="radiogroup" aria-label="Format du fichier">
          <button type="button" role="radio" aria-checked={format === "pdf"} className={format === "pdf" ? "on" : ""} onClick={() => setFormat("pdf")}><FileText size={15} />PDF</button>
          <button type="button" role="radio" aria-checked={format === "xlsx"} className={format === "xlsx" ? "on" : ""} onClick={() => setFormat("xlsx")}><FileSpreadsheet size={15} />Excel</button>
        </div>
        <div className="xv2-parts" role="group" aria-label="Parties du rapport">
          {parts.map(({ key, label, hint, disabled }) => { const on = sections[key] && !disabled; return <label key={key} className={`xv2-part${disabled ? " disabled" : ""}`}><span><b>{label}</b>{hint && <small>{hint}</small>}</span><input type="checkbox" role="switch" checked={on} disabled={disabled} onChange={() => toggle(key)} /><i className="xv2-switch" aria-hidden="true" /></label>; })}
        </div>
        <div className="xv2-grow" />
        {error && <p className="xv2-error" role="alert">{error}</p>}
        <button type="button" className="xv2-download" disabled={busy || nothing} onClick={() => void download()}>{busy ? <LoaderCircle size={17} className="xv2-spin" /> : <Download size={17} />}{busy ? "Fabrication…" : format === "pdf" ? "Télécharger le PDF" : "Télécharger l’Excel"}</button>
        <p className="xv2-foot">{excelOnlyParts ? "Le détail ligne à ligne sera visible dans le classeur." : "Les fichiers suivent la période choisie ci-dessus."} <button type="button" className="xv2-link" onClick={onUseClassic}>Export classique</button></p>
      </aside>
    </div>
    {createPortal(<div className="xv2-capture" ref={captureRef} aria-hidden="true">{pages.map((kind, index) => <PageSheet key={kind} kind={kind} index={index} count={pages.length} ctx={ctx} />)}</div>, document.body)}
  </div>;
}
