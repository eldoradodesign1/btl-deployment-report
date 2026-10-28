// Design philosophy: Halo Opaline outside Excel; inside the workbook the Synthèse is a stable red-and-white meeting report with native charts and explicit target context.
import * as XLSX from "xlsx-js-style";
import JSZip from "jszip";
import type { Activation } from "@/data/vodacomData";
import type { CampaignTerms } from "@/lib/campaigns";

const COLORS = { red: "ED0808", redDark: "B90A0A", blue: "3574BC", coral: "D85D52", green: "86B94C", teal: "23999C", ink: "26323D", muted: "66737E", pale: "F4F6F7", border: "D8E0E5", white: "FFFFFF", panel: "FFFFFF", chartGray: "A8AFB3", target: "D3871C" };
const byKey = (rows: Activation[], key: "a" | "s") => { const map = new Map<string, number>(); rows.forEach((row) => map.set(row[key], (map.get(row[key]) ?? 0) + 1)); return Array.from(map.entries()).sort((left, right) => right[1] - left[1]); };
const amountByKey = (rows: Activation[], key: "a" | "s") => { const map = new Map<string, number>(); rows.forEach((row) => map.set(row[key], (map.get(row[key]) ?? 0) + Number(row.merchant?.amount ?? 0))); return map; };
const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cell = (row: number, col: number) => XLSX.utils.encode_cell({ r: row, c: col });
const cssColor = (value: string) => value.startsWith("#") ? value : `#${value}`;

