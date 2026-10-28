// « Questionner la campagne » (Rapports / Orbit) : répond en français à une question sur une campagne et une période,
// à partir des données de la base (lecture seule) résumées côté serveur. Aucun numéro ni nom de client n'est transmis à l'IA.
// Contrôles : accès client de la campagne (profil Vodacom), quota de questions par jour et par sujet (navigateur ou compte BTL).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = { campaignId: string; startDate: string; endDate: string; question: string; role: "vodacom" | "btl"; subject: string; history?: { question: string; answer: string }[] };
type Row = { day: string; who: string; where: string; kind: string; done?: boolean; amount?: number };
type Note = { day: string; source: string; text: string };

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8" };
const reply = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: cors });
const contactCodes = ["mpesa-mikili", "youth-f2f"];
const BTL_ROLES = ["admin", "super_admin", "superadmin", "sub_admin", "supervisor"];

async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000 || rows.length >= 30000) return rows;
  }
}
const day = (value: unknown) => String(value ?? "").slice(0, 10);
const clip = (value: unknown, max = 280) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const names = async (db: SupabaseClient, ids: string[]) => {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {} as Record<string, string>;
  const { data, error } = await db.from("users").select("id,full_name").in("id", unique);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [String(row.id), String(row.full_name ?? "")]));
};

// Lignes d'activité et notes de terrain de la campagne sur la période, selon son type.
async function load(db: SupabaseClient, campaign: { id: string; code: string; campaign_type: string }, start: string, end: string) {
  const rows: Row[] = []; const notes: Note[] = []; const presence = new Set<string>();
  if (contactCodes.includes(campaign.code)) {
    const mikili = campaign.code === "mpesa-mikili";
    const contacts = await readAll<Record<string, unknown>>((a, b) => mikili
      ? db.from("mpesa_mikili_clients").select("agent_id,activity_date,location_id,transaction_done,presented_service").eq("campaign_id", campaign.id).gte("activity_date", start).lte("activity_date", end).order("id").range(a, b)
      : db.from("youth_contact_reports").select("ba_id,activity_date,region,subscriber_type").eq("campaign_id", campaign.id).gte("activity_date", start).lte("activity_date", end).order("id").range(a, b));
    const attendance = await readAll<Record<string, unknown>>((a, b) => db.from(mikili ? "mpesa_mikili_daily_attendance" : "youth_daily_attendance").select("ba_id,activity_date,checkin_at,closing_comment").eq("campaign_id", campaign.id).gte("activity_date", start).lte("activity_date", end).order("id").range(a, b));
    const places = mikili ? Object.fromEntries(((await db.from("campaign_locations").select("id,name").eq("campaign_id", campaign.id)).data ?? []).map((r) => [String(r.id), String(r.name)])) : {};
    const who = await names(db, [...contacts.map((r) => String(r.agent_id ?? r.ba_id ?? "")), ...attendance.map((r) => String(r.ba_id ?? ""))]);
    contacts.forEach((r) => rows.push({ day: day(r.activity_date), who: who[String(r.agent_id ?? r.ba_id)] ?? "Ambassadeur", where: mikili ? places[String(r.location_id)] ?? "Lieu non renseigné" : String(r.region ?? "Région non renseignée"), kind: mikili ? (r.transaction_done ? "contact avec transaction" : "contact sans transaction") : String(r.subscriber_type ?? "contact"), done: r.transaction_done === true }));
    attendance.forEach((r) => { if (r.checkin_at) presence.add(`${who[String(r.ba_id)] ?? r.ba_id}|${day(r.activity_date)}`); if (clip(r.closing_comment)) notes.push({ day: day(r.activity_date), source: `Clôture de ${who[String(r.ba_id)] ?? "ambassadeur"}`, text: clip(r.closing_comment) }); });
  } else if (campaign.campaign_type === "brand_ambassador") {
    const runIds = ((await db.from("campaign_runs").select("id").eq("campaign_id", campaign.id)).data ?? []).map((r) => String(r.id));
    if (runIds.length) {
      const tx = await readAll<Record<string, unknown>>((a, b) => db.from("ba_transactions").select("ba_id,pos_id,occurred_at,amount,status").in("campaign_run_id", runIds).gte("occurred_at", `${start}T00:00:00`).lte("occurred_at", `${end}T23:59:59`).order("id").range(a, b));
      const attendance = await readAll<Record<string, unknown>>((a, b) => db.from("ba_daily_attendance").select("ba_id,activity_date,checkin_at,closing_comment").in("campaign_run_id", runIds).gte("activity_date", start).lte("activity_date", end).order("id").range(a, b));
      const pos = Object.fromEntries(((await db.from("points_of_sale").select("id,denomination,pool,mfs_name").eq("campaign_id", campaign.id)).data ?? []).map((r) => [String(r.id), `${r.denomination ?? "POS"}${r.mfs_name ? ` (MFS ${r.mfs_name})` : ""}`]));
      const who = await names(db, [...tx.map((r) => String(r.ba_id ?? "")), ...attendance.map((r) => String(r.ba_id ?? ""))]);
      tx.forEach((r) => rows.push({ day: day(r.occurred_at), who: who[String(r.ba_id)] ?? "Ambassadeur", where: pos[String(r.pos_id)] ?? "Point de vente", kind: `transaction ${r.status ?? ""}`.trim(), amount: Number(r.amount ?? 0) }));
      attendance.forEach((r) => { if (r.checkin_at) presence.add(`${who[String(r.ba_id)] ?? r.ba_id}|${day(r.activity_date)}`); if (clip(r.closing_comment)) notes.push({ day: day(r.activity_date), source: `Clôture de ${who[String(r.ba_id)] ?? "ambassadeur"}`, text: clip(r.closing_comment) }); });
    }
    const sup = campaign.code.startsWith("merchant") ? await db.from("campaign_supervisor_report_comments").select("report_kind,starts_on,ends_on,comment").eq("campaign_code", "merchant").gte("starts_on", start).lte("ends_on", end) : { data: [] };
    (sup.data ?? []).forEach((r) => clip(r.comment, 600) && notes.push({ day: day(r.starts_on), source: `Supervision (${r.report_kind})`, text: clip(r.comment, 600) }));
  } else {
    const leads = await readAll<Record<string, unknown>>((a, b) => db.from("leads").select("timestamp,agent_id,shop_id,action_type").gte("timestamp", `${start}T00:00:00`).lte("timestamp", `${end}T23:59:59`).order("timestamp").range(a, b));
    const shops = Object.fromEntries(((await db.from("shops").select("id,name")).data ?? []).map((r) => [String(r.id), String(r.name)]));
    const who = await names(db, leads.map((r) => String(r.agent_id ?? "")));
    leads.forEach((r) => rows.push({ day: day(r.timestamp), who: who[String(r.agent_id)] ?? "Agent", where: shops[String(r.shop_id)] ?? "Shop", kind: String(r.action_type ?? "activation") }));
    const reports = await readAll<Record<string, unknown>>((a, b) => db.from("daily_reports").select("date,agent_name,shop_name,comment,arrival_time").or(`campaign_id.eq.${campaign.id},campaign_id.is.null`).gte("date", start).lte("date", end).order("date").range(a, b));
    reports.forEach((r) => { presence.add(`${r.agent_name}|${day(r.date)}`); if (clip(r.comment)) notes.push({ day: day(r.date), source: `Rapport de ${r.agent_name ?? "hôtesse"} (${r.shop_name ?? "shop"})`, text: clip(r.comment) }); });
    const daily = await db.from("superviseur_commentaires_quotidiens").select("date,commentaire_superviseur").gte("date", start).lte("date", end);
    (daily.data ?? []).forEach((r) => clip(r.commentaire_superviseur, 600) && notes.push({ day: day(r.date), source: "Supervision du jour", text: clip(r.commentaire_superviseur, 600) }));
  }
  return { rows, notes, presence };
}

