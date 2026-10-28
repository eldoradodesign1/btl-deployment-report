import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type DailyMetrics = { active: number; privilege: number; roaming: number; bundle: number; activeAgents: number; reportAgents: number; reportShops: number };
type MerchantDailyMetrics = { transactions: number; activeAmbassadors: number; activePoints: number };
type MerchantPeriodMetrics = MerchantDailyMetrics & { reportingDays: number; peakTransactions: number; peakDate: string | null };
type WeeklyMetrics = { activations: number; reportingDays: number; peak: number; peakDate: string | null; average: number; averageAgents: number; averageShops: number };
type RequestBody = { action: "get_or_generate" | "regenerate" | "save" | "generate_local" | "generate_draft"; kind: "daily" | "weekly" | "custom"; date?: string; week?: number; startDate?: string; endDate?: string; comment?: string; campaignCode?: "merchant"; campaignId?: string; updatedByUserId?: string; metrics: DailyMetrics | MerchantDailyMetrics | MerchantPeriodMetrics | WeeklyMetrics };
type TerrainReport = { comment: string | null };

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8" };
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const level = (value: number) => value >= 50 ? "Élevé" : value >= 25 ? "Modéré" : "Faible";
const dateLabel = (value: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${value}T00:00:00`));

function promptFor(kind: RequestBody["kind"], body: RequestBody, reports: TerrainReport[], isMerchant: boolean) {
  const reportComments = reports.map((report) => report.comment?.trim()).filter(Boolean).slice(0, 35).map((comment, index) => `${index + 1}. ${comment}`).join("\n") || "Aucun commentaire individuel disponible.";
  if (isMerchant && kind === "daily") {
    const metrics = body.metrics as MerchantDailyMetrics;
    return {
      system: "Vous êtes superviseur de la Merchant Educational Campaign. Produisez une synthèse quotidienne factuelle, concise et professionnelle à partir des commentaires de clôture des BA. Ne créez aucun fait et ne reproduisez pas les commentaires individuellement. Rédigez un seul paragraphe de 45 à 85 mots en français, portant sur les faits communs, les freins ou réussites étayés.",
      prompt: `Date : ${dateLabel(body.date!)}.\nTransactions enregistrées : ${metrics.transactions}.\nAmbassadeurs ayant une transaction : ${metrics.activeAmbassadors}.\nPoints de vente concernés : ${metrics.activePoints}.\nCommentaires de clôture BA disponibles : ${reports.length}.\nCommentaires source :\n${reportComments}`,
    };
  }
  if (isMerchant) {
    const metrics = body.metrics as MerchantPeriodMetrics;
    const periodName = kind === "weekly" ? "synthèse hebdomadaire" : "synthèse de période";
    return {
      system: `Vous êtes superviseur de la Merchant Educational Campaign. Produisez une ${periodName} factuelle, concise et professionnelle exclusivement à partir des commentaires de clôture des BA. Ne créez aucun fait, ne traduisez pas les noms de métriques et ne reproduisez pas les commentaires individuellement. Rédigez un seul paragraphe de 70 à 120 mots en français, avec bilan d’activité, tendances ou freins seulement lorsqu’ils sont étayés.`,
      prompt: `Période : ${body.startDate} au ${body.endDate}.\nTransactions enregistrées : ${metrics.transactions}.\nAmbassadeurs ayant une transaction : ${metrics.activeAmbassadors}.\nPoints de vente concernés : ${metrics.activePoints}.\nJours ayant une activité enregistrée : ${metrics.reportingDays}.\nPic : ${metrics.peakTransactions} transaction(s) le ${metrics.peakDate ? dateLabel(metrics.peakDate) : "jour non déterminé"}.\nCommentaires de clôture BA disponibles : ${reports.length}.\nCommentaires source :\n${reportComments}`,
    };
  }
  if (kind === "daily") {
    const metrics = body.metrics as DailyMetrics;
    return {
      system: "Vous êtes superviseur BTL Vodacom. Faites une synthèse factuelle, concise et professionnelle des commentaires quotidiens des hôtesses. Ne créez aucun fait. Rédigez un seul paragraphe de 45 à 85 mots en français, en mentionnant le niveau d’activité et les principaux freins ou réussites uniquement si les données les établissent.",
      prompt: `Date : ${dateLabel(body.date!)}.\nActivations : ${metrics.active} (Privilège ${metrics.privilege}, Bundle ${metrics.bundle}, Roaming ${metrics.roaming}).\nHôtesses actives : ${metrics.activeAgents}.\nRapports d’hôtesses : ${reports.length}.\nCommentaires individuels :\n${reportComments}`,
    };
  }
  const metrics = body.metrics as WeeklyMetrics;
  return {
    system: kind === "custom" ? "Vous êtes superviseur BTL Vodacom. Produisez une synthèse factuelle pour une période personnalisée à partir des rapports terrain et activations fournis. Ne créez aucun fait. Rédigez un seul paragraphe de 70 à 120 mots en français, avec bilan, tendance et principaux leviers ou freins avérés." : "Vous êtes superviseur BTL Vodacom. Produisez une synthèse hebdomadaire factuelle à partir des rapports terrain et activations fournis. Ne créez aucun fait. Rédigez un seul paragraphe de 70 à 120 mots en français, avec bilan, tendance et principaux leviers ou freins avérés.",
    prompt: `Période : ${body.startDate} au ${body.endDate}.\nActivations : ${metrics.activations}.\nJours de reporting : ${metrics.reportingDays}.\nMoyenne quotidienne : ${metrics.average}.\nPic : ${metrics.peak} activation(s) le ${metrics.peakDate ?? "jour non déterminé"}.\nCommentaires individuels :\n${reportComments}`,
  };
}

async function generateWithRetry(prompt: string, system: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("La clé Gemini n’est pas configurée dans les secrets Supabase.");
  const supportedModels = ["gemini-3.5-flash-lite"];
  const configuredModels = (Deno.env.get("GEMINI_MODELS") ?? "").split(",").map((model) => model.trim()).filter((model) => supportedModels.includes(model));
  const models = Array.from(new Set([...configuredModels, ...supportedModels]));
  const minimumWords = system.includes("quotidienne") ? 45 : 70;
  let lastError = "";
  for (const model of models) for (let attempt = 0; attempt < 1; attempt += 1) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(45_000), method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 420 } }) });
    const payload = await response.json().catch(() => ({}));
    const text = clean(payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "");
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    if (response.ok && wordCount >= minimumWords) return text;
    if (response.ok) {
      lastError = `Gemini a produit une réponse incomplète (${wordCount} mot${wordCount > 1 ? "s" : ""}).`;
      continue;
    }
    lastError = payload?.error?.message ?? `Gemini a répondu ${response.status}.`;
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
  }
  console.error("Gemini unavailable", { reason: lastError, models });
  throw new Error("Gemini est momentanément indisponible. Réessayez dans quelques instants.");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return Response.json({ error: "Méthode non autorisée." }, { status: 405, headers: cors });
  try {
    const body = await request.json() as RequestBody;
    const isMerchant = body.campaignCode === "merchant";
    if (!body?.kind || !body?.action || !body?.metrics || (body.kind === "daily" && !body.date) || (isMerchant && !body.campaignId) || (body.kind === "weekly" && (!body.week || !body.startDate || !body.endDate)) || (body.kind === "custom" && (!body.startDate || !body.endDate || body.action !== "generate_local"))) return Response.json({ error: "Requête de commentaire incomplète." }, { status: 400, headers: cors });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const isDaily = body.kind === "daily";
    const isCustom = body.kind === "custom";
    const table = isDaily ? "superviseur_commentaires_quotidiens" : "superviseur_commentaires_hebdomadaires";
    if (isMerchant) {
      const start = isDaily ? body.date! : body.startDate!;
      const end = isDaily ? body.date! : body.endDate!;
      const reportKind = isCustom ? "compiled" : body.kind;
      const { data: existing, error: readError } = await admin.from("campaign_supervisor_report_comments").select("comment").eq("campaign_code", "merchant").eq("report_kind", reportKind).eq("starts_on", start).eq("ends_on", end).maybeSingle();
      if (readError) throw readError;
      if (body.action === "get_or_generate" && existing?.comment?.trim()) return Response.json({ comment: clean(existing.comment), generated: false }, { headers: cors });
    } else if (!isCustom) {
      const selector = isDaily ? admin.from(table).select("commentaire_superviseur").eq("date", body.date!) : admin.from(table).select("commentaire_superviseur").eq("semaine", body.week!);
      const { data: existing, error: readError } = await selector.maybeSingle();
      if (readError) throw readError;
      if (body.action === "get_or_generate" && existing?.commentaire_superviseur?.trim()) return Response.json({ comment: clean(existing.commentaire_superviseur), generated: false }, { headers: cors });
    }
    let reports: TerrainReport[] = [];
    if (isMerchant) {
      const { data: runs, error: runsError } = await admin.from("campaign_runs").select("id").eq("campaign_id", body.campaignId!).limit(100);
      if (runsError) throw runsError;
      const runIds = (runs ?? []).map((row) => String(row.id));
      const start = isDaily ? body.date! : body.startDate!;
      const end = isDaily ? body.date! : body.endDate!;
      const { data: attendance, error: attendanceError } = runIds.length ? await admin.from("ba_daily_attendance").select("closing_comment").in("campaign_run_id", runIds).gte("activity_date", start).lte("activity_date", end).not("closing_comment", "is", null).limit(1000) : { data: [], error: null };
      if (attendanceError) throw attendanceError;
      reports = (attendance ?? []).map((row) => ({ comment: row.closing_comment as string | null })).filter((row) => row.comment?.trim());
      if (!reports.length && body.action !== "save") throw new Error("Aucun commentaire de clôture BA n’est disponible pour cette période.");
    } else if (body.action !== "save") {
      const start = isDaily ? body.date! : body.startDate!;
      const end = isDaily ? body.date! : body.endDate!;
      const { data: terrainReports, error: reportError } = await admin.from("daily_reports").select("comment").gte("date", start).lte("date", end).order("date", { ascending: true });
      if (reportError) throw reportError;
      reports = (terrainReports ?? []) as TerrainReport[];
    }
    let comment = body.comment ? clean(body.comment) : "";
    if (body.action !== "save") {
      const synthesis = promptFor(body.kind, body, reports, isMerchant);
      comment = await generateWithRetry(synthesis.prompt, synthesis.system);
    }
    if (isMerchant) {
      if (body.action === "generate_draft") return Response.json({ comment, generated: true, storage: "draft" }, { headers: cors });
      const row = { campaign_code: "merchant", report_kind: "daily", starts_on: body.date!, ends_on: body.date!, comment, ai_generated: body.action !== "save", updated_by_user_id: body.updatedByUserId ?? null, source_comments: reports.map((report) => clean(report.comment!)) };
      if (isCustom) return Response.json({ comment, generated: true, storage: "local" }, { headers: cors });
      const start = isDaily ? body.date! : body.startDate!;
      const end = isDaily ? body.date! : body.endDate!;
      const reportKind = isDaily ? "daily" : "weekly";
      const merchantRow = { ...row, report_kind: reportKind, starts_on: start, ends_on: end };
      const { data: existing, error: lookupError } = await admin.from("campaign_supervisor_report_comments").select("id").eq("campaign_code", "merchant").eq("report_kind", reportKind).eq("starts_on", start).eq("ends_on", end).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      const { error: writeError } = existing
        ? await admin.from("campaign_supervisor_report_comments").update(merchantRow).eq("id", existing.id)
        : await admin.from("campaign_supervisor_report_comments").insert(merchantRow);
      if (writeError) throw writeError;
      return Response.json({ comment, generated: body.action !== "save" }, { headers: cors });
    }
    if (isCustom) return Response.json({ comment, generated: true, storage: "local" }, { headers: cors });
    const row = isDaily ? (() => { const metrics = body.metrics as DailyMetrics; return { date: body.date!, jour: dateLabel(body.date!), niveau_activite: level(metrics.active), activations: metrics.active, variation_vs_jour_precedent: null, hotesses_declarees: metrics.reportAgents, hotesses_avec_activation: metrics.activeAgents, hotesses_a_zero: Math.max(0, metrics.reportAgents - metrics.activeAgents), shops_declares: metrics.reportShops, activations_par_hotesse: metrics.activeAgents ? Number((metrics.active / metrics.activeAgents).toFixed(2)) : 0, privilege: metrics.privilege, roaming: metrics.roaming, bundle: metrics.bundle, commentaire_superviseur: comment }; })() : (() => { const metrics = body.metrics as WeeklyMetrics; return { semaine: body.week!, debut: body.startDate!, fin: body.endDate!, jours_reporting: metrics.reportingDays, activations_totales: metrics.activations, moyenne_activations_jour: metrics.average, pic_activite: metrics.peak, date_pic: metrics.peakDate, hotesses_moyennes: metrics.averageAgents, shops_moyens: metrics.averageShops, commentaire_superviseur: comment }; })();
    const { error: writeError } = await admin.from(table).upsert(row, { onConflict: isDaily ? "date" : "semaine" });
    if (writeError) throw writeError;
    return Response.json({ comment, generated: body.action !== "save" }, { headers: cors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La génération du commentaire a échoué.";
    return Response.json({ error: message }, { status: 500, headers: cors });
  }
});
