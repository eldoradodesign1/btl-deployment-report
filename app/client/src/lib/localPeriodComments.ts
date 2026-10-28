import type { Activation } from "@/data/vodacomData";

const STORAGE_KEY = "btl-local-custom-period-comments:v1";

export function localPeriodCommentKey(records: Activation[], startDate: string, endDate: string) {
  const dates = Array.from(new Set(records.map((record) => record.d))).sort();
  const campaign = `${dates[0] ?? "empty"}:${dates.at(-1) ?? "empty"}:${records.length}`;
  return `${campaign}:${startDate}:${endDate}`;
}

export function merchantLocalCommentKey(campaignId: string, kind: "daily" | "weekly", startDate: string, endDate = startDate) {
  return `merchant:${campaignId}:${kind}:${startDate}:${endDate}`;
}

export function readLocalPeriodComments(): Record<string, string> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    return Object.entries(stored).reduce<Record<string, string>>((comments, [key, value]) => {
      if (typeof value === "string") comments[key] = value.trim();
      return comments;
    }, {});
  } catch {
    return {};
  }
}

export function writeLocalPeriodComments(comments: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}
