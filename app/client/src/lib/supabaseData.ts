import type { Activation } from "@/data/vodacomData";
import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Campaign } from "@/lib/campaigns";
import { vodacomCampaignCode } from "@/lib/campaigns";

type LeadRow = {
  id: string | null;
  timestamp: string | null;
  agent_id: string | null;
  shop_id: string | null;
  client_name: string | null;
  msisdn: string | null;
  action_type: string | null;
  bundle_type: string | null;
};
type AgentRow = { id: string | null; full_name: string | null; role: string | null };
type ShopRow = { id: string | null; name: string | null };
type CheckinRow = { agent_id: string | null; timestamp: string | null };

type DailyCommentRow = { date: string; commentaire_superviseur: string | null };
type WeeklyCommentRow = { debut: string; fin: string; commentaire_superviseur: string | null };
type CampaignRow = { id: string; code: string; name: string; campaign_type: Campaign["campaignType"]; status: Campaign["status"]; starts_on: string | null; ends_on: string | null; daily_pos_target: number | null; transactions_per_pos_target: number | null };
type MerchantTransactionRow = { id: string; campaign_run_id: string; ba_id: string | null; pos_id: string | null; transaction_reference: string | null; short_code: string | null; amount: number | null; occurred_at: string | null; status: string | null; client_number: string | null; comment: string | null; evidence_path: string | null };
type MerchantAttendanceRow = { campaign_run_id: string; ba_id: string | null; activity_date: string | null; status: string | null; checkin_at: string | null; closing_comment: string | null };
type MerchantPosVisitRow = { campaign_run_id: string; ba_id: string | null; pos_id: string | null; activity_date: string | null; operational_status: string | null };
type PointOfSaleRow = { id: string; denomination: string | null; pool: string | null; activity: string | null; mfs_name: string | null; is_active: boolean | null };
type MerchantSupervisorCommentRow = { report_kind: "daily" | "weekly" | "compiled"; starts_on: string; ends_on: string; comment: string | null };
export type AttendancePoint = { agent: string; date: string };
export type MerchantCreationContext = { campaignRunId: string; ambassadors: { id: string; label: string }[]; points: { id: string; label: string }[] };
export type MerchantPosCoverage = {
  points: { id: string; isActive: boolean }[];
  visits: { posId: string; date: string; operationalStatus: string }[];
};

const isoDate = (value: string | null) => value ? value.slice(0, 10) : "";

function normalizeLead(row: LeadRow, agentNames: Record<string, string>, shopNames: Record<string, string>): Activation | null {
  const date = isoDate(row.timestamp);
  const agent = row.agent_id?.trim() ?? "";
  if (!date || !agent) return null;
  const shop = row.shop_id?.trim() || "Non renseigné";
  return {
    id: row.id?.trim() || undefined,
    d: date,
    a: agentNames[agent] ?? agent,
    s: shopNames[shop] ?? shop,
    c: row.bundle_type?.trim() || "Non renseigné",
    t: row.action_type?.trim() || "Inconnu",
    cl: row.client_name?.trim() ?? "",
    n: row.msisdn?.trim() ?? "",
  };
}

export async function loadSupabaseSnapshot(client: SupabaseClient = supabase) {
  const campaigns = await loadCampaigns(client);
  const vodacom = campaigns.find((campaign) => campaign.code === vodacomCampaignCode);
  return loadCampaignSnapshot(vodacom, client);
}

export async function loadCampaigns(client: SupabaseClient = supabase): Promise<Campaign[]> {
  const { data, error } = await client.from("campaigns").select("id,code,name,campaign_type,status,starts_on,ends_on,daily_pos_target,transactions_per_pos_target").order("created_at", { ascending: true });
  if (error) throw error;
  // Les events (campaign_type = event) ne sont pas des campagnes de terrain : Rapports ne les affiche pas.
  return ((data ?? []) as CampaignRow[]).filter((row) => (row.campaign_type as string) !== "event").map((row) => ({ id: row.id, code: row.code, name: row.name, campaignType: row.campaign_type, status: row.status, startsOn: row.starts_on, endsOn: row.ends_on, dailyPosTarget: row.daily_pos_target, transactionsPerPosTarget: row.transactions_per_pos_target }));
}

