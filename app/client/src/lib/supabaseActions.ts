import type { Activation } from "@/data/vodacomData";
import { createSupabaseClient, readSupabaseConfig } from "@/lib/supabase";

const client = () => createSupabaseClient(readSupabaseConfig());

async function resolveId(table: "users" | "shops", name: string) {
  const column = table === "users" ? "full_name" : "name";
  const { data, error } = await client().from(table).select("id").eq(column, name.trim()).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error(`${table === "users" ? "L’hôtesse" : "Le shop"} « ${name} » n’existe pas dans Supabase. Synchronisez la source avant de créer l’activation.`);
  return data.id as string;
}

export async function createPersistentLead(record: Activation) {
  const agentId = await resolveId("users", record.a);
  const shopId = await resolveId("shops", record.s);
  const { data, error } = await client().from("leads").insert({
    timestamp: `${record.d}T12:00:00.000Z`,
    agent_id: agentId,
    shop_id: shopId,
    client_name: record.cl || null,
    msisdn: record.n || null,
    action_type: record.t,
    bundle_type: record.c || null,
  }).select("id").single();
  if (error) throw error;
  return { ...record, id: data.id as string };
}

export async function deletePersistentLead(record: Activation) {
  if (!record.id) throw new Error("Cette activation vient d’un fichier local et n’a pas d’identifiant Supabase à supprimer.");
  const { error } = await client().from("leads").delete().eq("id", record.id);
  if (error) throw error;
}

export async function updatePersistentLead(record: Activation, field: "a" | "s" | "cl" | "n", value: string) {
  if (!record.id) throw new Error("Cette activation vient d’un fichier local et ne peut pas être mise à jour dans Supabase.");
  const payload: Record<string, string | null> = field === "a" ? { agent_id: await resolveId("users", value) } : field === "s" ? { shop_id: await resolveId("shops", value) } : field === "cl" ? { client_name: value || null } : { msisdn: value || null };
  const { error } = await client().from("leads").update(payload).eq("id", record.id);
  if (error) throw error;
}

export type MerchantTransactionChanges = {
  date: string;
  reference: string;
  shortCode?: string;
  clientNumber: string;
  amount: number;
  status: "recorded" | "verified" | "rejected";
  comment: string;
};

export type MerchantTransactionCreate = MerchantTransactionChanges & {
  campaignRunId: string;
  baId: string;
  posId: string;
  evidenceFile?: File;
};

