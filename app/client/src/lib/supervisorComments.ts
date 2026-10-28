import type { Activation } from "@/data/vodacomData";
import { readSupabaseConfig } from "@/lib/supabase";

type DailyMetrics = { active: number; privilege: number; roaming: number; bundle: number; activeAgents: number; reportAgents: number; reportShops: number };
type MerchantDailyMetrics = { transactions: number; activeAmbassadors: number; activePoints: number };
type MerchantPeriodMetrics = MerchantDailyMetrics & { reportingDays: number; peakTransactions: number; peakDate: string | null };
type WeeklyMetrics = { activations: number; reportingDays: number; peak: number; peakDate: string | null; average: number; averageAgents: number; averageShops: number };
type CommentRequest = {
  action: "get_or_generate" | "regenerate" | "save" | "generate_local" | "generate_draft";
  kind: "daily" | "weekly" | "custom";
  date?: string;
  week?: number;
  startDate?: string;
  endDate?: string;
  comment?: string;
  campaignCode?: "merchant";
  campaignId?: string;
  updatedByUserId?: string;
  metrics: DailyMetrics | MerchantDailyMetrics | MerchantPeriodMetrics | WeeklyMetrics;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

async function requestComment(payload: CommentRequest) {
  const config = readSupabaseConfig();
  const response = await fetch(`${config.url}/functions/v1/generate-supervisor-comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.comment) throw new Error(body?.error || "La génération du commentaire a échoué.");
  return clean(body.comment as string);
}

function dailyMetrics(date: string, records: Activation[]): DailyMetrics {
  const current = records.filter((item) => item.d === date);
  const activeAgents = new Set(current.map((item) => item.a));
  return {
    active: current.length,
    privilege: current.filter((item) => item.t === "Opt-in Privilège").length,
    roaming: current.filter((item) => item.t === "Opt-in Roaming").length,
    bundle: current.filter((item) => item.t === "Activation Bundle").length,
    activeAgents: activeAgents.size,
    reportAgents: activeAgents.size,
    reportShops: new Set(current.map((item) => item.s)).size,
  };
}

function merchantDailyMetrics(date: string, records: Activation[]): MerchantDailyMetrics {
  const current = records.filter((item) => item.d === date);
  return {
    transactions: current.length,
    activeAmbassadors: new Set(current.map((item) => item.merchant?.baId ?? item.a).filter(Boolean)).size,
    activePoints: new Set(current.map((item) => item.merchant?.posId ?? item.s).filter(Boolean)).size,
  };
}

function merchantPeriodMetrics(start: string, end: string, records: Activation[]): MerchantPeriodMetrics {
  const range = records.filter((item) => item.d >= start && item.d <= end);
  const dates = Array.from(new Set(range.map((item) => item.d)));
  const peak = dates.reduce<{ date: string | null; count: number }>((best, date) => {
    const count = range.filter((item) => item.d === date).length;
    return count > best.count ? { date, count } : best;
  }, { date: null, count: 0 });
  return {
    transactions: range.length,
    activeAmbassadors: new Set(range.map((item) => item.merchant?.baId ?? item.a).filter(Boolean)).size,
    activePoints: new Set(range.map((item) => item.merchant?.posId ?? item.s).filter(Boolean)).size,
    reportingDays: dates.length,
    peakTransactions: peak.count,
    peakDate: peak.date,
  };
}

function weeklyMetrics(start: string, end: string, records: Activation[]): WeeklyMetrics {
  const range = records.filter((item) => item.d >= start && item.d <= end);
  const byDay = Array.from(new Set(range.map((item) => item.d))).map((date) => range.filter((item) => item.d === date));
  const peak = byDay.reduce<Activation[]>((best, day) => day.length > best.length ? day : best, []);
  return {
    activations: range.length,
    reportingDays: byDay.length,
    peak: peak.length,
    peakDate: peak[0]?.d ?? null,
    average: byDay.length ? Number((range.length / byDay.length).toFixed(2)) : 0,
    averageAgents: byDay.length ? Number((byDay.reduce((sum, day) => sum + new Set(day.map((item) => item.a)).size, 0) / byDay.length).toFixed(2)) : 0,
    averageShops: byDay.length ? Number((byDay.reduce((sum, day) => sum + new Set(day.map((item) => item.s)).size, 0) / byDay.length).toFixed(2)) : 0,
  };
}

export function getOrGenerateDailyComment(date: string, records: Activation[]) { return requestComment({ action: "get_or_generate", kind: "daily", date, metrics: dailyMetrics(date, records) }); }
export function regenerateDailyComment(date: string, records: Activation[]) { return requestComment({ action: "regenerate", kind: "daily", date, metrics: dailyMetrics(date, records) }); }
export function saveDailyComment(date: string, comment: string, records: Activation[]) { return requestComment({ action: "save", kind: "daily", date, comment: clean(comment), metrics: dailyMetrics(date, records) }); }
export function getOrGenerateWeeklyComment(week: number, start: string, end: string, records: Activation[]) { return requestComment({ action: "get_or_generate", kind: "weekly", week, startDate: start, endDate: end, metrics: weeklyMetrics(start, end, records) }); }
export function regenerateWeeklyComment(week: number, start: string, end: string, records: Activation[]) { return requestComment({ action: "regenerate", kind: "weekly", week, startDate: start, endDate: end, metrics: weeklyMetrics(start, end, records) }); }
export function saveWeeklyComment(week: number, start: string, end: string, comment: string, records: Activation[]) { return requestComment({ action: "save", kind: "weekly", week, startDate: start, endDate: end, comment: clean(comment), metrics: weeklyMetrics(start, end, records) }); }
export function generateCustomPeriodComment(start: string, end: string, records: Activation[]) { return requestComment({ action: "generate_local", kind: "custom", startDate: start, endDate: end, metrics: weeklyMetrics(start, end, records) }); }
export function generateMerchantDailySupervisorDraft(date: string, campaignId: string, records: Activation[]) { return requestComment({ action: "generate_draft", kind: "daily", campaignCode: "merchant", campaignId, date, metrics: merchantDailyMetrics(date, records) }); }
export function saveMerchantDailySupervisorComment(date: string, campaignId: string, comment: string, records: Activation[], updatedByUserId?: string) { return requestComment({ action: "save", kind: "daily", campaignCode: "merchant", campaignId, date, comment: clean(comment), updatedByUserId, metrics: merchantDailyMetrics(date, records) }); }
export function generateMerchantWeeklySupervisorDraft(week: number, start: string, end: string, campaignId: string, records: Activation[]) { return requestComment({ action: "generate_draft", kind: "weekly", campaignCode: "merchant", campaignId, week, startDate: start, endDate: end, metrics: merchantPeriodMetrics(start, end, records) }); }
export function saveMerchantWeeklySupervisorComment(week: number, start: string, end: string, campaignId: string, comment: string, records: Activation[], updatedByUserId?: string) { return requestComment({ action: "save", kind: "weekly", campaignCode: "merchant", campaignId, week, startDate: start, endDate: end, comment: clean(comment), updatedByUserId, metrics: merchantPeriodMetrics(start, end, records) }); }
export function generateMerchantCustomPeriodDraft(start: string, end: string, campaignId: string, records: Activation[]) { return requestComment({ action: "generate_local", kind: "custom", campaignCode: "merchant", campaignId, startDate: start, endDate: end, metrics: merchantPeriodMetrics(start, end, records) }); }