export async function loadCampaignSnapshot(campaign: Campaign | undefined, client: SupabaseClient = supabase) {
  if (campaign?.campaignType === "brand_ambassador") return loadMerchantSnapshot(campaign, client);
  const leadsResult = await client
    .from("leads")
    .select("id,timestamp,agent_id,shop_id,client_name,msisdn,action_type,bundle_type")
    .order("timestamp", { ascending: true });

  if (leadsResult.error) throw leadsResult.error;

  const [dailyResult, weeklyResult, usersResult, shopsResult, checkinsResult] = await Promise.all([
    client.from("superviseur_commentaires_quotidiens").select("date,commentaire_superviseur").order("date", { ascending: true }),
    client.from("superviseur_commentaires_hebdomadaires").select("debut,fin,commentaire_superviseur").order("debut", { ascending: true }),
    client.from("users").select("id,full_name,role").eq("role", "agent"),
    client.from("shops").select("id,name"),
    client.from("checkins").select("agent_id,timestamp").limit(10000),
  ]);

  const agentNames = Object.fromEntries(
    ((usersResult.data ?? []) as AgentRow[])
      .filter((row) => row.id?.trim() && row.full_name?.trim())
      .map((row) => [row.id!.trim(), row.full_name!.trim()]),
  );
  const shopNames = Object.fromEntries(
    ((shopsResult.data ?? []) as ShopRow[])
      .filter((row) => row.id?.trim() && row.name?.trim())
      .map((row) => [row.id!.trim(), row.name!.trim()]),
  );

  const dailyComments = Object.fromEntries(
    ((dailyResult.data ?? []) as DailyCommentRow[])
      .filter((row) => row.commentaire_superviseur?.trim())
      .map((row) => [row.date, row.commentaire_superviseur!.trim()]),
  );
  const weeklyComments = Object.fromEntries(
    ((weeklyResult.data ?? []) as WeeklyCommentRow[])
      .filter((row) => row.commentaire_superviseur?.trim())
      .map((row) => [`${row.debut}|${row.fin}`, row.commentaire_superviseur!.trim()]),
  );
  const attendanceAvailable = !checkinsResult.error;
  const attendance = Array.from(new Set(
    ((checkinsResult.data ?? []) as CheckinRow[])
      .map((row) => {
        const agentId = row.agent_id?.trim() ?? "";
        const date = isoDate(row.timestamp);
        return agentId && date ? `${agentNames[agentId] ?? agentId}|${date}` : "";
      })
      .filter(Boolean),
  )).map((value) => {
    const [agent, date] = value.split("|");
    return { agent, date } satisfies AttendancePoint;
  });

  return {
    records: ((leadsResult.data ?? []) as LeadRow[]).map((row) => normalizeLead(row, agentNames, shopNames)).filter((row): row is Activation => Boolean(row)),
    dailyComments,
    weeklyComments,
    attendance,
    attendanceAvailable,
    merchantFieldActivity: [],
    merchantPosCoverage: null as MerchantPosCoverage | null,
  };
}

export async function loadMerchantCreationContext(campaignId: string, client: SupabaseClient = supabase): Promise<MerchantCreationContext> {
  const { data: runs, error: runsError } = await client.from("campaign_runs").select("id").eq("campaign_id", campaignId).order("starts_on", { ascending: false }).limit(1);
  if (runsError) throw runsError;
  const campaignRunId = runs?.[0]?.id ? String(runs[0].id) : "";
  if (!campaignRunId) return { campaignRunId: "", ambassadors: [], points: [] };
  const [attendanceResult, pointsResult] = await Promise.all([
    client.from("ba_daily_attendance").select("ba_id").eq("campaign_run_id", campaignRunId).limit(500),
    client.from("points_of_sale").select("id,denomination").eq("campaign_id", campaignId).order("denomination", { ascending: true }).limit(1000),
  ]);
  if (attendanceResult.error) throw attendanceResult.error;
  if (pointsResult.error) throw pointsResult.error;
  const ambassadorIds = Array.from(new Set((attendanceResult.data ?? []).map((row) => row.ba_id).filter((id): id is string => Boolean(id))));
  const usersResult = ambassadorIds.length ? await client.from("users").select("id,full_name").in("id", ambassadorIds).limit(500) : { data: [] as { id: string; full_name: string | null }[], error: null };
  if (usersResult.error) throw usersResult.error;
  return {
    campaignRunId,
    ambassadors: (usersResult.data ?? []).filter((row) => row.id && row.full_name).map((row) => ({ id: row.id, label: row.full_name as string })).sort((left, right) => left.label.localeCompare(right.label)),
    points: ((pointsResult.data ?? []) as Pick<PointOfSaleRow, "id" | "denomination">[]).filter((row) => row.id && row.denomination).map((row) => ({ id: row.id, label: row.denomination as string })),
  };
}