// Résumé chiffré compact : totaux, classements, rythme quotidien, présence. Les notes suivent, les plus récentes d'abord.
function summarize(rows: Row[], notes: Note[], presence: Set<string>) {
  const count = <K extends string>(key: (r: Row) => K) => { const m = new Map<K, { n: number; done: number; days: Set<string>; amount: number }>(); rows.forEach((r) => { const k = key(r); const v = m.get(k) ?? { n: 0, done: 0, days: new Set<string>(), amount: 0 }; v.n += 1; v.done += r.done ? 1 : 0; v.days.add(r.day); v.amount += r.amount ?? 0; m.set(k, v); }); return [...m.entries()].sort((a, b) => b[1].n - a[1].n); };
  const fmt = (list: ReturnType<typeof count>, limit: number) => list.slice(0, limit).map(([k, v], i) => `${i + 1}. ${k} : ${v.n} (${v.days.size} j.${v.done ? `, ${v.done} avec transaction` : ""}${v.amount ? `, montant ${Math.round(v.amount)}` : ""})`).join("\n");
  const byPerson = count((r) => r.who); const byPlace = count((r) => r.where); const byKind = count((r) => r.kind); const byDay = count((r) => r.day).sort((a, b) => a[0].localeCompare(b[0]));
  const presenceByPerson = new Map<string, number>(); presence.forEach((p) => { const who = p.split("|")[0]; presenceByPerson.set(who, (presenceByPerson.get(who) ?? 0) + 1); });
  return [
    `Total des lignes : ${rows.length} sur ${byDay.length} jour(s) d'activité.`,
    `Par type :\n${fmt(byKind, 12)}`,
    `Classement des personnes (agents / ambassadeurs) :\n${fmt(byPerson, 40)}`,
    `Classement des lieux :\n${fmt(byPlace, 40)}`,
    `Volume par jour :\n${byDay.map(([d, v]) => `${d} : ${v.n}`).join("\n")}`,
    `Jours de présence pointés par personne :\n${[...presenceByPerson.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([w, n]) => `${w} : ${n} j.`).join("\n") || "aucun pointage"}`,
    `Notes de terrain et de supervision (${notes.length}) :\n${notes.sort((a, b) => b.day.localeCompare(a.day)).slice(0, 120).map((n) => `[${n.day}] ${n.source} : ${n.text}`).join("\n") || "aucune note"}`,
  ].join("\n\n");
}