const font = { name: "Arial", sz: 10, color: { rgb: COLORS.ink } };
const titleStyle = { font: { name: "Arial", sz: 16, bold: true, color: { rgb: COLORS.white } }, fill: { fgColor: { rgb: COLORS.red } }, alignment: { horizontal: "left", vertical: "center" } };
const contextStyle = { font: { name: "Arial", sz: 9, color: { rgb: COLORS.muted } }, fill: { fgColor: { rgb: COLORS.pale } }, alignment: { horizontal: "left", vertical: "center" } };
const panelStyle = { fill: { fgColor: { rgb: COLORS.panel } }, border: { left: { style: "thin", color: { rgb: COLORS.border } }, right: { style: "thin", color: { rgb: COLORS.border } }, top: { style: "thin", color: { rgb: COLORS.border } }, bottom: { style: "thin", color: { rgb: COLORS.border } } } };
const kpiLabelStyle = { ...panelStyle, font: { name: "Arial", sz: 8, bold: true, color: { rgb: COLORS.muted } }, alignment: { horizontal: "center", vertical: "center" }, border: { ...panelStyle.border, top: { style: "medium", color: { rgb: COLORS.red } } } };
const kpiValueStyle = { ...panelStyle, font: { name: "Arial", sz: 17, bold: true, color: { rgb: COLORS.redDark } }, alignment: { horizontal: "center", vertical: "center" }, numFmt: "0.0" };
const targetKpiValueStyle = { ...kpiValueStyle, font: { name: "Arial", sz: 17, bold: true, color: { rgb: COLORS.target } } };
const whiteCell = { ...panelStyle, font, alignment: { vertical: "center", wrapText: true } };
const headerStyle = { font: { name: "Arial", sz: 9, bold: true, color: { rgb: COLORS.white } }, fill: { fgColor: { rgb: COLORS.blue } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
const altCell = { ...whiteCell, fill: { fgColor: { rgb: "FAFBFC" } } };

function rangeStyle(sheet: any, r1: number, r2: number, c1: number, c2: number, style: any) { for (let r = r1; r <= r2; r += 1) for (let c = c1; c <= c2; c += 1) { const ref = cell(r, c); if (!sheet[ref]) sheet[ref] = { v: "", t: "s" }; sheet[ref].s = style; } }
function merge(sheet: any, r1: number, c1: number, r2: number, c2: number) { sheet["!merges"] = [...(sheet["!merges"] ?? []), { s: { r: r1, c: c1 }, e: { r: r2, c: c2 } }]; }
function set(sheet: any, row: number, col: number, value: string | number | null, style: any) { const ref = cell(row, col); sheet[ref] = { v: value ?? "", t: typeof value === "number" ? "n" : "s", s: style }; }
function setFormula(sheet: any, row: number, col: number, formula: string, cachedValue: number) { const ref = cell(row, col); sheet[ref] = { ...(sheet[ref] ?? {}), f: formula, v: cachedValue, t: "n" }; }
function tableSheet(headers: string[], rows: (string | number | null)[][], widths: number[], color = COLORS.blue) { const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]); sheet["!cols"] = widths.map((wch) => ({ wch })); sheet["!rows"] = [{ hpt: 28 }]; sheet["!freeze"] = { xSplit: 0, ySplit: 1 }; sheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}${rows.length + 1}` }; rangeStyle(sheet, 0, 0, 0, headers.length - 1, { ...headerStyle, fill: { fgColor: { rgb: color } } }); rangeStyle(sheet, 1, rows.length, 0, headers.length - 1, whiteCell); for (let row = 1; row <= rows.length; row += 1) if (row % 2 === 0) rangeStyle(sheet, row, row, 0, headers.length - 1, altCell); return sheet; }

function titleXml(title: string) { return `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="fr-FR" sz="1050" b="1"/><a:t>${esc(title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`; }
const safeFormula = (formula: string) => formula.replace(/(^|[^A-Za-z])Synthèse!/g, "$1'Synthèse'!");
function strRef(formula: string, values: string[]) { return `<c:strRef><c:f>${esc(safeFormula(formula))}</c:f><c:strCache><c:ptCount val="${values.length}"/>${values.map((value, index) => `<c:pt idx="${index}"><c:v>${esc(value)}</c:v></c:pt>`).join("")}</c:strCache></c:strRef>`; }
function numRef(formula: string, values: (number | null)[]) { return `<c:numRef><c:f>${esc(safeFormula(formula))}</c:f><c:numCache><c:formatCode>0</c:formatCode><c:ptCount val="${values.length}"/>${values.map((value, index) => value === null ? "" : `<c:pt idx="${index}"><c:v>${value}</c:v></c:pt>`).join("")}</c:numCache></c:numRef>`; }
function series(name: string, index: number, categoriesFormula: string, categories: string[], valuesFormula: string, values: (number | null)[], color: string, smooth = false) { return `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:v>${esc(name)}</c:v></c:tx><c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln w="28575"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr>${smooth ? `<c:marker><c:symbol val="none"/></c:marker>` : ""}<c:cat>${strRef(categoriesFormula, categories)}</c:cat><c:val>${numRef(valuesFormula, values)}</c:val>${smooth ? `<c:smooth val="1"/>` : ""}</c:ser>`; }
function chartSpace(chart: string) { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="fr-FR"/><c:roundedCorners val="0"/><c:style val="10"/><c:chart>${chart}</c:chart><c:printSettings><c:headerFooter/><c:pageMargins b="0.75" l="0.7" r="0.7" t="0.75" header="0.3" footer="0.3"/><c:pageSetup/></c:printSettings></c:chartSpace>`; }
function axes() { return `<c:catAx><c:axId val="100"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="low"/><c:crossAx val="101"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:catAx><c:valAx><c:axId val="101"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:numFmt formatCode="0" sourceLinked="1"/><c:tickLblPos val="nextTo"/><c:crossAx val="100"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:valAx>`; }
function lineChart(title: string, categoriesFormula: string, categories: string[], fullFormula: string, fullValues: number[], activeFormula: string, activeValues: (number | null)[], targetFormula: string, targetValues: number[]) { return chartSpace(`${titleXml(title)}<c:plotArea><c:layout/><c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series("Campagne complète", 0, categoriesFormula, categories, fullFormula, fullValues, COLORS.chartGray, true)}${series("Période sélectionnée", 1, categoriesFormula, categories, activeFormula, activeValues, COLORS.red, true)}${series("Objectif journalier", 2, categoriesFormula, categories, targetFormula, targetValues, COLORS.target, true)}<c:marker><c:symbol val="none"/></c:marker><c:smooth val="1"/><c:axId val="100"/><c:axId val="101"/></c:lineChart>${axes()}</c:plotArea><c:plotVisOnly val="1"/>`); }
function doughnutChart(title: string, categoriesFormula: string, categories: string[], valuesFormula: string, values: number[]) { const colors = [COLORS.blue, COLORS.coral, COLORS.green]; const dataPoints = colors.map((color, index) => `<c:dPt><c:idx val="${index}"/><c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></c:spPr></c:dPt>`).join(""); return chartSpace(`${titleXml(title)}<c:plotArea><c:layout/><c:doughnutChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/><c:cat>${strRef(categoriesFormula, categories)}</c:cat><c:val>${numRef(valuesFormula, values)}</c:val>${dataPoints}<c:dLbls><c:showLegendKey val="1"/><c:showVal val="1"/><c:showPercent val="1"/><c:showLeaderLines val="1"/></c:dLbls></c:ser><c:firstSliceAng val="270"/><c:holeSize val="62"/></c:doughnutChart><c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend></c:plotArea><c:plotVisOnly val="1"/>`); }
function barChart(title: string, categoriesFormula: string, categories: string[], valuesFormula: string, values: number[], color: string) { return chartSpace(`${titleXml(title)}<c:plotArea><c:layout/><c:barChart><c:barDir val="bar"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series("Activations", 0, categoriesFormula, categories, valuesFormula, values, color)}<c:gapWidth val="45"/><c:axId val="200"/><c:axId val="201"/></c:barChart><c:catAx><c:axId val="200"/><c:scaling><c:orientation val="maxMin"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:tickLblPos val="low"/><c:crossAx val="201"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="201"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:majorGridlines/><c:numFmt formatCode="0" sourceLinked="1"/><c:crossAx val="200"/><c:crosses val="autoZero"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/>`); }
function anchor(relId: number, name: string, col: number, row: number, cx: number, cy: number) { return `<oneCellAnchor><from><col>${col}</col><colOff>0</colOff><row>${row}</row><rowOff>0</rowOff></from><ext cx="${cx}" cy="${cy}"/><graphicFrame><nvGraphicFramePr><cNvPr id="${relId}" name="${name}"/><cNvGraphicFramePr/></nvGraphicFramePr><xfrm/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${relId}"/></a:graphicData></a:graphic></graphicFrame><clientData/></oneCellAnchor>`; }

type ExportImage = { name: string; base64: string; col: number; row: number; width: number; height: number };

function imageAnchor(relId: number, name: string, col: number, row: number, cx: number, cy: number) {
  return `<oneCellAnchor><from><col>${col}</col><colOff>0</colOff><row>${row}</row><rowOff>0</rowOff></from><ext cx="${cx}" cy="${cy}"/><pic><nvPicPr><cNvPr id="${relId}" name="${esc(name)}" descr="${esc(name)}"/><cNvPicPr/></nvPicPr><blipFill><a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" cstate="print" r:embed="rId${relId}"/><a:stretch xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:fillRect/></a:stretch></blipFill><spPr><a:prstGeom xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" prst="rect"/><a:ln xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:noFill/></a:ln></spPr></pic><clientData/></oneCellAnchor>`;
}

function chartCanvas(width: number, height: number) {
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d")!;
  context.scale(scale, scale);
  context.fillStyle = cssColor(COLORS.white);
  context.fillRect(0, 0, width, height);
  return { canvas, context };
}

function encodedCanvas(canvas: HTMLCanvasElement) { return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""); }