async function loadMerchantSnapshot(campaign: Campaign, client: SupabaseClient) {
  const runsResult = await client.from("campaign_runs").select("id").eq("campaign_id", campaign.id).limit(100);
  if (runsResult.error) throw runsResult.error;
  const runIds = (runsResult.data ?? []).map((row) => String(row.id));
  if (!runIds.length) return { records: [] as Activation[], dailyComments: {}, weeklyComments: {}, attendance: [] as AttendancePoint[], attendanceAvailable: false, merchantFieldActivity: [], merchantPosCoverage: null as MerchantPosCoverage | null };
  const [transactionsResult, attendanceResult, pointsResult, visitsResult, supervisorCommentsResult] = await Promise.all([
    client.from("ba_transactions").select("id,campaign_run_id,ba_id,pos_id,transaction_reference,short_code,amount,occurred_at,status,client_number,comment,evidence_path").in("campaign_run_id", runIds).order("occurred_at", { ascending: true }),
    client.from("ba_daily_attendance").select("campaign_run_id,ba_id,activity_date,status,checkin_at,closing_comment").in("campaign_run_id", runIds),
    client.from("points_of_sale").select("id,denomination,pool,activity,mfs_name,is_active").eq("campaign_id", campaign.id),
    client.from("ba_pos_visits").select("campaign_run_id,ba_id,pos_id,activity_date,operational_status").in("campaign_run_id", runIds).limit(5000),
    // The supervision table stores Merchant under its normalized report code, while
    // `campaigns.code` keeps the operational slug `merchant-educational-campaign`.
    client.from("campaign_supervisor_report_comments").select("report_kind,starts_on,ends_on,comment").eq("campaign_code", "merchant").order("starts_on", { ascending: true }),
  ]);
  if (transactionsResult.error) throw transactionsResult.error;
  if (attendanceResult.error) throw attendanceResult.error;
  if (pointsResult.error) throw pointsResult.error;
  if (visitsResult.error) throw visitsResult.error;
  if (supervisorCommentsResult.error) throw supervisorCommentsResult.error;
  const transactions = (transactionsResult.data ?? []) as MerchantTransactionRow[];
  const attendance = (attendanceResult.data ?? []) as MerchantAttendanceRow[];
  const visits = (visitsResult.data ?? []) as MerchantPosVisitRow[];
  const ambassadorIds = Array.from(new Set([...transactions.map((row) => row.ba_id), ...attendance.map((row) => row.ba_id)].filter((value): value is string => Boolean(value))));
  const usersResult = ambassadorIds.length ? await client.from("users").select("id,full_name").in("id", ambassadorIds) : { data: [] as { id: string; full_name: string | null }[], error: null };
  if (usersResult.error) throw usersResult.error;
  const ambassadorNames = Object.fromEntries((usersResult.data ?? []).filter((row) => row.id && row.full_name).map((row) => [row.id, row.full_name as string]));
  const points = Object.fromEntries(((pointsResult.data ?? []) as PointOfSaleRow[]).map((row) => [row.id, row]));
  const deployedByDate = new Map<string, Set<string>>();
  attendance.forEach((row) => {
    if (!row.activity_date || !row.ba_id || !row.checkin_at) return;
    const deployed = deployedByDate.get(row.activity_date) ?? new Set<string>();
    deployed.add(row.ba_id);
    deployedByDate.set(row.activity_date, deployed);
  });
  const activePosByDate = new Map<string, Set<string>>();
  const activePosByAmbassadorDate = new Map<string, Map<string, Set<string>>>();
  visits.forEach((row) => {
    const point = row.pos_id ? points[row.pos_id] : undefined;
    if (!row.activity_date || !row.pos_id || row.operational_status?.toLowerCase() !== "active" || point?.is_active === false) return;
    const active = activePosByDate.get(row.activity_date) ?? new Set<string>();
    active.add(row.pos_id);
    activePosByDate.set(row.activity_date, active);
    if (row.ba_id) {
      const byAmbassador = activePosByAmbassadorDate.get(row.activity_date) ?? new Map<string, Set<string>>();
      const ambassadorPoints = byAmbassador.get(row.ba_id) ?? new Set<string>();
      ambassadorPoints.add(row.pos_id);
      byAmbassador.set(row.ba_id, ambassadorPoints);
      activePosByAmbassadorDate.set(row.activity_date, byAmbassador);
    }
  });
  const merchantFieldActivity = Array.from(new Set([...Array.from(deployedByDate.keys()), ...Array.from(activePosByDate.keys())])).sort().map((date) => ({
    date,
    deployedAmbassadorIds: Array.from(deployedByDate.get(date) ?? []),
    activePosIds: Array.from(activePosByDate.get(date) ?? []),
    activePosIdsByAmbassador: Object.fromEntries(Array.from(activePosByAmbassadorDate.get(date)?.entries() ?? []).map(([baId, posIds]) => [baId, Array.from(posIds)])),
  }));
  const merchantPosCoverage: MerchantPosCoverage = {
    points: Object.values(points).map((point) => ({ id: point.id, isActive: point.is_active !== false })),
    visits: visits.filter((row) => Boolean(row.pos_id && row.activity_date)).map((row) => ({ posId: row.pos_id!, date: row.activity_date!, operationalStatus: row.operational_status?.toLowerCase() ?? "" })),
  };
  // Merchant separates individual BA closing comments, transaction notes and supervisor syntheses.
  // The dashboard reads only persisted supervisor comments; BA closures remain source material for Gemini.
  const supervisorComments = (supervisorCommentsResult.data ?? []) as MerchantSupervisorCommentRow[];
  const dailyComments = Object.fromEntries(supervisorComments
    .filter((row) => row.report_kind === "daily" && row.starts_on === row.ends_on && row.comment?.trim())
    .map((row) => [row.starts_on, row.comment!.trim()]));
  const weeklyComments = Object.fromEntries(supervisorComments
    .filter((row) => row.report_kind !== "daily" && row.comment?.trim())
    .map((row) => [`${row.starts_on}|${row.ends_on}`, row.comment!.trim()]));
  const records = transactions.map((row) => {
      const point = row.pos_id ? points[row.pos_id] : undefined;
      return {
        id: row.id,
        campaignId: campaign.id,
        d: isoDate(row.occurred_at),
        a: row.ba_id ? ambassadorNames[row.ba_id] ?? row.ba_id : "Non renseigné",
        s: point?.denomination?.trim() || "Point de vente non renseigné",
        c: point?.activity?.trim() || point?.pool?.trim() || "Merchant Education",
        t: "Transaction Merchant",
        cl: row.transaction_reference?.trim() || "",
        n: row.client_number?.trim() || "",
          merchant: {
            reference: row.transaction_reference?.trim() || "",
            shortCode: row.short_code?.trim() || "",
            amount: Number(row.amount ?? 0),
            status: row.status === "verified" || row.status === "rejected" ? row.status : "recorded",
            pool: point?.pool?.trim() || "Non renseigné",
            activity: point?.activity?.trim() || "Non renseignée",
            comment: row.comment?.trim() || "",
          occurredAt: row.occurred_at ?? `${isoDate(row.occurred_at)}T12:00:00.000Z`,
          campaignRunId: row.campaign_run_id,
          baId: row.ba_id ?? "",
          posId: row.pos_id ?? "",
          evidencePath: row.evidence_path?.trim() || "",
        },
      } satisfies Activation;
    }).filter((row) => Boolean(row.d));
  return {
    records,
    dailyComments,
    weeklyComments,
    attendance: [] as AttendancePoint[],
    attendanceAvailable: false,
    merchantFieldActivity,
    merchantPosCoverage,
  };
}
