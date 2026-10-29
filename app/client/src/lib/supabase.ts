import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseConfig = { url: string; anonKey: string };
export type SupabaseSuperadminProfile = { id: string; full_name: string; role: "super_admin" | "superadmin" };
export type SupabaseBtlProfile = { id: string; full_name: string; role: string; avatar_url?: string | null };
export type BtlAuditEvent = { actor_user_id?: string | null; actor_name: string; actor_role: string; action: string; entity_type: string; entity_id?: string | null; campaign_id?: string | null; summary: string; before_state?: Record<string, unknown> | null; after_state?: Record<string, unknown> | null };

const btlLoginRoles = ["admin", "super_admin", "superadmin", "sub_admin", "sous_admin", "supervisor", "superviseur"];
const btlProfileCacheKey = "btl-login-profiles-cache-v1";
const btlProfileCacheTtlMs = 5 * 60 * 1000;
let btlProfilesRequest: Promise<SupabaseBtlProfile[]> | null = null;

const defaultConfig: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL ?? "https://upkzlppvwckriuidnyvq.supabase.co",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwa3pscHB2d2Nrcml1aWRueXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjUyNTIsImV4cCI6MjEwMTM0MTI1Mn0.DhGB5MFdRyOeJw0qL297r4NAG5vbAbVpdz18H-d-LnY",
};
const configStorageKey = "vodacom-supabase-config";

export function readSupabaseConfig(): SupabaseConfig {
  try {
    const value = JSON.parse(localStorage.getItem(configStorageKey) ?? "") as Partial<SupabaseConfig>;
    if (typeof value.url === "string" && typeof value.anonKey === "string" && value.url && value.anonKey) return { url: value.url, anonKey: value.anonKey };
  } catch { /* Keep the injected project configuration as the fallback. */ }
  return defaultConfig;
}

export function saveSupabaseConfig(config: SupabaseConfig) { localStorage.setItem(configStorageKey, JSON.stringify(config)); }

export function createSupabaseClient(config: SupabaseConfig = readSupabaseConfig()): SupabaseClient {
  return createClient(config.url.replace(/\/$/, ""), config.anonKey.trim(), { auth: { persistSession: false, autoRefreshToken: false } });
}

export const supabase = createSupabaseClient();

export function btlRoleLabel(role: string) {
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "super_admin" || normalized === "superadmin") return "Support";
  if (normalized === "sub_admin" || normalized === "sous_admin") return "Opérations";
  if (normalized === "supervisor" || normalized === "superviseur") return "Superviseur";
  return role;
}

function normalizeBtlProfiles(rows: Array<Record<string, unknown>>): SupabaseBtlProfile[] {
  return rows
    .filter((profile) => typeof profile.full_name === "string" && profile.full_name.trim())
    .map((profile) => ({ id: String(profile.id), full_name: String(profile.full_name).trim(), role: String(profile.role), avatar_url: typeof profile.avatar_url === "string" ? profile.avatar_url : null }));
}

function readCachedBtlProfiles(): SupabaseBtlProfile[] | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(btlProfileCacheKey) ?? "") as { savedAt?: number; profiles?: SupabaseBtlProfile[] };
    if (typeof cached.savedAt !== "number" || Date.now() - cached.savedAt > btlProfileCacheTtlMs || !Array.isArray(cached.profiles)) return null;
    return cached.profiles;
  } catch { return null; }
}

function cacheBtlProfiles(profiles: SupabaseBtlProfile[]) {
  try { sessionStorage.setItem(btlProfileCacheKey, JSON.stringify({ savedAt: Date.now(), profiles })); } catch { /* Cache is optional. */ }
}

export async function loadBtlLoginProfiles(): Promise<SupabaseBtlProfile[]> {
  const cached = readCachedBtlProfiles();
  if (cached) return cached;
  if (btlProfilesRequest) return btlProfilesRequest;
  btlProfilesRequest = (async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id,full_name,role,avatar_url")
      .in("role", btlLoginRoles)
      .order("full_name", { ascending: true });
    if (error) throw new Error("Impossible de charger les profils BTL autorisés.");
    const profiles = normalizeBtlProfiles(data ?? []);
    cacheBtlProfiles(profiles);
    return profiles;
  })();
  try { return await btlProfilesRequest; }
  finally { btlProfilesRequest = null; }
}

export function warmBtlLoginProfiles() { void loadBtlLoginProfiles().catch(() => undefined); }

