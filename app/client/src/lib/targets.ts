// Design philosophy: Halo Opaline — targets remain explicit, local and additive so reporting gains context without changing the source data contract.
import type { Activation } from "@/data/vodacomData";
import type { Campaign } from "@/lib/campaigns";

export type TargetAction = "bundle" | "roaming" | "privilege";
export type TargetRule = Record<TargetAction, number>;
export type TargetMatrix = { shop: TargetRule; airportJeffery: TargetRule };

export const DEFAULT_TARGET_MATRIX: TargetMatrix = {
  shop: { bundle: 20, roaming: 3, privilege: 20 },
  airportJeffery: { bundle: 20, roaming: 10, privilege: 20 },
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function normalizeTargetMatrix(value?: Partial<TargetMatrix>): TargetMatrix {
  const rule = (source: Partial<TargetRule> | undefined, fallback: TargetRule): TargetRule => ({
    bundle: Math.max(0, Number(source?.bundle ?? fallback.bundle) || 0),
    roaming: Math.max(0, Number(source?.roaming ?? fallback.roaming) || 0),
    privilege: Math.max(0, Number(source?.privilege ?? fallback.privilege) || 0),
  });
  return { shop: rule(value?.shop, DEFAULT_TARGET_MATRIX.shop), airportJeffery: rule(value?.airportJeffery, DEFAULT_TARGET_MATRIX.airportJeffery) };
}

export function targetRuleFor(record: Activation, matrix: TargetMatrix) {
  const shop = normalize(record.s);
  const category = normalize(record.c);
  const special = /aeroport|airport|jeffery|jeffrey/.test(`${shop} ${category}`);
  return special ? matrix.airportJeffery : matrix.shop;
}

export const targetTotal = (rule: TargetRule) => rule.bundle + rule.roaming + rule.privilege;

/** A target is counted once per active agent–shop assignment and day, never once per activation row. */
export function targetDailySeries(data: Activation[], matrix: TargetMatrix): [string, number][] {
  const assignments = new Map<string, Activation>();
  data.forEach((record) => {
    const key = `${record.d}\u0000${record.a}\u0000${record.s}`;
    const existing = assignments.get(key);
    if (!existing || targetRuleFor(record, matrix) === matrix.airportJeffery) assignments.set(key, record);
  });
  const totals = new Map<string, number>();
  assignments.forEach((record) => totals.set(record.d, (totals.get(record.d) ?? 0) + targetTotal(targetRuleFor(record, matrix))));
  return Array.from(totals.entries()).sort(([left], [right]) => left.localeCompare(right));
}

export function targetValueByDate(data: Activation[], matrix: TargetMatrix) {
  return new Map(targetDailySeries(data, matrix));
}

export function targetTotalFor(data: Activation[], matrix: TargetMatrix) {
  return targetDailySeries(data, matrix).reduce((sum, [, value]) => sum + value, 0);
}

/**
 * Merchant target = configured daily POS target × configured transactions/POS
 * for every BA who actually checked in on the date.
 *
 * A zero-transaction day is still a worked day and therefore keeps its target.
 * A missing check-in is the only signal that removes a BA from that day's
 * target. POS visits and transaction volume are deliberately not used here:
 * they measure achievement, not the expected capacity.
 */
export type MerchantFieldActivity = {
  date: string;
  deployedAmbassadorIds: string[];
  activePosIds: string[];
  activePosIdsByAmbassador?: Record<string, string[]>;
};

export function merchantTargetDailySeries(records: Activation[], activity: MerchantFieldActivity[], campaign?: Campaign): [string, number][] {
  const targetPerPos = Math.max(0, campaign?.transactionsPerPosTarget ?? 0);
  const configuredPosCap = Math.max(0, campaign?.dailyPosTarget ?? 0);
  const activityByDate = new Map(activity.map((item) => [item.date, item]));
  const dates = new Set([...records.map((record) => record.d), ...activity.map((item) => item.date)]);
  return Array.from(dates).filter(Boolean).sort().map((date) => {
    const day = activityByDate.get(date);
    const deployed = new Set(day?.deployedAmbassadorIds.filter(Boolean) ?? []);
    return [date, deployed.size * configuredPosCap * targetPerPos];
  });
}
