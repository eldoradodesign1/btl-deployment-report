// Export Excel « nouvelle fabrication » : chaque chiffre est une formule.
// Les lignes brutes de la période vivent dans « Détail » (masqué si la partie est décochée),
// le calendrier et les listes dans « Sources » (masqué) ; les autres onglets ne font que les lire.
import * as XLSX from "xlsx-js-style";
import type { Activation } from "@/data/vodacomData";
import type { CampaignTerms } from "@/lib/campaigns";

export type ExportSections = { synthesis: boolean; progression: boolean; participants: boolean; locations: boolean; comment: boolean; targets: boolean; detail: boolean };

export type WorkbookInput = {
  filtered: Activation[];
  fullTargetDaily: [string, number][];
  startDate: string;
  endDate: string;
  rangeLabel: string;
  title: string;
  comment: string;
  commentLabel: string;
  terms: CampaignTerms;
  participantsLabel: string;
  sections: ExportSections;
};

const C = { ink: "142039", mute: "687896", teal: "18A59E", blue: "4A74E8", violet: "8A6CF0", line: "DCE3EE", pale: "F4F7FB", white: "FFFFFF" };
const border = { style: "thin", color: { rgb: C.line } };
const base = { font: { name: "Arial", sz: 10, color: { rgb: C.ink } }, alignment: { vertical: "center" }, border: { top: border, bottom: border, left: border, right: border } };
const S = {
  title: { font: { name: "Arial", sz: 15, bold: true, color: { rgb: C.ink } }, alignment: { vertical: "center" } },
  sub: { font: { name: "Arial", sz: 10, color: { rgb: C.mute } }, alignment: { vertical: "center" } },
  head: { ...base, font: { name: "Arial", sz: 9, bold: true, color: { rgb: C.white } }, fill: { fgColor: { rgb: C.ink } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } },
  text: base,
  label: { ...base, font: { name: "Arial", sz: 10, bold: true, color: { rgb: C.ink } } },
  int: { ...base, numFmt: "#,##0" },
  dec: { ...base, numFmt: "#,##0.0" },
  money: { ...base, numFmt: "#,##0.00" },
  pct: { ...base, numFmt: "0.0%" },
  date: { ...base, numFmt: "dd/mm/yyyy", alignment: { horizontal: "center", vertical: "center" } },
  total: { ...base, font: { name: "Arial", sz: 10, bold: true, color: { rgb: C.ink } }, fill: { fgColor: { rgb: C.pale } }, numFmt: "#,##0" },
  totalDec: { ...base, font: { name: "Arial", sz: 10, bold: true, color: { rgb: C.ink } }, fill: { fgColor: { rgb: C.pale } }, numFmt: "#,##0.0" },
  totalPct: { ...base, font: { name: "Arial", sz: 10, bold: true, color: { rgb: C.ink } }, fill: { fgColor: { rgb: C.pale } }, numFmt: "0.0%" },
  comment: { font: { name: "Arial", sz: 10, color: { rgb: C.ink } }, fill: { fgColor: { rgb: C.pale } }, alignment: { vertical: "top", wrapText: true } },
  section: { font: { name: "Arial", sz: 9, bold: true, color: { rgb: C.teal } }, alignment: { vertical: "center" } },
};

type Sheet = Record<string, any>;
const ref = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });
const col = (c: number) => XLSX.utils.encode_col(c);
const put = (sheet: Sheet, r: number, c: number, v: string | number, s: object) => { sheet[ref(r, c)] = { v, t: typeof v === "number" ? "n" : "s", s }; };
const fx = (sheet: Sheet, r: number, c: number, f: string, v: number, s: object) => { sheet[ref(r, c)] = { f, v: Number.isFinite(v) ? v : 0, t: "n", s }; };
const finish = (sheet: Sheet, rows: number, cols: number, widths: number[]) => { sheet["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, rows - 1), c: Math.max(0, cols - 1) } }); sheet["!cols"] = widths.map((wch) => ({ wch })); return sheet; };
const ratio = (value: number, total: number) => total ? value / total : 0;

/** Numéro de série Excel (calendrier 1900) d'une date ISO, sans fuseau horaire. */
export const excelSerial = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; };
const addDays = (iso: string, days: number) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10); };
const mondayOf = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return addDays(iso, -((day + 6) % 7)); };