function drawLineImage(fullDaily: [string, number][], targetByDate: Map<string, number>, startDate: string, endDate: string) {
  const width = 640; const height = 190; const { canvas, context } = chartCanvas(width, height); const left = 40; const right = 14; const top = 18; const bottom = 28;
  const maximum = Math.max(...fullDaily.map(([, value]) => value), ...fullDaily.map(([date]) => targetByDate.get(date) ?? 0), 1);
  const point = (index: number, value: number) => ({ x: left + index / Math.max(1, fullDaily.length - 1) * (width - left - right), y: top + (1 - value / maximum) * (height - top - bottom) });
  context.strokeStyle = "#e0e5e8"; context.lineWidth = 1;
  [0, .5, 1].forEach((ratio) => { const y = top + ratio * (height - top - bottom); context.beginPath(); context.moveTo(left, y); context.lineTo(width - right, y); context.stroke(); });
  const drawSeries = (values: number[], color: string, dashed = false) => { context.save(); context.strokeStyle = color; context.lineWidth = dashed ? 1.8 : 2.4; if (dashed) context.setLineDash([5, 4]); context.beginPath(); values.forEach((value, index) => { const p = point(index, value); if (index === 0) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y); }); context.stroke(); context.restore(); };
  drawSeries(fullDaily.map(([, value]) => value), "#9daab3");
  drawSeries(fullDaily.map(([date]) => targetByDate.get(date) ?? 0), "#d3871c", true);
  const selected = fullDaily.map(([date, value]) => date >= startDate && date <= endDate ? value : null);
  context.save(); context.strokeStyle = COLORS.red; context.lineWidth = 2.6; context.beginPath(); selected.forEach((value, index) => { if (value === null) { context.stroke(); context.beginPath(); return; } const p = point(index, value); if (index === 0 || selected[index - 1] === null) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y); }); context.stroke(); context.restore();
  context.fillStyle = cssColor(COLORS.muted); context.font = "10px Arial"; context.fillText(fullDaily[0]?.[0] ?? "", left, height - 8); const finalDate = fullDaily.at(-1)?.[0] ?? ""; context.fillText(finalDate, Math.max(left, width - right - context.measureText(finalDate).width), height - 8);
  return encodedCanvas(canvas);
}

function drawDonutImage(parts: { label: string; value: number; color: string }[]) {
  const width = 390; const height = 190; const { canvas, context } = chartCanvas(width, height); const total = Math.max(1, parts.reduce((sum, part) => sum + part.value, 0)); const cx = 92; const cy = 94; const radius = 51;
  let start = -Math.PI / 2;
  parts.forEach((part) => { const end = start + (part.value / total) * Math.PI * 2; context.beginPath(); context.strokeStyle = cssColor(part.color); context.lineWidth = 28; context.arc(cx, cy, radius, start, end); context.stroke(); start = end; });
  context.fillStyle = cssColor(COLORS.ink); context.font = "700 20px Arial"; const label = String(total); context.fillText(label, cx - context.measureText(label).width / 2, cy + 7); context.font = "9px Arial"; context.fillStyle = cssColor(COLORS.muted); context.fillText("total", cx - context.measureText("total").width / 2, cy + 21);
  context.font = "10px Arial"; parts.forEach((part, index) => { const y = 55 + index * 34; context.fillStyle = cssColor(part.color); context.fillRect(176, y - 8, 9, 9); context.fillStyle = cssColor(COLORS.ink); context.fillText(part.label, 192, y); context.fillStyle = cssColor(COLORS.muted); const value = String(part.value); context.fillText(value, 360 - context.measureText(value).width, y); });
  return encodedCanvas(canvas);
}

