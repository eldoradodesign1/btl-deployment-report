// Accès client par campagne (profil Vodacom), quota de questions à l'IA et appel de « Questionner la campagne ».
// Lecture directe des tables ; écriture uniquement par les RPC contrôlées (admin / super_admin).
import { readSupabaseConfig, supabase } from "@/lib/supabase";
import type { Session } from "@/lib/roles";

export type ClientAccess = { campaignVisible: boolean; targetsVisible: boolean; aiQuestions: boolean };
export const defaultAccess: ClientAccess = { campaignVisible: true, targetsVisible: true, aiQuestions: false };

type AccessRow = { campaign_id: string; campaign_visible: boolean; targets_visible: boolean; ai_questions: boolean };

export async function loadClientAccess(): Promise<Record<string, ClientAccess>> {
  const { data, error } = await supabase.from("rapports_client_access").select("campaign_id,campaign_visible,targets_visible,ai_questions");
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as AccessRow[]).map((row) => [row.campaign_id, { campaignVisible: row.campaign_visible, targetsVisible: row.targets_visible, aiQuestions: row.ai_questions }]));
}

export async function saveClientAccess(actorId: string, campaignId: string, access: ClientAccess) {
  const { error } = await supabase.rpc("rapports_set_client_access", { p_actor: actorId, p_campaign: campaignId, p_visible: access.campaignVisible, p_targets: access.targetsVisible, p_ai: access.aiQuestions });
  if (error) throw new Error(error.message);
}

export async function loadAiQuota() {
  const { data, error } = await supabase.from("rapports_settings").select("value").eq("setting_key", "ai_daily_quota").maybeSingle();
  if (error) throw error;
  return Number(data?.value ?? 20);
}

export async function saveAiQuota(actorId: string, quota: number) {
  const { error } = await supabase.rpc("rapports_set_ai_quota", { p_actor: actorId, p_quota: quota });
  if (error) throw new Error(error.message);
}

// Un navigateur Vodacom = un identifiant aléatoire gardé sur l'appareil ; un compte BTL = son id.
function browserId() {
  try {
    const known = localStorage.getItem("orbit-browser-id");
    if (known) return known;
    const created = crypto.randomUUID();
    localStorage.setItem("orbit-browser-id", created);
    return created;
  } catch { return "navigateur-sans-stockage"; }
}

export type AskTurn = { question: string; answer: string };
export type AskResult = { answer: string; remaining: number; quota: number };

export async function askCampaign(session: Session, campaignId: string, startDate: string, endDate: string, question: string, history: AskTurn[]): Promise<AskResult> {
  const config = readSupabaseConfig();
  const subject = session.role === "btl" ? session.profile?.id ?? "" : browserId();
  const response = await fetch(`${config.url}/functions/v1/ask-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
    body: JSON.stringify({ campaignId, startDate, endDate, question, role: session.role, subject, history }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.answer) {
    const error = new Error(body?.error || "La question n'a pas pu être traitée.") as Error & { remaining?: number };
    if (typeof body?.remaining === "number") error.remaining = body.remaining;
    throw error;
  }
  return body as AskResult;
}