export async function authenticateBtlProfile(profileId: string, password: string): Promise<SupabaseBtlProfile> {
  if (!profileId || !password) throw new Error("Saisissez le mot de passe du profil sélectionné.");
  const { data: profile, error } = await supabase
    .from("users")
    .select("id,full_name,role,avatar_url")
    .eq("id", profileId)
    .in("role", btlLoginRoles)
    .eq("password_hash", password)
    .maybeSingle();
  if (error || !profile) throw new Error("Mot de passe incorrect pour ce profil.");
  // A scoped WEWA token also permits BTL reporting when client visibility is disabled.
  // Login to the existing applications remains available if WEWA is not deployed yet.
  try {
    const session = await supabase.rpc("wewa_open_session", { p_actor_id: profile.id, p_password: password });
    if (!session.error && session.data?.token) sessionStorage.setItem("orbit-wewa-session", JSON.stringify({ actorId: profile.id, token: session.data.token, expiresAt: session.data.expires_at }));
  } catch { /* Other campaign logins remain independent of WEWA. */ }
  return { id: profile.id, full_name: profile.full_name, role: profile.role, avatar_url: profile.avatar_url };
}

async function uploadBtlAvatar(profileId: string, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("La photo de profil doit être une image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("La photo de profil ne doit pas dépasser 5 Mo.");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `btl-profiles/${profileId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("La photo de profil n’a pas pu être téléversée.");
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("La photo a été téléversée mais son URL n’est pas disponible.");
  return data.publicUrl;
}

export async function updateBtlProfile(profileId: string, update: { password?: string; avatarFile?: File }): Promise<SupabaseBtlProfile> {
  const payload: Record<string, string | null> = { profile_updated_at: new Date().toISOString() };
  if (typeof update.password === "string" && update.password) payload.password_hash = update.password;
  if (update.avatarFile) payload.avatar_url = await uploadBtlAvatar(profileId, update.avatarFile);
  const { data, error } = await supabase.from("users").update(payload).eq("id", profileId).select("id,full_name,role,avatar_url").maybeSingle();
  if (error || !data) throw new Error("La mise à jour du profil a échoué.");
  const profile = { id: data.id, full_name: data.full_name, role: data.role, avatar_url: data.avatar_url };
  const cached = readCachedBtlProfiles();
  if (cached) cacheBtlProfiles(cached.map((item) => item.id === profile.id ? profile : item));
  return profile;
}

export type BtlAuditEventInput = { actorName: string; action: string; summary: string; entityType: string; entityId?: string | null; campaignId?: string | null; metadata?: Record<string, unknown> };
export async function logBtlDataChange(event: BtlAuditEvent | BtlAuditEventInput) {
  const payload: BtlAuditEvent = "actorName" in event ? { actor_name: event.actorName, actor_role: "btl", action: event.action, entity_type: event.entityType, entity_id: event.entityId ?? null, campaign_id: event.campaignId ?? null, summary: event.summary, after_state: event.metadata ?? null } : event;
  const { error } = await supabase.from("btl_data_change_log").insert(payload);
  if (error) throw new Error("La modification a été appliquée mais sa journalisation a échoué.");
}

export async function loadRecentBtlDataChanges(limit = 12) {
  const { data, error } = await supabase.from("btl_data_change_log").select("id,actor_name,actor_role,action,entity_type,entity_id,summary,created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error("Impossible de charger le journal des modifications.");
  return data ?? [];
}

export async function authenticateSupabaseSuperadmin(phone: string, password: string): Promise<SupabaseSuperadminProfile> {
  const normalizedPhone = phone.trim();
  if (!normalizedPhone || !password) throw new Error("Saisissez le numéro de téléphone et le mot de passe superadministrateur.");
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id,full_name,phone,role")
    .eq("phone", normalizedPhone)
    .in("role", ["super_admin", "superadmin"])
    .eq("password_hash", password)
    .maybeSingle();
  if (profileError || !profile) throw new Error("Connexion superadministrateur refusée.");
  return { id: profile.id, full_name: profile.full_name, role: profile.role === "superadmin" ? "superadmin" : "super_admin" };
}

export function wewaReportingToken(): string | null {
  try {
    const actor = JSON.parse(localStorage.getItem("vodacom-session") ?? "{}");
    const session = JSON.parse(sessionStorage.getItem("orbit-wewa-session") ?? "{}");
    return actor.role === "btl" && actor.profile?.id === session.actorId && Date.parse(session.expiresAt) > Date.now() ? session.token : null;
  } catch { return null; }
}