export function periodDays(startDate: string, endDate: string) { const days: string[] = []; for (let day = startDate; day <= endDate && days.length < 3700; day = addDays(day, 1)) days.push(day); return days; }

const ranked = (rows: Activation[], pick: (row: Activation) => string) => { const map = new Map<string, number>(); rows.forEach((row) => { const key = pick(row) || "—"; map.set(key, (map.get(key) ?? 0) + 1); }); return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")); };

/** Fabrique le classeur (sans le télécharger) : utilisé par l'appli et par les vérifications en Node. */
export function buildReportWorkbookV2(input: WorkbookInput) {
  const { filtered, sections, terms } = input;
  const merchant = terms.record === "transaction";
  const records = terms.records;
  const participant = merchant ? terms.participant : "Hôtesse";
  const location = terms.location;
  const activeLabel = merchant ? `${input.participantsLabel} actifs` : `${input.participantsLabel} actives`;
  const rows = [...filtered].sort((a, b) => a.d.localeCompare(b.d));
  const days = periodDays(input.startDate, input.endDate);
  const targetByDate = new Map(input.fullTargetDaily);
  const dailyDone = new Map<string, number>(); rows.forEach((row) => dailyDone.set(row.d, (dailyDone.get(row.d) ?? 0) + 1));
  const participants = ranked(rows, (row) => row.a);
  const locations = ranked(rows, (row) => row.s);
  const types = ranked(rows, (row) => row.t);
  const amountOf = (row: Activation) => Number(row.merchant?.amount ?? 0);

  // Valeurs calculées ici uniquement pour le cache des formules (affichage avant recalcul).
  const total = rows.length;
  const activeDays = days.filter((day) => (dailyDone.get(day) ?? 0) > 0).length;
  const target = days.reduce((sum, day) => sum + (targetByDate.get(day) ?? 0), 0);
  const amount = rows.reduce((sum, row) => sum + amountOf(row), 0);
  const average = ratio(total, activeDays);

  const workbook = XLSX.utils.book_new();
  const hidden: string[] = [];

  // ── Détail : les lignes brutes de la période (source de toutes les formules).
  const detail: Sheet = {};
  const detailHeaders = ["N°", "Date", participant, location, "Catégorie", merchant ? "Type de transaction" : "Type d’action", "Client", ...(merchant ? ["Montant"] : [])];
  detailHeaders.forEach((label, c) => put(detail, 0, c, label, S.head));
  rows.forEach((row, index) => {
    const r = index + 1;
    put(detail, r, 0, r, S.int); put(detail, r, 1, excelSerial(row.d), S.date); put(detail, r, 2, row.a || "—", S.text); put(detail, r, 3, row.s || "—", S.text);
    put(detail, r, 4, row.c ?? "", S.text); put(detail, r, 5, row.t ?? "", S.text); put(detail, r, 6, row.n || row.cl || "", S.text);
    if (merchant) put(detail, r, 7, amountOf(row), S.money);
  });
  finish(detail, rows.length + 1, detailHeaders.length, [7, 12, 28, 30, 16, 24, 20, 14]);
  detail["!autofilter"] = { ref: `A1:${col(detailHeaders.length - 1)}${Math.max(2, rows.length + 1)}` };
  const last = Math.max(2, rows.length + 1);
  const D = (letter: string) => `'Détail'!$${letter}$2:$${letter}$${last}`;

  // ── Sources : paramètres, calendrier (objectif brut + réalisé en formule) et listes.
  const src: Sheet = {};
  const P = { start: 1, end: 2, total: 3, days: 4, target: 5, participants: 6, locations: 7, amount: 8 };
  const sv = (key: keyof typeof P) => `Sources!$B$${P[key] + 1}`;
  put(src, 0, 0, "Paramètre", S.head); put(src, 0, 1, "Valeur", S.head);
  put(src, P.start, 0, "Début de période", S.label); put(src, P.start, 1, excelSerial(input.startDate), S.date);
  put(src, P.end, 0, "Fin de période", S.label); put(src, P.end, 1, excelSerial(input.endDate), S.date);
  const dayRows = Math.max(1, days.length);
  const dayRange = (letter: string) => `Sources!$${letter}$2:$${letter}$${dayRows + 1}`;
  const partRows = Math.max(1, participants.length);
  const locRows = Math.max(1, locations.length);
  put(src, P.total, 0, `Total ${records.toLowerCase()}`, S.label); fx(src, P.total, 1, `COUNT(${D("B")})`, total, S.int);
  put(src, P.days, 0, "Jours d’activité", S.label); fx(src, P.days, 1, `COUNTIF(${dayRange("F")},">0")`, activeDays, S.int);
  put(src, P.target, 0, "Objectif de la période", S.label); fx(src, P.target, 1, `SUM(${dayRange("E")})`, target, S.int);
  put(src, P.participants, 0, activeLabel, S.label); fx(src, P.participants, 1, `COUNTIF(Sources!$I$2:$I$${partRows + 1},">0")`, participants.length, S.int);
  put(src, P.locations, 0, `${terms.locations} couverts`, S.label); fx(src, P.locations, 1, `COUNTIF(Sources!$L$2:$L$${locRows + 1},">0")`, locations.length, S.int);
  if (merchant) { put(src, P.amount, 0, "Montant des transactions", S.label); fx(src, P.amount, 1, `SUM(${D("H")})`, amount, S.money); }
  ["Date", "Objectif (brut)", "Réalisé"].forEach((label, i) => put(src, 0, 3 + i, label, S.head));
  days.forEach((day, index) => { const r = index + 1; put(src, r, 3, excelSerial(day), S.date); put(src, r, 4, targetByDate.get(day) ?? 0, S.int); fx(src, r, 5, `COUNTIF(${D("B")},D${r + 1})`, dailyDone.get(day) ?? 0, S.int); });
  [participant, records].forEach((label, i) => put(src, 0, 7 + i, label, S.head));
  participants.forEach(([name, value], index) => { const r = index + 1; put(src, r, 7, name, S.text); fx(src, r, 8, `COUNTIF(${D("C")},H${r + 1})`, value, S.int); });
  [location, records].forEach((label, i) => put(src, 0, 10 + i, label, S.head));
  locations.forEach(([name, value], index) => { const r = index + 1; put(src, r, 10, name, S.text); fx(src, r, 11, `COUNTIF(${D("D")},K${r + 1})`, value, S.int); });
  finish(src, Math.max(P.amount + 1, days.length + 1, participants.length + 1, locations.length + 1), 12, [26, 16, 2, 12, 14, 10, 2, 28, 12, 2, 30, 12]);

  const totalRef = sv("total");
  const daysRef = sv("days");
  const targetRef = sv("target");
  const hasComment = sections.comment && input.comment.trim().length > 0;

  // ── Synthèse
  if (sections.synthesis) {
    const sheet: Sheet = {};
    put(sheet, 0, 0, input.title, S.title);
    put(sheet, 1, 0, `Kinshasa — République Démocratique du Congo · ${input.rangeLabel}`, S.sub);
    let r = 3;
    put(sheet, r, 0, "SYNTHÈSE", S.section); r += 1;
    ["Indicateur", "Valeur", "Part / précision"].forEach((label, c) => put(sheet, r, c, label, S.head)); r += 1;
    const totalRow = r + 1;
    put(sheet, r, 0, `Total ${records.toLowerCase()}`, S.label); fx(sheet, r, 1, totalRef, total, S.int); put(sheet, r, 2, "", S.text); r += 1;
    if (merchant) { put(sheet, r, 0, "Montant des transactions", S.label); fx(sheet, r, 1, sv("amount"), amount, S.money); put(sheet, r, 2, "", S.text); r += 1; }
    types.forEach(([type, value]) => {
      put(sheet, r, 0, type, S.text);
      fx(sheet, r, 1, `COUNTIF(${D("F")},"${type.replace(/"/g, '""')}")`, value, S.int);
      fx(sheet, r, 2, `IFERROR(B${r + 1}/$B$${totalRow},0)`, ratio(value, total), S.pct); r += 1;
    });
    const partRow = r + 1;
    put(sheet, r, 0, activeLabel, S.label); fx(sheet, r, 1, sv("participants"), participants.length, S.int); put(sheet, r, 2, "", S.text); r += 1;
    put(sheet, r, 0, `${terms.locations} couverts`, S.label); fx(sheet, r, 1, sv("locations"), locations.length, S.int); put(sheet, r, 2, "", S.text); r += 1;
    const daysRow = r + 1;
    put(sheet, r, 0, "Jours d’activité", S.label); fx(sheet, r, 1, daysRef, activeDays, S.int); put(sheet, r, 2, "", S.text); r += 1;
    const avgRow = r + 1;
    put(sheet, r, 0, "Moyenne / jour", S.label); fx(sheet, r, 1, `IFERROR(B${totalRow}/B${daysRow},0)`, average, S.dec); put(sheet, r, 2, "", S.text); r += 1;
    put(sheet, r, 0, `Moyenne / ${participant.toLowerCase()} / jour`, S.label); fx(sheet, r, 1, `IFERROR(B${avgRow}/B${partRow},0)`, ratio(average, participants.length), S.dec); put(sheet, r, 2, "", S.text); r += 1;
    if (sections.targets) {
      const targetRow = r + 1;
      put(sheet, r, 0, "Objectif de la période", S.label); fx(sheet, r, 1, targetRef, target, S.int); put(sheet, r, 2, "", S.text); r += 1;
      put(sheet, r, 0, "Atteinte de l’objectif", S.label); fx(sheet, r, 1, `IFERROR(B${totalRow}/B${targetRow},0)`, ratio(total, target), S.pct); put(sheet, r, 2, "", S.text); r += 1;
      put(sheet, r, 0, "Écart réalisé / objectif", S.label); fx(sheet, r, 1, `B${totalRow}-B${targetRow}`, total - target, S.int); put(sheet, r, 2, "", S.text); r += 1;
    }
    if (hasComment) {
      r += 1; put(sheet, r, 0, input.commentLabel, S.section); r += 1;
      put(sheet, r, 0, input.comment, S.comment); put(sheet, r, 1, "", S.comment); put(sheet, r, 2, "", S.comment);
      sheet["!merges"] = [{ s: { r, c: 0 }, e: { r, c: 2 } }];
      sheet["!rows"] = Array.from({ length: r + 1 }, (_, i) => (i === r ? { hpt: Math.min(400, 16 * Math.ceil(input.comment.length / 80) + 10) } : {}));
      r += 1;
    }
    finish(sheet, r, 3, [36, 16, 18]);
    sheet["!views"] = [{ showGridLines: false }];
    XLSX.utils.book_append_sheet(workbook, sheet, "Synthèse");
  }

  // ── Progression : réalisé jour par jour et cumuls.
  if (sections.progression) {
    const sheet: Sheet = {};
    const headers = ["Date", "Réalisé", "Cumul réalisé", ...(sections.targets ? ["Objectif", "Cumul objectif", "Écart du jour", "Atteinte cumulée"] : [])];
    headers.forEach((label, c) => put(sheet, 0, c, label, S.head));
    let cumul = 0; let cumulTarget = 0;
    days.forEach((day, index) => {
      const r = index + 1; const x = r + 1; const value = dailyDone.get(day) ?? 0; const dayTarget = targetByDate.get(day) ?? 0;
      cumul += value; cumulTarget += dayTarget;
      fx(sheet, r, 0, `Sources!D${x}`, excelSerial(day), S.date);
      fx(sheet, r, 1, `Sources!F${x}`, value, S.int);
      fx(sheet, r, 2, index === 0 ? `B${x}` : `C${x - 1}+B${x}`, cumul, S.int);
      if (sections.targets) {
        fx(sheet, r, 3, `Sources!E${x}`, dayTarget, S.int);
        fx(sheet, r, 4, index === 0 ? `D${x}` : `E${x - 1}+D${x}`, cumulTarget, S.int);
        fx(sheet, r, 5, `B${x}-D${x}`, value - dayTarget, S.int);
        fx(sheet, r, 6, `IFERROR(C${x}/E${x},0)`, ratio(cumul, cumulTarget), S.pct);
      }
    });
    const end = days.length + 1; const t = end; const tx = t + 1;
    put(sheet, t, 0, "Total", S.total);
    fx(sheet, t, 1, `SUM(B2:B${end})`, total, S.total);
    put(sheet, t, 2, "", S.total);
    put(sheet, t + 1, 0, "Moyenne / jour actif", S.total);
    fx(sheet, t + 1, 1, `IFERROR(AVERAGEIF(B2:B${end},">0"),0)`, average, S.totalDec);
    put(sheet, t + 1, 2, "", S.total);
    if (sections.targets) {
      fx(sheet, t, 3, `SUM(D2:D${end})`, target, S.total); put(sheet, t, 4, "", S.total); fx(sheet, t, 5, `B${tx}-D${tx}`, total - target, S.total); fx(sheet, t, 6, `IFERROR(B${tx}/D${tx},0)`, ratio(total, target), S.totalPct);
      [3, 4, 5, 6].forEach((c) => put(sheet, t + 1, c, "", S.total));
    }
    finish(sheet, t + 2, headers.length, [20, 12, 15, 12, 15, 14, 17]);
    sheet["!autofilter"] = { ref: `A1:${col(headers.length - 1)}${end}` };
    XLSX.utils.book_append_sheet(workbook, sheet, "Progression");
  }

  // ── Classements par hôtesse/ambassadeur et par shop/point de vente.
  const rankingSheet = (list: [string, number][], keyLetter: "C" | "D", name: string) => {
    const sheet: Sheet = {};
    const headers = ["Rang", name, records, "Part", "Moyenne / jour actif", ...(merchant ? ["Montant"] : [])];
    headers.forEach((label, c) => put(sheet, 0, c, label, S.head));
    const end = list.length + 1;
    list.forEach(([label, value], index) => {
      const r = index + 1; const x = r + 1;
      fx(sheet, r, 0, `RANK(C${x},$C$2:$C$${end})`, 1 + list.filter(([, other]) => other > value).length, S.int);
      put(sheet, r, 1, label, S.text);
      fx(sheet, r, 2, `COUNTIF(${D(keyLetter)},B${x})`, value, S.int);
      fx(sheet, r, 3, `IFERROR(C${x}/${totalRef},0)`, ratio(value, total), S.pct);
      fx(sheet, r, 4, `IFERROR(C${x}/${daysRef},0)`, ratio(value, activeDays), S.dec);
      if (merchant) fx(sheet, r, 5, `SUMIF(${D(keyLetter)},B${x},${D("H")})`, rows.filter((row) => (keyLetter === "C" ? row.a : row.s) === label).reduce((sum, row) => sum + amountOf(row), 0), S.money);
    });
    const t = end; const tx = t + 1;
    put(sheet, t, 0, "", S.total); put(sheet, t, 1, "Total", S.total);
    fx(sheet, t, 2, `SUM(C2:C${end})`, total, S.total);
    fx(sheet, t, 3, `SUM(D2:D${end})`, list.length ? 1 : 0, S.totalPct);
    fx(sheet, t, 4, `IFERROR(C${tx}/${daysRef},0)`, average, S.totalDec);
    if (merchant) fx(sheet, t, 5, `SUM(F2:F${end})`, amount, { ...S.total, numFmt: "#,##0.00" });
    finish(sheet, t + 1, headers.length, [7, 32, 13, 10, 18, 14]);
    sheet["!autofilter"] = { ref: `A1:${col(headers.length - 1)}${end}` };
    return sheet;
  };
  if (sections.participants) XLSX.utils.book_append_sheet(workbook, rankingSheet(participants, "C", participant), input.participantsLabel.slice(0, 31));
  if (sections.locations) XLSX.utils.book_append_sheet(workbook, rankingSheet(locations, "D", location), terms.locations.slice(0, 31));

  // ── Objectifs : semaine par semaine, atteinte et cumuls.
  if (sections.targets) {
    const sheet: Sheet = {};
    const weeks: { start: string; end: string }[] = [];
    days.forEach((day) => { const monday = mondayOf(day); const current = weeks.at(-1); if (current && mondayOf(current.start) === monday) current.end = day; else weeks.push({ start: day, end: day }); });
    const headers = ["Du", "Au", "Réalisé", "Objectif", "Atteinte", "Écart", "Cumul réalisé", "Cumul objectif", "Atteinte cumulée"];
    headers.forEach((label, c) => put(sheet, 0, c, label, S.head));
    let cumul = 0; let cumulTarget = 0;
    weeks.forEach((week, index) => {
      const r = index + 1; const x = r + 1;
      const weekDays = days.filter((day) => day >= week.start && day <= week.end);
      const done = weekDays.reduce((sum, day) => sum + (dailyDone.get(day) ?? 0), 0);
      const goal = weekDays.reduce((sum, day) => sum + (targetByDate.get(day) ?? 0), 0);
      cumul += done; cumulTarget += goal;
      put(sheet, r, 0, excelSerial(week.start), S.date); put(sheet, r, 1, excelSerial(week.end), S.date);
      fx(sheet, r, 2, `SUMIFS(${dayRange("F")},${dayRange("D")},">="&A${x},${dayRange("D")},"<="&B${x})`, done, S.int);
      fx(sheet, r, 3, `SUMIFS(${dayRange("E")},${dayRange("D")},">="&A${x},${dayRange("D")},"<="&B${x})`, goal, S.int);
      fx(sheet, r, 4, `IFERROR(C${x}/D${x},0)`, ratio(done, goal), S.pct);
      fx(sheet, r, 5, `C${x}-D${x}`, done - goal, S.int);
      fx(sheet, r, 6, index === 0 ? `C${x}` : `G${x - 1}+C${x}`, cumul, S.int);
      fx(sheet, r, 7, index === 0 ? `D${x}` : `H${x - 1}+D${x}`, cumulTarget, S.int);
      fx(sheet, r, 8, `IFERROR(G${x}/H${x},0)`, ratio(cumul, cumulTarget), S.pct);
    });
    const end = weeks.length + 1; const t = end; const tx = t + 1;
    put(sheet, t, 0, "Période", S.total); put(sheet, t, 1, "", S.total);
    fx(sheet, t, 2, `SUM(C2:C${end})`, total, S.total);
    fx(sheet, t, 3, `SUM(D2:D${end})`, target, S.total);
    fx(sheet, t, 4, `IFERROR(C${tx}/D${tx},0)`, ratio(total, target), S.totalPct);
    fx(sheet, t, 5, `C${tx}-D${tx}`, total - target, S.total);
    [6, 7, 8].forEach((c) => put(sheet, t, c, "", S.total));
    finish(sheet, t + 1, headers.length, [12, 12, 11, 11, 11, 10, 14, 14, 16]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Objectifs");
  }

  // Commentaire seul lorsqu'il n'y a pas de Synthèse pour le porter.
  if (hasComment && !sections.synthesis) {
    const sheet: Sheet = {};
    put(sheet, 0, 0, input.commentLabel, S.section);
    put(sheet, 1, 0, input.comment, S.comment);
    finish(sheet, 2, 1, [100]);
    sheet["!rows"] = [{}, { hpt: Math.min(400, 16 * Math.ceil(input.comment.length / 110) + 10) }];
    XLSX.utils.book_append_sheet(workbook, sheet, "Commentaire");
  }

  XLSX.utils.book_append_sheet(workbook, detail, "Détail");
  if (!sections.detail) hidden.push("Détail");
  XLSX.utils.book_append_sheet(workbook, src, "Sources");
  hidden.push("Sources");
  workbook.Workbook = { Sheets: workbook.SheetNames.map((name: string) => ({ name, Hidden: hidden.includes(name) ? 1 : 0 })), Views: [{ RTL: false }] };
  return workbook;
}

export function exportReportWorkbookV2(input: WorkbookInput) {
  const workbook = buildReportWorkbookV2(input);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rapport-activite-${input.startDate}-${input.endDate}.xlsx`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
