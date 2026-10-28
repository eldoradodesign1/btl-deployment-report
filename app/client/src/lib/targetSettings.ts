import { createSupabaseClient, readSupabaseConfig } from "@/lib/supabase";
import { normalizeTargetMatrix, type TargetMatrix } from "@/lib/targets";

export type SharedTargetSettings = {
  targetMatrix: TargetMatrix;
  showProgressTargets: boolean;
  showHistogramTargets: boolean;
};

const settingKey = "campaign";
const client = () => createSupabaseClient(readSupabaseConfig());

export async function readSharedTargetSettings(): Promise<SharedTargetSettings | null> {
  const { data, error } = await client()
    .from("btl_deployment_target_settings")
    .select("target_matrix,show_progress_targets,show_histogram_targets")
    .eq("setting_key", settingKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    targetMatrix: normalizeTargetMatrix(data.target_matrix as Partial<TargetMatrix>),
    showProgressTargets: Boolean(data.show_progress_targets),
    showHistogramTargets: Boolean(data.show_histogram_targets),
  };
}

export async function saveSharedTargetSettings(settings: SharedTargetSettings, updatedBy = "BTL") {
  const { error } = await client().from("btl_deployment_target_settings").upsert({
    setting_key: settingKey,
    target_matrix: normalizeTargetMatrix(settings.targetMatrix),
    show_progress_targets: settings.showProgressTargets,
    show_histogram_targets: settings.showHistogramTargets,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  }, { onConflict: "setting_key" });
  if (error) throw error;
}