async function ask(context: string, body: Body, campaignName: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("La clé Gemini n’est pas configurée dans les secrets Supabase.");
  const model = (Deno.env.get("ASK_CAMPAIGN_MODEL") ?? "gemini-3.5-flash-lite").trim();
  const system = `Vous êtes l'analyste de la campagne « ${campaignName} » (BTL Africa, Kinshasa). Vous répondez en français aux lecteurs du rapport (client Vodacom ou équipe BTL).
Règles : appuyez-vous uniquement sur les données fournies pour la période du ${body.startDate} au ${body.endDate} ; citez les chiffres utiles ; si les données ne permettent pas de répondre, dites-le simplement.
Pour une question qui demande des pistes ou des solutions, faites d'abord le constat tiré des données et des notes, puis proposez des pistes concrètes, présentées comme des suggestions.
Ne mentionnez jamais de numéro de téléphone ni d'information sur un client. Réponse courte et structurée : 40 à 180 mots, listes à puces si utile, pas de titre.`;
  const contents = [
    ...(body.history ?? []).slice(-4).flatMap((h) => [{ role: "user", parts: [{ text: clip(h.question, 500) }] }, { role: "model", parts: [{ text: clip(h.answer, 1500) }] }]),
    { role: "user", parts: [{ text: `Données de la campagne :\n${context}\n\nQuestion : ${clip(body.question, 500)}` }] },
  ];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", signal: AbortSignal.timeout(60_000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.3, maxOutputTokens: 700 } }) });
  const payload = await response.json().catch(() => ({}));
  const text = (payload?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
  if (!response.ok || !text) { console.error("Gemini", response.status, payload?.error?.message); throw new Error("L'IA est momentanément indisponible. Réessayez dans quelques instants."); }
  return text;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply(405, { error: "Méthode non autorisée." });
  try {
    const body = await request.json() as Body;
    const question = clip(body?.question, 500);
    if (!body?.campaignId || !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(body.endDate ?? "") || question.length < 3 || !body.subject || !["vodacom", "btl"].includes(body.role)) return reply(400, { error: "Question incomplète." });
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: campaign, error: campaignError } = await db.from("campaigns").select("id,code,name,campaign_type").eq("id", body.campaignId).maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign || campaign.campaign_type === "event") return reply(404, { error: "Campagne introuvable." });
    // Accès : BTL = compte connu avec un rôle BTL ; Vodacom = campagne visible et questions ouvertes par BTL.
    let subject = clip(body.subject, 80);
    if (body.role === "btl") {
      const { data: user } = await db.from("users").select("id,role").eq("id", body.subject).maybeSingle();
      if (!user || !BTL_ROLES.includes(String(user.role ?? "").toLowerCase())) return reply(403, { error: "Compte BTL non reconnu." });
      subject = `btl:${user.id}`;
    } else {
      const { data: access } = await db.from("rapports_client_access").select("campaign_visible,ai_questions").eq("campaign_id", campaign.id).maybeSingle();
      if (!access?.campaign_visible || !access?.ai_questions) return reply(403, { error: "Les questions ne sont pas ouvertes pour cette campagne." });
      subject = `vodacom:${subject}`;
    }
    // Quota du jour
    const { data: quotaRow } = await db.from("rapports_settings").select("value").eq("setting_key", "ai_daily_quota").maybeSingle();
    const quota = Number(quotaRow?.value ?? 20);
    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await db.from("rapports_ai_usage").select("questions").eq("subject", subject).eq("usage_day", today).maybeSingle();
    const used = Number(usage?.questions ?? 0);
    if (used >= quota) return reply(429, { error: `Vous avez atteint les ${quota} questions du jour. Le compteur repart demain.`, remaining: 0, quota });
    const { rows, notes, presence } = await load(db, campaign as { id: string; code: string; campaign_type: string }, body.startDate, body.endDate);
    const answer = await ask(summarize(rows, notes, presence), { ...body, question }, String(campaign.name));
    const { error: usageError } = await db.from("rapports_ai_usage").upsert({ subject, usage_day: today, questions: used + 1 }, { onConflict: "subject,usage_day" });
    if (usageError) console.error("usage", usageError.message);
    return reply(200, { answer, remaining: Math.max(0, quota - used - 1), quota, lines: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La question n'a pas pu être traitée.";
    console.error("ask-campaign", message);
    return reply(500, { error: message });
  }
});
