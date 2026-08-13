import type { Activation } from "@/data/vodacomData";
import { supabase } from "@/lib/supabase";

type LeadRow = {
  timestamp: string | null;
  agent_id: string | null;
  shop_id: string | null;
  client_name: string | null;
  msisdn: string | null;
  action_type: string | null;
  bundle_type: string | null;
};

type DailyCommentRow = { date: string; commentaire_superviseur: string | null };
type WeeklyCommentRow = { debut: string; fin: string; commentaire_superviseur: string | null };

const isoDate = (value: string | null) => value ? value.slice(0, 10) : "";

function normalizeLead(row: LeadRow): Activation | null {
  const date = isoDate(row.timestamp);
  const agent = row.agent_id?.trim() ?? "";
  if (!date || !agent) return null;
  return {
    d: date,
    a: agent,
    s: row.shop_id?.trim() || "Non renseigné",
    c: row.bundle_type?.trim() || "Non renseigné",
    t: row.action_type?.trim() || "Inconnu",
    cl: row.client_name?.trim() ?? "",
    n: row.msisdn?.trim() ?? "",
  };
}

export async function loadSupabaseSnapshot() {
  const leadsResult = await supabase
    .from("leads")
    .select("timestamp,agent_id,shop_id,client_name,msisdn,action_type,bundle_type")
    .order("timestamp", { ascending: true });

  if (leadsResult.error) throw leadsResult.error;

  const [dailyResult, weeklyResult] = await Promise.all([
    supabase.from("superviseur_commentaires_quotidiens").select("date,commentaire_superviseur").order("date", { ascending: true }),
    supabase.from("superviseur_commentaires_hebdomadaires").select("debut,fin,commentaire_superviseur").order("debut", { ascending: true }),
  ]);

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

  return {
    records: ((leadsResult.data ?? []) as LeadRow[]).map(normalizeLead).filter((row): row is Activation => Boolean(row)),
    dailyComments,
    weeklyComments,
  };
}
