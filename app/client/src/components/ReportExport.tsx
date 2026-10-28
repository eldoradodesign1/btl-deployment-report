// Design philosophy: Halo Opaline app shell, with a crisp red-and-white report paper that prioritises unclipped, meeting-ready comparisons without changing operational data.
import { useEffect, useId, useRef, useState } from "react";
import { PeriodPicker } from "@/orbit/PeriodPicker";
import { motion } from "framer-motion";
import { Activity, BarChart3, CalendarClock, Download, FileSpreadsheet, FileText, Gauge, MapPin, Target, Users, X, Zap } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Activation } from "@/data/vodacomData";
import { exportExactSynthesisWorkbook } from "@/lib/excelReport";
import AnimatedNumber from "@/components/AnimatedNumber";
import DateRangeFilter from "@/components/DateRangeFilter";
import { campaignTerms } from "@/lib/campaigns";

type ReportProps = {
  data: Activation[];
  filtered: Activation[];
  fullDaily: [string, number][];
  targetDaily: [string, number][];
  fullTargetDaily: [string, number][];
  startDate: string;
  endDate: string;
  rangeLabel: string;
  role: "btl" | "vodacom";
  formatNumber: (value: number) => string;
  formatDate: (date: string) => string;
  weeklyComment?: string;
  customPeriodComment?: string;
  onPeriodChange: (startDate: string, endDate: string) => void;
  onClose: () => void;
};

type ReportPart = { label: string; value: number; color: string };
type Report = ReturnType<typeof buildReport>;

const byKey = (rows: Activation[], key: "a" | "s") => {
  const map = new Map<string, number>();
  rows.forEach((row) => map.set(row[key], (map.get(row[key]) ?? 0) + 1));
  return Array.from(map.entries()).sort((left, right) => right[1] - left[1]);
};

const safePct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const targetTotal = (series: [string, number][]) => series.reduce((sum, [, value]) => sum + value, 0);

function buildReport(filtered: Activation[], fullDaily: [string, number][], targetDaily: [string, number][], fullTargetDaily: [string, number][], merchant = false) {
  const privilege = filtered.filter((row) => row.t === "Opt-in Privilège").length;
  const bundle = filtered.filter((row) => row.t === "Activation Bundle").length;
  const roaming = filtered.filter((row) => row.t === "Opt-in Roaming").length;
  const agents = byKey(filtered, "a");
  const shops = byKey(filtered, "s");
  const days = new Set(filtered.map((row) => row.d));
  const target = targetTotal(targetDaily);
  const parts: ReportPart[] = merchant ? [
    { label: "Transactions", value: filtered.length, color: "#3574bc" },
  ] : [
    { label: "Opt-in Privilège", value: privilege, color: "#3574bc" },
    { label: "Activation Bundle", value: bundle, color: "#d85d52" },
    { label: "Opt-in Roaming", value: roaming, color: "#86b94c" },
  ];
  return {
    total: filtered.length,
    privilege,
    bundle,
    roaming,
    agents,
    shops,
    days: days.size,
    average: days.size ? filtered.length / days.size : 0,
    parts,
    fullDaily,
    fullTargetDaily,
    target,
    gap: filtered.length - target,
    targetRate: target ? (filtered.length / target) * 100 : 0,
  };
}