function drawBarImage(title: string, rows: [string, number][], color: string) {
  const width = 600; const height = 286; const { canvas, context } = chartCanvas(width, height); const left = 170; const right = 36; const top = 38; const rowHeight = 34; const max = Math.max(...rows.map(([, value]) => value), 1);
  context.fillStyle = cssColor(COLORS.ink); context.font = "700 13px Arial"; context.fillText(title, 16, 20);
  rows.forEach(([name, value], index) => { const y = top + index * rowHeight; context.fillStyle = cssColor(COLORS.muted); context.font = "10px Arial"; context.fillText(name.length > 27 ? `${name.slice(0, 26)}…` : name, 16, y + 12); context.fillStyle = "#e5eaed"; context.fillRect(left, y + 4, width - left - right, 10); context.fillStyle = cssColor(color); context.fillRect(left, y + 4, (value / max) * (width - left - right), 10); context.fillStyle = cssColor(COLORS.ink); context.font = "700 10px Arial"; const label = String(value); context.fillText(label, width - 18 - context.measureText(label).width, y + 13); });
  return encodedCanvas(canvas);
}

function renderChartImages(report: SummaryReport, startDate: string, endDate: string) {
  const targetByDate = new Map(report.fullTargetDaily);
  return [
    { name: "Progression campagne", base64: drawLineImage(report.fullDaily, targetByDate, startDate, endDate), col: 0, row: 19, width: 7000000, height: 2200000 },
    { name: "Répartition des activations", base64: drawDonutImage(report.parts), col: 10, row: 19, width: 4200000, height: 2200000 },
    { name: "Performance hôtesses", base64: drawBarImage("Activations par hôtesse", report.agents.slice(0, 6), COLORS.blue), col: 0, row: 31, width: 6500000, height: 3600000 },
    { name: "Performance shops", base64: drawBarImage("Activations par shop", report.shops.slice(0, 6), COLORS.coral), col: 9, row: 31, width: 4700000, height: 3600000 },
  ] as ExportImage[];
}