export async function updatePersistentMerchantTransaction(record: Activation, changes: MerchantTransactionChanges) {
  if (!record.id || !record.merchant) throw new Error("Cette ligne Merchant ne possède pas les informations nécessaires à sa mise à jour.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(changes.date)) throw new Error("La date doit respecter le format AAAA-MM-JJ.");
  if (!Number.isFinite(changes.amount) || changes.amount < 0) throw new Error("Le montant doit être un nombre positif ou nul.");
  const { error } = await client().from("ba_transactions").update({
    occurred_at: `${changes.date}T12:00:00.000Z`,
    transaction_reference: changes.reference.trim() || null,
    short_code: changes.shortCode?.trim() || null,
    client_number: changes.clientNumber.trim() || null,
    amount: changes.amount,
    status: changes.status,
    comment: changes.comment.trim() || null,
  }).eq("id", record.id);
  if (error) throw error;
}

export async function deletePersistentMerchantTransaction(record: Activation) {
  if (!record.id || !record.merchant) throw new Error("Cette ligne Merchant ne possède pas les informations nécessaires à sa suppression.");
  const { error } = await client().from("ba_transactions").delete().eq("id", record.id);
  if (error) throw error;
}

export async function createPersistentMerchantTransaction(transaction: MerchantTransactionCreate) {
  if (!transaction.campaignRunId || !transaction.baId || !transaction.posId) throw new Error("Ambassadeur, point de vente et campagne sont requis.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) throw new Error("La date doit respecter le format AAAA-MM-JJ.");
  if (!Number.isFinite(transaction.amount) || transaction.amount < 0) throw new Error("Le montant doit être un nombre positif ou nul.");
  if (!transaction.evidenceFile) throw new Error("La capture du transfert est obligatoire.");
  if (!transaction.evidenceFile.type.startsWith("image/")) throw new Error("La capture doit être une image JPG, PNG ou WEBP.");
  if (transaction.evidenceFile.size > 8 * 1024 * 1024) throw new Error("La capture ne doit pas dépasser 8 Mo.");
  const extension = transaction.evidenceFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const evidencePath = `merchant-transactions/${transaction.campaignRunId}/${transaction.baId}/${transaction.date}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client().storage.from("ba-evidence").upload(evidencePath, transaction.evidenceFile, { contentType: transaction.evidenceFile.type, upsert: false });
  if (uploadError) throw new Error("La capture du transfert n’a pas pu être téléversée.");
  const { data, error } = await client().from("ba_transactions").insert({
    campaign_run_id: transaction.campaignRunId,
    ba_id: transaction.baId,
    pos_id: transaction.posId,
    occurred_at: `${transaction.date}T12:00:00.000Z`,
    transaction_reference: transaction.reference.trim() || null,
    short_code: transaction.shortCode?.trim() || null,
    client_number: transaction.clientNumber.trim() || null,
    amount: transaction.amount,
    status: transaction.status,
    comment: transaction.comment.trim() || null,
    evidence_path: evidencePath,
  }).select("id").single();
  if (error) {
    await client().storage.from("ba-evidence").remove([evidencePath]);
    throw error;
  }
  return data.id as string;
}

export async function getMerchantEvidenceUrl(evidencePath: string) {
  if (!evidencePath.trim()) return null;
  const { data, error } = await client().storage.from("ba-evidence").createSignedUrl(evidencePath, 60 * 20);
  if (error) throw error;
  return data.signedUrl;
}

export type MerchantCampaignTargets = { dailyPosTarget: number; transactionsPerPosTarget: number };
export type MerchantImportRecord = {
  rowNumber: number;
  campaignRunId: string;
  baId: string;
  posId: string;
  date: string;
  reference: string;
  shortCode?: string;
  clientNumber: string;
  amount: number;
  status: "recorded" | "verified" | "rejected";
  comment: string;
  evidencePath: string;
  rawPayload: Record<string, string>;
};
export type MerchantImportIssue = { rowNumber: number; rawPayload: Record<string, string>; missingFields: string[] };

export async function updateMerchantCampaignTargets(campaignId: string, targets: MerchantCampaignTargets) {
  if (!campaignId) throw new Error("La campagne Merchant active est introuvable.");
  if (!Number.isInteger(targets.dailyPosTarget) || targets.dailyPosTarget < 1) throw new Error("La cible POS/jour doit être un entier supérieur à zéro.");
  if (!Number.isInteger(targets.transactionsPerPosTarget) || targets.transactionsPerPosTarget < 1) throw new Error("La cible transactions/POS doit être un entier supérieur à zéro.");
  const { error } = await client().from("campaigns").update({ daily_pos_target: targets.dailyPosTarget, transactions_per_pos_target: targets.transactionsPerPosTarget }).eq("id", campaignId);
  if (error) throw error;
}

export async function importMerchantTransactions(input: { campaignId: string; sourceFilename: string; actorName: string; records: MerchantImportRecord[]; issues: MerchantImportIssue[] }) {
  const insertRows = input.records.map((record) => ({
    campaign_run_id: record.campaignRunId,
    ba_id: record.baId,
    pos_id: record.posId,
    occurred_at: `${record.date}T12:00:00.000Z`,
    transaction_reference: record.reference || null,
    short_code: record.shortCode || null,
    client_number: record.clientNumber || null,
    amount: record.amount,
    status: record.status,
    comment: record.comment || null,
    evidence_path: record.evidencePath,
  }));
  let inserted = 0;
  const issues = [...input.issues];
  if (insertRows.length) {
    const { error } = await client().from("ba_transactions").insert(insertRows);
    if (!error) inserted = insertRows.length;
    else {
      for (const record of input.records) {
        const { error: rowError } = await client().from("ba_transactions").insert({
          campaign_run_id: record.campaignRunId,
          ba_id: record.baId,
          pos_id: record.posId,
          occurred_at: `${record.date}T12:00:00.000Z`,
          transaction_reference: record.reference || null,
          short_code: record.shortCode || null,
          client_number: record.clientNumber || null,
          amount: record.amount,
          status: record.status,
          comment: record.comment || null,
          evidence_path: record.evidencePath,
        });
        if (rowError) issues.push({ rowNumber: record.rowNumber, rawPayload: record.rawPayload, missingFields: [`Écriture Supabase : ${rowError.message}`] });
        else inserted += 1;
      }
    }
  }
  if (issues.length) {
    const { error } = await client().from("merchant_transaction_import_issues").insert(issues.map((issue) => ({
      campaign_id: input.campaignId,
      source_filename: input.sourceFilename,
      row_number: issue.rowNumber,
      raw_payload: issue.rawPayload,
      missing_fields: issue.missingFields,
      created_by: input.actorName || null,
    })));
    if (error) throw new Error("Les anomalies n’ont pas pu être ajoutées à Qualité des données.");
  }
  return { inserted, issues: issues.length };
}

export async function loadMerchantTransactionImportIssues(campaignId: string) {
  if (!campaignId) return [] as { id: string; source_filename: string; row_number: number; missing_fields: string[]; created_at: string }[];
  const { data, error } = await client().from("merchant_transaction_import_issues").select("id, source_filename, row_number, missing_fields, created_at").eq("campaign_id", campaignId).eq("status", "open").order("created_at", { ascending: false }).limit(40);
  if (error) throw error;
  return (data ?? []) as { id: string; source_filename: string; row_number: number; missing_fields: string[]; created_at: string }[];
}