function reportKpis(report: Report, merchant = false) {
  if (merchant) return [
    { label: "TOTAL TRANSACTIONS", value: report.total, icon: Gauge },
    { label: "TRANSACTIONS VALIDÉES", value: report.total, icon: Activity },
    { label: "AMBASSADEURS ACTIFS", value: report.agents.length, icon: Users },
    { label: "POINTS DE VENTE COUVERTS", value: report.shops.length, icon: MapPin },
    { label: "MOYENNE / JOUR", value: report.average, decimals: 1, icon: Gauge },
    { label: "MOY. / AMBASSADEUR / JOUR", value: report.agents.length ? report.average / report.agents.length : 0, decimals: 1, icon: Activity },
    { label: "JOURS D’ACTIVITÉ", value: report.days, icon: CalendarClock },
    { label: "OBJECTIF PÉRIODE", value: report.target, icon: Target },
    { label: "ATTEINTE OBJECTIF", value: Math.round(report.targetRate), suffix: " %", icon: Target, progress: Math.min(100, Math.max(0, report.targetRate)) },
    { label: "ÉCART RÉALISÉ / CIBLE", value: report.gap, icon: BarChart3 },
  ];
  return [
    { label: "TOTAL ACTIVATIONS", value: report.total, icon: Gauge },
    { label: "OPT-IN PRIVILÈGE", value: report.privilege, icon: Activity },
    { label: "ACTIVATIONS BUNDLE", value: report.bundle, icon: Zap },
    { label: "OPT-IN ROAMING", value: report.roaming, icon: BarChart3 },
    { label: "AGENTS ACTIFS", value: report.agents.length, icon: Users },
    { label: "SHOPS COUVERTS", value: report.shops.length, icon: MapPin },
    { label: "MOYENNE / JOUR", value: report.average, decimals: 1, icon: Gauge },
    { label: "MOY. / AGENT / JOUR", value: report.agents.length ? report.average / report.agents.length : 0, decimals: 1, icon: Activity },
    { label: "JOURS D’ACTIVITÉ", value: report.days, icon: CalendarClock },
    { label: "OBJECTIF PÉRIODE", value: report.target, icon: Target },
    { label: "ATTEINTE OBJECTIF", value: Math.round(report.targetRate), suffix: " %", icon: Target, progress: Math.min(100, Math.max(0, report.targetRate)) },
    { label: "ÉCART RÉALISÉ / CIBLE", value: report.gap, icon: BarChart3 },
  ];
}

function setCaptureStyles(clone: HTMLElement) {
  const force = (selector: string, declarations: Record<string, string>) => {
    clone.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      Object.entries(declarations).forEach(([property, value]) => node.style.setProperty(property, value, "important"));
    });
  };
  force(".report-paper", { background: "#edf0f2", color: "#26323d", overflow: "visible" });
  force(".report-performance-grid, .report-performance-grid > div, .report-bar-row", { overflow: "visible" });
  force(".report-bar-row > span", { color: "#26323d", opacity: "1", visibility: "visible", "text-shadow": "none", "font-family": "Arial, sans-serif", "font-size": "11px", "font-weight": "700", "line-height": "1.14", overflow: "visible", "text-overflow": "clip", "white-space": "normal", "overflow-wrap": "anywhere" });
  force(".report-bar-row b", { color: "#26323d", opacity: "1", visibility: "visible", "text-shadow": "none", "font-family": "Arial, sans-serif", "font-size": "10px", "font-weight": "700" });
  force(".report-bar-row > div", { background: "#e5eaed", opacity: "1", visibility: "visible", overflow: "visible" });
  force(".report-progress-active", { animation: "none", "stroke-dasharray": "none", "stroke-dashoffset": "0" });
  force(".report-selection-callout", { display: "none" });
  force(".report-bar-row i", { background: "#3574bc", opacity: "1", visibility: "visible", animation: "none", transition: "none" });
  force(".report-bar-row.shop-bar i", { background: "#d85d52" });
  force(".report-kpi", { overflow: "hidden" });
  force(".report-kpi-icon", { width: "162px", height: "162px", top: "-46px", right: "-42px", color: "#d50909", opacity: "0.08", transform: "rotate(35deg)" });
  force(".report-kpi-icon svg", { width: "132px", height: "132px", "stroke-width": "2.1" });
  force(".report-kpi-progress", { height: "34px", background: "rgba(213,9,9,.15)", border: "1px solid rgba(213,9,9,.18)" });
  force(".report-kpi-progress i", { background: "linear-gradient(90deg, #d50909, #ef6a5d)", opacity: "1" });
  force(".report-kpi-progress b", { color: "#7e0808", opacity: "1", visibility: "visible", "font-family": "Arial, sans-serif", "font-size": "12px", "font-weight": "700" });
  force(".report-donut-svg", { display: "block", opacity: "1", visibility: "visible" });
  force(".report-donut-segment", { animation: "none", transition: "none" });
  clone.querySelectorAll<HTMLElement>(".animated-number").forEach((node) => {
    node.textContent = node.dataset.finalDisplay ?? node.textContent;
    node.style.setProperty("animation", "none", "important");
    node.style.setProperty("transform", "none", "important");
    node.style.setProperty("opacity", "1", "important");
  });
  clone.querySelectorAll<SVGElement>("svg").forEach((svg) => {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.setProperty("overflow", "visible", "important");
  });
}