async function attachCharts(buffer: ArrayBuffer, images: ExportImage[]) {
  const zip = await JSZip.loadAsync(buffer);
  let sheetXml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
  if (!sheetXml.includes("xmlns:r=")) sheetXml = sheetXml.replace("<worksheet ", "<worksheet xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" ");
  sheetXml = sheetXml.replace("</worksheet>", "<drawing r:id=\"rId1\"/></worksheet>");
  zip.file("xl/worksheets/sheet1.xml", sheetXml);
  zip.file("xl/worksheets/_rels/sheet1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="/xl/drawings/drawing1.xml"/></Relationships>`);
  zip.file("xl/drawings/drawing1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><wsDr xmlns="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">${images.map((image, index) => imageAnchor(index + 1, image.name, image.col, image.row, image.width, image.height)).join("")}</wsDr>`);
  zip.file("xl/drawings/_rels/drawing1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images.map((_, index) => `<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/image${index + 1}.png" Id="rId${index + 1}"/>`).join("")}</Relationships>`);
  images.forEach((image, index) => zip.file(`xl/media/image${index + 1}.png`, image.base64, { base64: true }));
  let contentTypes = await zip.file("[Content_Types].xml")!.async("string");
  const imageDefault = contentTypes.includes('Extension="png"') ? "" : '<Default Extension="png" ContentType="image/png"/>';
  const overrides = `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>${imageDefault}`;
  contentTypes = contentTypes.replace("</Types>", `${overrides}</Types>`);
  zip.file("[Content_Types].xml", contentTypes);
  return zip.generateAsync({ type: "arraybuffer" });
}

type SummaryReport = { total: number; totalAmount: number; privilege: number; bundle: number; roaming: number; agents: [string, number][]; shops: [string, number][]; days: number; average: number; fullDaily: [string, number][]; fullTargetDaily: [string, number][]; target: number; targetRate: number; gap: number; parts: { label: string; value: number; color: string }[] };

function buildExactSynthesis(report: SummaryReport, startDate: string, endDate: string, rangeLabel: string, periodComment = "", periodCommentLabel = "COMMENTAIRE DE PÉRIODE · LOCAL", terms?: CampaignTerms) {
  const merchant = terms?.record === "transaction";
  const participant = merchant ? "AMBASSADEUR" : "AGENT";
  const location = merchant ? "POINT DE VENTE" : "SHOP";
  const rows = Array.from({ length: 92 }, () => Array(15).fill(""));
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = Array.from({ length: 15 }, (_, index) => ({ wch: [4, 11, 11, 11, 2, 11, 11, 11, 11, 2, 11, 11, 11, 11, 2][index] }));
  sheet["!views"] = [{ showGridLines: false }];
  merge(sheet, 0, 0, 0, 14);
  merge(sheet, 1, 0, 1, 14);
  set(sheet, 0, 0, merchant ? "RAPPORT D’ACTIVITÉ — MERCHANT EDUCATIONAL CAMPAIGN" : "RAPPORT D’ACTIVITÉ — CAMPAGNE VODACOM PRIVILÈGE", titleStyle);
  set(sheet, 1, 0, `Kinshasa — République Démocratique du Congo  |  ${rangeLabel}  |  ${report.days} jours d’activité`, contextStyle);
  if (periodComment) { merge(sheet, 2, 0, 2, 14); set(sheet, 2, 0, `${periodCommentLabel} — ${periodComment}`, { ...contextStyle, alignment: { horizontal: "left", vertical: "center", wrapText: true } }); }

  const cards: [string, number, number, number, number, boolean][] = merchant ? [
    ["TOTAL TRANSACTIONS", report.total, 3, 0, 3, false], ["MONTANT TRANSACTIONS", report.totalAmount, 3, 5, 8, false], ["AMBASSADEURS ACTIFS", report.agents.length, 3, 10, 13, false],
    ["POINTS DE VENTE COUVERTS", report.shops.length, 6, 0, 3, false], ["MOYENNE / JOUR", Number(report.average.toFixed(1)), 6, 5, 8, false], ["MOY. / AMBASSADEUR / JOUR", Number((report.agents.length ? report.average / report.agents.length : 0).toFixed(1)), 6, 10, 13, false],
    ["JOURS D’ACTIVITÉ", report.days, 9, 0, 3, false], ["OBJECTIF PÉRIODE", report.target, 9, 5, 8, true], ["ATTEINTE OBJECTIF", Math.round(report.targetRate), 9, 10, 13, true],
    ["ÉCART RÉALISÉ / CIBLE", report.gap, 12, 0, 3, true],
  ] : [
    ["TOTAL ACTIVATIONS", report.total, 3, 0, 3, false], ["OPT-IN PRIVILÈGE", report.privilege, 3, 5, 8, false], ["ACTIVATIONS BUNDLE", report.bundle, 3, 10, 13, false],
    ["OPT-IN ROAMING", report.roaming, 6, 0, 3, false], ["AGENTS ACTIFS", report.agents.length, 6, 5, 8, false], ["SHOPS COUVERTS", report.shops.length, 6, 10, 13, false],
    ["MOYENNE / JOUR", Number(report.average.toFixed(1)), 9, 0, 3, false], ["MOY. / AGENT / JOUR", Number((report.agents.length ? report.average / report.agents.length : 0).toFixed(1)), 9, 5, 8, false], ["JOURS D’ACTIVITÉ", report.days, 9, 10, 13, false],
    ["OBJECTIF PÉRIODE", report.target, 12, 0, 3, true], ["ATTEINTE OBJECTIF", Math.round(report.targetRate), 12, 5, 8, true], ["ÉCART RÉALISÉ / CIBLE", report.gap, 12, 10, 13, true],
  ];
  cards.forEach(([label, value, row, c1, c2, targetCard]) => { merge(sheet, row, c1, row, c2); merge(sheet, row + 1, c1, row + 1, c2); rangeStyle(sheet, row, row + 1, c1, c2, panelStyle); set(sheet, row, c1, label, kpiLabelStyle); set(sheet, row + 1, c1, value, { ...(targetCard ? targetKpiValueStyle : kpiValueStyle), numFmt: label === "ATTEINTE OBJECTIF" ? "0%" : label === "MONTANT TRANSACTIONS" ? "#,##0.00" : Number.isInteger(value) ? "0" : "0.0" }); });

  rangeStyle(sheet, 15, 29, 0, 8, { fill: { fgColor: { rgb: COLORS.white } } });
  rangeStyle(sheet, 15, 29, 10, 14, { fill: { fgColor: { rgb: COLORS.white } } });
  rangeStyle(sheet, 30, 44, 0, 7, { fill: { fgColor: { rgb: COLORS.white } } });
  rangeStyle(sheet, 30, 44, 9, 14, { fill: { fgColor: { rgb: COLORS.white } } });
  merge(sheet, 15, 0, 15, 8); merge(sheet, 16, 0, 16, 8); merge(sheet, 15, 10, 15, 14); merge(sheet, 16, 10, 16, 14); merge(sheet, 29, 0, 29, 7); merge(sheet, 29, 9, 29, 14);
  set(sheet, 15, 0, "PROGRESSION CAMPAGNE", { font: { name: "Arial", sz: 8, bold: true, color: { rgb: COLORS.redDark } }, alignment: { vertical: "center" } });
  set(sheet, 16, 0, merchant ? "Les transactions sur toute la campagne." : "Le mouvement sur toute la campagne.", { font: { name: "Arial", sz: 10, bold: true, color: { rgb: COLORS.ink } }, alignment: { vertical: "center" } });
  set(sheet, 15, 10, "RÉPARTITION", { font: { name: "Arial", sz: 8, bold: true, color: { rgb: COLORS.redDark } }, alignment: { vertical: "center" } });
  set(sheet, 16, 10, merchant ? "Transactions" : "Activations", { font: { name: "Arial", sz: 10, bold: true, color: { rgb: COLORS.ink } }, alignment: { vertical: "center" } });
  set(sheet, 29, 0, merchant ? "PERFORMANCE AMBASSADEURS" : "PERFORMANCE HÔTESSES", { font: { name: "Arial", sz: 8, bold: true, color: { rgb: COLORS.redDark } }, alignment: { vertical: "center" } });
  set(sheet, 29, 9, merchant ? "PERFORMANCE POINTS DE VENTE" : "PERFORMANCE SHOPS", { font: { name: "Arial", sz: 8, bold: true, color: { rgb: COLORS.redDark } }, alignment: { vertical: "center" } });

  const helperStart = 46;
  set(sheet, helperStart, 0, "Date", whiteCell); set(sheet, helperStart, 1, merchant ? "Transactions" : "Activations", whiteCell); set(sheet, helperStart, 2, merchant ? "Transactions sélectionnées" : "Activations sélectionnées", whiteCell); set(sheet, helperStart, 3, "Objectif journalier", whiteCell); set(sheet, helperStart, 4, "Écart réalisé / cible", whiteCell);
  const targets = new Map(report.fullTargetDaily);
  report.fullDaily.forEach(([date, value], index) => { const dailyTarget = targets.get(date) ?? 0; set(sheet, helperStart + 1 + index, 0, date, whiteCell); set(sheet, helperStart + 1 + index, 1, value, whiteCell); set(sheet, helperStart + 1 + index, 2, date >= startDate && date <= endDate ? value : null, whiteCell); set(sheet, helperStart + 1 + index, 3, dailyTarget, whiteCell); set(sheet, helperStart + 1 + index, 4, value - dailyTarget, whiteCell); });
  const partStart = helperStart + report.fullDaily.length + 3;
  report.parts.forEach((part, index) => { set(sheet, partStart + index, 0, part.label, whiteCell); set(sheet, partStart + index, 1, part.value, whiteCell); });
  const hostStart = partStart + report.parts.length + 3;
  report.agents.slice(0, 6).forEach(([name, value], index) => { set(sheet, hostStart + index, 0, name, whiteCell); set(sheet, hostStart + index, 1, value, whiteCell); });
  const shopStart = hostStart + 8;
  report.shops.slice(0, 6).forEach(([name, value], index) => { set(sheet, shopStart + index, 0, name, whiteCell); set(sheet, shopStart + index, 1, value, whiteCell); });
  const usedRows = shopStart + 7;
  sheet["!ref"] = `A1:O${usedRows}`;
  sheet["!rows"] = Array.from({ length: usedRows }, (_, index) => ({ hpt: index === 0 ? 32 : index === 1 ? 20 : index === 2 && periodComment ? 48 : 18, hidden: index >= helperStart }));
  sheet["!freeze"] = { xSplit: 0, ySplit: 2 };
  return { sheet, helperStart, partStart, hostStart, shopStart };
}

export async function exportExactSynthesisWorkbook(filtered: Activation[], fullDaily: [string, number][], targetDaily: [string, number][], fullTargetDaily: [string, number][], rangeLabel: string, startDate: string, endDate: string, periodComment = "", periodCommentLabel = "COMMENTAIRE DE PÉRIODE · LOCAL", terms?: CampaignTerms) {
  const merchant = terms?.record === "transaction";
  const participantSheetName = merchant ? "Ambassadeurs" : "Hôtesses";
  const locationSheetName = merchant ? "Points de vente" : "Shops";
  const privilege = filtered.filter((row) => row.t === "Opt-in Privilège").length;
  const bundle = filtered.filter((row) => row.t === "Activation Bundle").length;
  const roaming = filtered.filter((row) => row.t === "Opt-in Roaming").length;
  const agents = byKey(filtered, "a");
  const shops = byKey(filtered, "s");
  const agentAmounts = amountByKey(filtered, "a");
  const shopAmounts = amountByKey(filtered, "s");
  const days = new Set(filtered.map((row) => row.d)).size;
  const target = targetDaily.reduce((sum, [, value]) => sum + value, 0);
  const report: SummaryReport = { total: filtered.length, totalAmount: filtered.reduce((sum, row) => sum + Number(row.merchant?.amount ?? 0), 0), privilege, bundle, roaming, agents, shops, days, average: days ? filtered.length / days : 0, fullDaily, fullTargetDaily, target, targetRate: target ? (filtered.length / target) * 100 : 0, gap: filtered.length - target, parts: merchant ? [{ label: "Transactions", value: filtered.length, color: COLORS.blue }] : [{ label: "Opt-in Privilège", value: privilege, color: COLORS.blue }, { label: "Activation Bundle", value: bundle, color: COLORS.coral }, { label: "Opt-in Roaming", value: roaming, color: COLORS.green }] };
  const workbook = XLSX.utils.book_new();
  const exact = buildExactSynthesis(report, startDate, endDate, rangeLabel, periodComment, periodCommentLabel, terms);
  XLSX.utils.book_append_sheet(workbook, exact.sheet, "Synthèse");
  const fullTargetByDate = new Map(fullTargetDaily);
  const progressionRows = fullDaily.map(([date, value]) => { const dailyTarget = fullTargetByDate.get(date) ?? 0; const inRange = date >= startDate && date <= endDate; return [date, value, dailyTarget, value - dailyTarget, dailyTarget ? Number((value / dailyTarget).toFixed(4)) : 0, inRange ? "Oui" : "Non", inRange ? value : null]; });
  XLSX.utils.book_append_sheet(workbook, tableSheet(["Date", "Réalisé", "Objectif", "Écart réalisé / cible", "Atteinte", "Dans la période sélectionnée", "Réalisé sélectionné"], progressionRows, [16, 15, 15, 23, 14, 28, 22], COLORS.teal), "Progression campagne");
  const hostRows = agents.map(([name, value], index) => merchant ? [index + 1, name, value, agentAmounts.get(name) ?? 0, report.total ? value / report.total : 0] : [index + 1, name, value, report.total ? value / report.total : 0]);
  XLSX.utils.book_append_sheet(workbook, tableSheet(merchant ? ["Rang", "Ambassadeur", "Transactions", "Montant", "Part"] : ["Rang", "Hôtesse", "Activations", "Part"], hostRows, merchant ? [9, 32, 15, 18, 12] : [9, 32, 15, 12], COLORS.blue), participantSheetName);
  const shopRows = shops.map(([name, value], index) => merchant ? [index + 1, name, value, shopAmounts.get(name) ?? 0, report.total ? value / report.total : 0] : [index + 1, name, value, report.total ? value / report.total : 0]);
  XLSX.utils.book_append_sheet(workbook, tableSheet(merchant ? ["Rang", "Point de vente", "Transactions", "Montant", "Part"] : ["Rang", "Shop", "Activations", "Part"], shopRows, merchant ? [9, 36, 15, 18, 12] : [9, 36, 15, 12], COLORS.coral), locationSheetName);
  const targetByDate = new Map(targetDaily);
  const detailRows = filtered.map((row, index) => [index + 1, row.d, row.a, row.s, row.c, row.t, row.n, targetByDate.get(row.d) ?? 0, merchant ? row.merchant?.amount ?? 0 : ""]);
  XLSX.utils.book_append_sheet(workbook, tableSheet(["Ligne", "Date", merchant ? "Ambassadeur" : "Hôtesse", merchant ? "Point de vente" : "Shop", "Catégorie", merchant ? "Type de transaction" : "Type d’action", "Client", "Objectif du jour", "Montant"], detailRows, [9, 15, 30, 36, 18, 24, 20, 20, 16], COLORS.blue), "Détail filtré");
  const lastDetailRow = detailRows.length + 1;
  const detailRef = `'Détail filtré'!`;
  const summary = workbook.Sheets["Synthèse"];
  setFormula(summary, 4, 0, `COUNTA(${detailRef}$A$2:$A$${lastDetailRow})`, report.total);
  setFormula(summary, 4, 5, merchant ? `SUM(${detailRef}$I$2:$I$${lastDetailRow})` : `COUNTIF(${detailRef}$F$2:$F$${lastDetailRow},"Opt-in Privilège")`, merchant ? report.totalAmount : report.privilege);
  if (merchant) summary["F5"] = { ...summary["F5"], s: { ...(summary["F5"].s ?? {}), numFmt: "#,##0.00" } };
  setFormula(summary, 4, 10, merchant ? `COUNTA(${participantSheetName}!$B$2:$B$${hostRows.length + 1})` : `COUNTIF(${detailRef}$F$2:$F$${lastDetailRow},"Activation Bundle")`, merchant ? report.agents.length : report.bundle);
  setFormula(summary, 7, 0, merchant ? `COUNTA(${locationSheetName}!$B$2:$B$${shopRows.length + 1})` : `COUNTIF(${detailRef}$F$2:$F$${lastDetailRow},"Opt-in Roaming")`, merchant ? report.shops.length : report.roaming);
  if (merchant) {
    // Merchant cards place activity days, target and attainment at A11/F11/K11.
    // Keep these formulas aligned with the Merchant-specific card layout instead
    // of reusing the Privilège positions (A14/F14/K14).
    setFormula(summary, 7, 5, `IFERROR(A5/A11,0)`, Number(report.average.toFixed(1)));
    setFormula(summary, 7, 10, `IFERROR(F8/K5,0)`, Number((report.agents.length ? report.average / report.agents.length : 0).toFixed(1)));
    setFormula(summary, 10, 0, `SUMPRODUCT(1/COUNTIF(${detailRef}$B$2:$B$${lastDetailRow},${detailRef}$B$2:$B$${lastDetailRow}))`, report.days);
    setFormula(summary, 10, 5, `SUM('Progression campagne'!$C$2:$C$${progressionRows.length + 1})`, report.target);
    setFormula(summary, 10, 10, `IFERROR(A5/F11,0)`, report.targetRate / 100);
    summary["K11"] = { ...summary["K11"], s: { ...(summary["K11"].s ?? {}), numFmt: "0%" } };
    setFormula(summary, 13, 0, `A5-F11`, report.gap);
  } else {
    setFormula(summary, 7, 5, `COUNTA(Hôtesses!$B$2:$B$${hostRows.length + 1})`, report.agents.length);
    setFormula(summary, 7, 10, `COUNTA(Shops!$B$2:$B$${shopRows.length + 1})`, report.shops.length);
    setFormula(summary, 10, 0, `IFERROR(A5/K11,0)`, Number(report.average.toFixed(1)));
    setFormula(summary, 10, 5, `IFERROR(A11/F8,0)`, Number((report.agents.length ? report.average / report.agents.length : 0).toFixed(1)));
    setFormula(summary, 10, 10, `SUMPRODUCT(1/COUNTIF(${detailRef}$B$2:$B$${lastDetailRow},${detailRef}$B$2:$B$${lastDetailRow}))`, report.days);
    setFormula(summary, 13, 0, `SUM('Progression campagne'!$C$2:$C$${progressionRows.length + 1})`, report.target);
    setFormula(summary, 13, 5, `IFERROR(A5/A14,0)`, report.targetRate / 100);
    summary["F14"] = { ...summary["F14"], s: { ...(summary["F14"].s ?? {}), numFmt: "0%" } };
    setFormula(summary, 13, 10, `A5-A14`, report.gap);
  }
  fullDaily.forEach(([date, value], index) => {
    const helperRow = exact.helperStart + 1 + index;
    const excelRow = helperRow + 1;
    const selected = date >= startDate && date <= endDate ? value : 0;
    setFormula(summary, helperRow, 1, `COUNTIF(${detailRef}$B$2:$B$${lastDetailRow},A${excelRow})`, value);
    setFormula(summary, helperRow, 2, `IF(AND(A${excelRow}>="${startDate}",A${excelRow}<="${endDate}"),B${excelRow},0)`, selected);
    setFormula(summary, helperRow, 4, `B${excelRow}-D${excelRow}`, value - (fullTargetByDate.get(date) ?? 0));
  });
  report.parts.forEach((part, index) => setFormula(summary, exact.partStart + index, 1, `COUNTIF(${detailRef}$F$2:$F$${lastDetailRow},A${exact.partStart + index + 1})`, part.value));
  report.agents.slice(0, 6).forEach(([, value], index) => setFormula(summary, exact.hostStart + index, 1, `COUNTIF(${detailRef}$C$2:$C$${lastDetailRow},A${exact.hostStart + index + 1})`, value));
  report.shops.slice(0, 6).forEach(([, value], index) => setFormula(summary, exact.shopStart + index, 1, `COUNTIF(${detailRef}$D$2:$D$${lastDetailRow},A${exact.shopStart + index + 1})`, value));
  const progressionSheet = workbook.Sheets["Progression campagne"];
  progressionRows.forEach((row, index) => {
    const excelRow = index + 2;
    setFormula(progressionSheet, index + 1, 1, `COUNTIF(${detailRef}$B$2:$B$${lastDetailRow},A${excelRow})`, row[1] as number);
    setFormula(progressionSheet, index + 1, 3, `B${excelRow}-C${excelRow}`, row[3] as number);
    setFormula(progressionSheet, index + 1, 4, `IFERROR(B${excelRow}/C${excelRow},0)`, row[4] as number);
    progressionSheet[`E${excelRow}`] = { ...progressionSheet[`E${excelRow}`], s: { ...(progressionSheet[`E${excelRow}`].s ?? {}), numFmt: "0.0%" } };
    setFormula(progressionSheet, index + 1, 6, `IF(F${excelRow}="Oui",B${excelRow},"")`, (row[6] as number | null) ?? 0);
  });
  const hostsSheet = workbook.Sheets[participantSheetName];
  hostRows.forEach((row, index) => {
    const excelRow = index + 2;
    setFormula(hostsSheet, index + 1, 2, `COUNTIF(${detailRef}$C$2:$C$${lastDetailRow},B${excelRow})`, row[2] as number);
    hostsSheet[`D${excelRow}`] = { ...(hostsSheet[`D${excelRow}`] ?? {}), f: `IFERROR(C${excelRow}/'Synthèse'!$A$5,0)`, v: (row[2] as number) / Math.max(report.total, 1), t: "n", s: { ...(hostsSheet[`D${excelRow}`]?.s ?? {}), numFmt: "0%" } };
  });
  const shopsSheet = workbook.Sheets[locationSheetName];
  shopRows.forEach((row, index) => {
    const excelRow = index + 2;
    setFormula(shopsSheet, index + 1, 2, `COUNTIF(${detailRef}$D$2:$D$${lastDetailRow},B${excelRow})`, row[2] as number);
    shopsSheet[`D${excelRow}`] = { ...(shopsSheet[`D${excelRow}`] ?? {}), f: `IFERROR(C${excelRow}/'Synthèse'!$A$5,0)`, v: (row[2] as number) / Math.max(report.total, 1), t: "n", s: { ...(shopsSheet[`D${excelRow}`]?.s ?? {}), numFmt: "0%" } };
  });
  workbook.Workbook = { Views: [{ RTL: false, activeTab: 0 }] };
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const finalBuffer = await attachCharts(buffer, renderChartImages(report, startDate, endDate));
  const blob = new Blob([finalBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchorElement = document.createElement("a");
  anchorElement.href = url;
  anchorElement.download = `rapport-activite-${startDate}-${endDate}.xlsx`;
  anchorElement.click();
  URL.revokeObjectURL(url);
}
