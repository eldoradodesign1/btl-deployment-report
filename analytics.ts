// Design philosophy: Halo Opaline — calculations stay explicit, inspectable and tied to the active selection.
import type { Activation } from "@/data/vodacomData";
import * as XLSX from "xlsx";

export const ACTIONS = ["Opt-in Privilège", "Activation Bundle", "Opt-in Roaming"] as const;
export type Dimension = "Agent" | "Date" | "Shop" | "Catégorie" | "Type d'action";
export type QualityIssue = { row: number; reason: string; raw: string };

export const uniqueSorted = <T,>(items: T[]) => Array.from(new Set(items));
export const dateList = (data: Activation[]) => uniqueSorted(data.map((item) => item.d)).sort();

export function dailyRows(data: Activation[]) {
  const groups = new Map<string, Activation[]>();
  data.forEach((item) => groups.set(item.d, [...(groups.get(item.d) ?? []), item]));
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => ({
    date,
    privilege: rows.filter((item) => item.t === ACTIONS[0]).length,
    bundle: rows.filter((item) => item.t === ACTIONS[1]).length,
    roaming: rows.filter((item) => item.t === ACTIONS[2]).length,
    total: rows.length,
    agents: uniqueSorted(rows.map((item) => item.a)).length,
    shops: uniqueSorted(rows.map((item) => item.s)).length,
  }));
}

export function countBy(data: Activation[], key: keyof Pick<Activation, "a" | "s" | "t" | "c">) {
  const counts = new Map<string, number>();
  data.forEach((item) => counts.set(item[key], (counts.get(item[key]) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

export function qualityRows(data: Activation[], issues: QualityIssue[] = []) {
  const duplicateGroups = new Map<string, number>();
  data.forEach((item) => {
    const key = [item.d, item.a, item.s, item.c, item.t, item.cl, item.n].join("|");
    duplicateGroups.set(key, (duplicateGroups.get(key) ?? 0) + 1);
  });
  const duplicateOccurrences = Array.from(duplicateGroups.values()).filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
  return [
    ["Lignes importées", data.length, "neutral"],
    ["Lignes rejetées", issues.length, issues.length ? "alert" : "good"],
    ["Dates manquantes", data.filter((item) => !item.d).length, "good"],
    ["Agents manquants", data.filter((item) => !item.a.trim()).length, "good"],
    ["Shops non renseignés", data.filter((item) => !item.s.trim() || item.s === "Non renseigné").length, "alert"],
    ["Actions inconnues", data.filter((item) => !ACTIONS.includes(item.t as typeof ACTIONS[number])).length, "good"],
    ["Numéros manquants", data.filter((item) => !item.n.trim()).length, "alert"],
    ["Occurrences de doublons", duplicateOccurrences, duplicateOccurrences ? "alert" : "good"],
  ] as [string, number, "neutral" | "alert" | "good"][];
}

export function dimensionValue(item: Activation, dimension: Dimension) {
  return dimension === "Agent" ? item.a : dimension === "Date" ? item.d : dimension === "Shop" ? item.s : dimension === "Catégorie" ? item.c : item.t;
}

export function crossMatrix(data: Activation[], rowDimension: Dimension, columnDimension: Dimension) {
  const matrix = new Map<string, Map<string, number>>();
  data.forEach((item) => {
    const row = dimensionValue(item, rowDimension); const column = dimensionValue(item, columnDimension);
    const columns = matrix.get(row) ?? new Map<string, number>();
    columns.set(column, (columns.get(column) ?? 0) + 1); matrix.set(row, columns);
  });
  const columns = Array.from(new Set(data.map((item) => dimensionValue(item, columnDimension)))).sort();
  const rows = Array.from(matrix.entries()).sort(([, a], [, b]) => Array.from(b.values()).reduce((x, y) => x + y, 0) - Array.from(a.values()).reduce((x, y) => x + y, 0));
  return { columns, rows };
}

function normalizeHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const headerAliases: Record<string, keyof Activation> = {
  date: "d", jour: "d", "date activation": "d", agent: "a", "nom agent": "a", shop: "s", "point de vente": "s", pdv: "s", categorie: "c", "type action": "t", "type d action": "t", action: "t", client: "cl", "nom client": "cl", numero: "n", telephone: "n", "numero telephone": "n", msisdn: "n",
};

function parseLines(text: string, delimiter: string) {
  const records: string[][] = []; let record: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') { if (quoted && text[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted; }
    else if (char === delimiter && !quoted) { record.push(value.trim()); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; record.push(value.trim()); value = ""; if (record.some(Boolean)) records.push(record); record = []; }
    else value += char;
  }
  if (value.length || record.length) { record.push(value.trim()); if (record.some(Boolean)) records.push(record); }
  return records;
}

export function parseCsv(text: string) {
  const sample = text.split(/\r?\n/).slice(0, 6).join("\n");
  const delimiter = [";", ",", "\t"].sort((a, b) => sample.split(b).length - sample.split(a).length)[0];
  const records = parseLines(text.replace(/^\uFEFF/, ""), delimiter);
  const headerIndex = records.findIndex((row) => row.some((cell) => normalizeHeader(cell) === "date") && row.some((cell) => ["agent", "nom agent"].includes(normalizeHeader(cell))));
  if (headerIndex < 0) return { records: [] as Activation[], issues: [{ row: 1, reason: "Colonnes Date et Agent introuvables", raw: records[0]?.join(" | ") ?? "" }], delimiter };
  const headers = records[headerIndex].map((cell) => headerAliases[normalizeHeader(cell)]);
  const valid: Activation[] = []; const issues: QualityIssue[] = [];
  records.slice(headerIndex + 1).forEach((row, index) => {
    const raw = row.join(" | "); const value = (key: keyof Activation) => { const position = headers.indexOf(key); return position >= 0 ? (row[position] ?? "").trim() : ""; };
    const dateValue = value("d").replace(/[./]/g, "/"); const parts = dateValue.split("/");
    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : parts.length === 3 ? `${parts[2].length === 2 ? `20${parts[2]}` : parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}` : "";
    const agent = value("a");
    if (!normalizedDate || !agent) { issues.push({ row: headerIndex + index + 2, reason: !normalizedDate ? "Date inexploitable" : "Agent manquant", raw }); return; }
    valid.push({ d: normalizedDate, a: agent, s: value("s") || "Non renseigné", c: value("c") || "Non renseigné", t: value("t") || "Inconnu", cl: value("cl"), n: value("n") });
  });
  return { records: valid, issues, delimiter };
}

export function parseSpreadsheet(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => /detail|activation/i.test(normalizeHeader(name))) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  const text = rows.map((row) => row.map((cell) => { if (cell instanceof Date) return `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, "0")}-${String(cell.getDate()).padStart(2, "0")}`; return String(cell ?? ""); }).join("\t")).join("\n");
  return { ...parseCsv(text), sheetName };
}

export function loadLocalData(fallback: Activation[]) {
  try { const saved = localStorage.getItem("vodacom-activations"); return saved ? JSON.parse(saved) as Activation[] : fallback; } catch { return fallback; }
}

export function saveLocalData(data: Activation[]) { localStorage.setItem("vodacom-activations", JSON.stringify(data)); }