async function exportPdfFromHtml(startDate: string, endDate: string) {
  const source = document.getElementById("report-paper");
  if (!source) return;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.position = "absolute";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.width = `${source.scrollWidth}px`;
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  setCaptureStyles(clone);
  document.body.appendChild(clone);
  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: "#edf0f2",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = 297;
    const pageHeight = 210;
    const scale = Math.min((pageWidth - 16) / canvas.width, (pageHeight - 16) / canvas.height);
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    doc.addImage(canvas.toDataURL("image/png"), "PNG", (pageWidth - width) / 2, (pageHeight - height) / 2, width, height, undefined, "FAST");
    doc.save(`rapport-activite-${startDate}-${endDate}.pdf`);
  } finally {
    clone.remove();
  }
}

export default function ReportExport({ data, filtered, fullDaily, targetDaily, fullTargetDaily, startDate, endDate, rangeLabel, role, formatNumber, formatDate, weeklyComment = "", customPeriodComment = "", onPeriodChange, onClose }: ReportProps) {
  const selectionMaskId = useId().replace(/:/g, "");
  const rangeKey = `${startDate}:${endDate}`;
  const previousRangeRef = useRef(rangeKey);
  const [showSelectionCallout, setShowSelectionCallout] = useState(false);
  const merchant = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "brand_ambassador";
  const terms = campaignTerms(merchant ? "brand_ambassador" : "hostess");
  const report = buildReport(filtered, fullDaily, targetDaily, fullTargetDaily, merchant);
  const reportTitle = merchant ? "RAPPORT D’ACTIVITÉ — MERCHANT EDUCATIONAL CAMPAIGN" : "RAPPORT D’ACTIVITÉ — CAMPAGNE VODACOM PRIVILÈGE";
  const reportMovement = merchant ? "Les transactions sur toute la campagne." : "Le mouvement sur toute la campagne.";
  const donutTitle = merchant ? "Transactions" : "Activations";
  const participantPerformance = merchant ? "PERFORMANCE AMBASSADEURS" : "PERFORMANCE HÔTESSES";
  const participantDetail = merchant ? "Transactions par ambassadeur" : "Activations par hôtesse";
  const locationPerformance = merchant ? "PERFORMANCE POINTS DE VENTE" : "PERFORMANCE SHOPS";
  const locationDetail = merchant ? "Transactions par point de vente" : "Activations par shop";
  const total = Math.max(report.total, 1);
  const hostMax = report.agents[0]?.[1] ?? 1;
  const shopMax = report.shops[0]?.[1] ?? 1;
  const maxCampaign = Math.max(...fullDaily.map(([, value]) => value), ...fullTargetDaily.map(([, value]) => value), 1);
  const campaignPoints = fullDaily.map(([, value], index) => `${(index / Math.max(1, fullDaily.length - 1)) * 100},${100 - (value / maxCampaign) * 76}`).join(" ");
  const targetByDate = new Map(fullTargetDaily);
  const campaignTargetPoints = fullDaily.map(([date], index) => {
    const value = targetByDate.get(date) ?? 0;
    return `${(index / Math.max(1, fullDaily.length - 1)) * 100},${100 - (value / maxCampaign) * 76}`;
  }).join(" ");
  const selectedIndexes = fullDaily.map(([date], index) => date >= startDate && date <= endDate ? index : -1).filter((index) => index >= 0);
  const lastIndex = Math.max(1, fullDaily.length - 1);
  const firstSelected = selectedIndexes[0] ?? 0;
  const lastSelected = selectedIndexes.at(-1) ?? firstSelected;
  const selectionStart = (firstSelected / lastIndex) * 100;
  const selectionEnd = (lastSelected / lastIndex) * 100;
  const selectionMaskX = Math.max(-1, selectionStart - 1.5);
  const selectionMaskWidth = Math.min(102 - selectionMaskX, Math.max(2.5, selectionEnd - selectionStart + 3));
  const selectionCalloutX = Math.min(94, Math.max(6, selectionMaskX + selectionMaskWidth / 2));
  const periodComment = weeklyComment || customPeriodComment;
  const periodCommentLabel = weeklyComment ? "COMMENTAIRE HEBDOMADAIRE" : "COMMENTAIRE DE PÉRIODE · LOCAL";
  let donutCursor = 0;
  const exportXlsx = () => void exportExactSynthesisWorkbook(filtered, fullDaily, targetDaily, fullTargetDaily, rangeLabel, startDate, endDate, periodComment, periodCommentLabel, merchant ? terms : undefined);
  const exportPdf = () => void exportPdfFromHtml(startDate, endDate);

  useEffect(() => {
    if (previousRangeRef.current === rangeKey) return;
    previousRangeRef.current = rangeKey;
    setShowSelectionCallout(true);
    const timer = window.setTimeout(() => setShowSelectionCallout(false), 1180);
    return () => window.clearTimeout(timer);
  }, [rangeKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTextEntry = target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type !== "range") || (target instanceof HTMLElement && target.isContentEditable);
      if (isTextEntry || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "x") { event.preventDefault(); exportXlsx(); }
      if (key === "p") { event.preventDefault(); exportPdf(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtered, fullDaily, targetDaily, fullTargetDaily, rangeLabel, startDate, endDate]);

  return <div className="report-modal-backdrop" role="dialog" aria-modal="true" aria-label="Aperçu du rapport" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="report-modal">
      <header className="report-modal-header"><div className="report-header-copy"><h2>Exporter le rapport</h2><p>{formatNumber(filtered.length)} lignes · {rangeLabel}</p></div><div className="report-header-period orbit-export-period"><PeriodPicker data={data} startDate={startDate} endDate={endDate} recordLabel="lignes" onChange={onPeriodChange} /></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={18} /></button></header>
      <div className="report-paper" id="report-paper">
        <div className="report-paper-title"><h1>{reportTitle}</h1><p>Kinshasa — République Démocratique du Congo&nbsp;&nbsp;|&nbsp;&nbsp;Période {rangeLabel}&nbsp;&nbsp;|&nbsp;&nbsp;{report.days} jours d’activité</p></div>
        <section className="report-summary-grid">{reportKpis(report, merchant).map(({ label, value, decimals = 0, suffix = "", icon: Icon, progress }) => <div className={`report-kpi ${typeof progress === "number" ? "has-progress" : ""}`} key={label}><span className="report-kpi-icon" aria-hidden="true"><Icon size={132} strokeWidth={2.1} /></span><span>{label}</span>{typeof progress === "number" ? <span className="report-kpi-progress" aria-label={`${Math.round(progress)} % de l’objectif atteint`}><i style={{ width: `${progress}%` }} /><b><AnimatedNumber value={value} decimals={decimals} suffix={suffix} /></b></span> : <strong><AnimatedNumber value={value} decimals={decimals} suffix={suffix} /></strong>}</div>)}</section>
        <section className="report-top-grid">
          <div className="report-progress-block"><div className="report-section-heading"><span>PROGRESSION CAMPAGNE</span><strong>{reportMovement}</strong></div><div className="report-mini-line"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Progression et objectif sur toute la campagne"><defs><clipPath id={selectionMaskId} clipPathUnits="userSpaceOnUse"><motion.rect className="report-selection-mask" initial={false} animate={{ x: selectionMaskX, width: selectionMaskWidth }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }} y="-4" height="108" /></clipPath></defs><polyline points={campaignPoints} className="report-progress-base" /><polyline points={campaignTargetPoints} className="report-progress-target" /><polyline points={campaignPoints} className="report-progress-active" clipPath={`url(#${selectionMaskId})`} /></svg><motion.div className="report-selection-callout" initial={false} animate={{ left: `${selectionCalloutX}%`, opacity: showSelectionCallout ? 1 : 0, y: showSelectionCallout ? 0 : 5, scale: showSelectionCallout ? 1 : 0.96 }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}><small>Période sélectionnée</small><b>{formatDate(startDate)} → {formatDate(endDate)}</b></motion.div></div><div className="report-mini-axis"><span>{fullDaily[0] ? formatDate(fullDaily[0][0]) : "—"}</span><span>{fullDaily.at(-1) ? formatDate(fullDaily.at(-1)![0]) : "—"}</span></div><div className="report-target-comparison"><span><small>Réalisé</small><b><AnimatedNumber value={report.total} /></b></span><span><small>Objectif</small><b><AnimatedNumber value={report.target} /></b></span><span><small>Atteinte</small><b><AnimatedNumber value={Math.round(report.targetRate)} suffix=" %" /></b></span></div>{periodComment && <div className="report-progress-comment"><span>{periodCommentLabel}</span><p>{periodComment}</p></div>}</div>
          <div className="report-donut-block"><div className="report-section-heading"><span>RÉPARTITION</span><strong>{donutTitle}</strong></div><div className="report-donut-wrap"><div className="report-donut"><svg className="report-donut-svg" viewBox="0 0 220 220" aria-label={`Répartition des ${terms.records.toLowerCase()}`}><circle cx="110" cy="110" r="72" fill="none" stroke="#e5eaed" strokeWidth="40" />{report.parts.map((part) => { const share = (part.value / total) * 100; const start = donutCursor; donutCursor += share; return <circle key={part.label} className="report-donut-segment" cx="110" cy="110" r="72" fill="none" stroke={part.color} strokeWidth="40" strokeLinecap="butt" pathLength="100" style={{ strokeDasharray: `${share} ${100 - share}`, transform: `rotate(${start * 3.6 - 90}deg)` } as React.CSSProperties} />; })}</svg><div><AnimatedNumber value={report.total} /><small>total</small></div></div><div className="report-legend">{report.parts.map((part) => <span key={part.label}><i style={{ background: part.color }} />{part.label}<b><AnimatedNumber value={part.value} /></b><em>{safePct(part.value, report.total)}%</em></span>)}</div></div></div>
        </section>
        <section className="report-performance-grid"><div><div className="report-section-heading"><span>{participantPerformance}</span><strong>{participantDetail}</strong></div>{report.agents.slice(0, 6).map(([name, value]) => <div className="report-bar-row" key={name}><span>{name}</span><div><i style={{ width: `${(value / hostMax) * 100}%` }} /></div><b><AnimatedNumber value={value} /></b></div>)}</div><div><div className="report-section-heading"><span>{locationPerformance}</span><strong>{locationDetail}</strong></div>{report.shops.slice(0, 6).map(([name, value]) => <div className="report-bar-row shop-bar" key={name}><span>{name}</span><div><i style={{ width: `${(value / shopMax) * 100}%` }} /></div><b><AnimatedNumber value={value} /></b></div>)}</div></section>
      </div>
      <footer className="report-modal-footer"><span>Le rapport suit la période active et les données locales chargées.</span><div><button className="secondary-button" onClick={exportXlsx}><FileSpreadsheet size={16} /> Télécharger en Excel</button><button className="primary-button" onClick={exportPdf}><FileText size={16} /> Télécharger en PDF</button><button className="icon-button" onClick={() => window.print()} aria-label="Imprimer ou enregistrer en PDF"><Download size={17} /></button></div></footer>
    </div>
  </div>;
}
