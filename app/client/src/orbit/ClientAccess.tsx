// Accès client : ce que le profil Vodacom voit de chaque campagne (campagne, objectifs, questions à l'IA).
// Réservé aux comptes admin et super_admin BTL ; chaque bascule est enregistrée aussitôt.
import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Sparkles, Target } from "lucide-react";
import type { Campaign } from "@/lib/campaigns";
import { campaignTerms } from "@/lib/campaigns";
import { loadCampaigns } from "@/lib/supabaseData";
import { defaultAccess, loadAiQuota, loadClientAccess, saveAiQuota, saveClientAccess, type ClientAccess } from "@/lib/clientAccess";
import { Toggle } from "@/orbit/DataKit";

const statusLabel = (campaign: Campaign) => campaign.status === "active" ? "en cours" : campaign.status === "archived" ? "terminée" : "en préparation";
const columns: { key: keyof ClientAccess; label: string; icon: typeof Eye }[] = [
  { key: "campaignVisible", label: "Voir la campagne", icon: Eye },
  { key: "targetsVisible", label: "Voir les objectifs", icon: Target },
  { key: "aiQuestions", label: "Questions à l'IA", icon: Sparkles },
];

export function ClientAccessPage({ actorId }: { actorId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [access, setAccess] = useState<Record<string, ClientAccess>>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { Promise.all([loadCampaigns(), loadClientAccess()]).then(([list, rows]) => { setCampaigns(list); setAccess(rows); }).catch((error) => setMessage(error instanceof Error ? error.message : "Chargement impossible.")); }, []);
  const needle = query.trim().toLocaleLowerCase("fr");
  const shown = useMemo(() => campaigns.filter((campaign) => !needle || `${campaign.name} ${statusLabel(campaign)}`.toLocaleLowerCase("fr").includes(needle)), [campaigns, needle]);

  const toggle = async (campaign: Campaign, key: keyof ClientAccess, value: boolean) => {
    const before = access[campaign.id] ?? defaultAccess;
    const next = { ...before, [key]: value };
    setAccess((current) => ({ ...current, [campaign.id]: next }));
    setSaving(`${campaign.id}|${key}`); setMessage("");
    try { await saveClientAccess(actorId, campaign.id, next); }
    catch (error) { setAccess((current) => ({ ...current, [campaign.id]: before })); setMessage(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { setSaving(""); }
  };

  return <div className="module-page orbit-access">
    <header className="orbit-access-head">
      <div><h2>Accès client</h2><p>Ce que Vodacom voit de chaque campagne. Chaque changement s'applique aussitôt.</p></div>
      <label className="orbit-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une campagne" aria-label="Rechercher une campagne" /></label>
    </header>
    {message && <p className="orbit-access-message" role="alert">{message}</p>}
    <section className="orbit-access-list glass-card" aria-label="Campagnes">
      <div className="orbit-access-row is-head" aria-hidden="true"><span>Campagne</span>{columns.map(({ key, label, icon: Icon }) => <span key={key}><Icon size={14} />{label}</span>)}</div>
      {shown.map((campaign) => { const current = access[campaign.id] ?? defaultAccess; const terms = campaignTerms(campaign.campaignType); return <div className={`orbit-access-row ${current.campaignVisible ? "" : "is-hidden"}`} key={campaign.id}>
        <span className="orbit-access-name"><b>{campaign.name}</b><small>{campaign.campaignType === "hostess" ? "Hôtesses" : terms.participants} · {statusLabel(campaign)}</small></span>
        {columns.map(({ key, label }) => { const disabled = key !== "campaignVisible" && !current.campaignVisible; return <span className={`orbit-access-cell ${disabled ? "is-off" : ""} ${saving === `${campaign.id}|${key}` ? "is-saving" : ""}`} key={key}><em>{label}</em><Toggle checked={current[key] && !disabled} label={`${label} · ${campaign.name}`} onChange={(value) => { if (!disabled) void toggle(campaign, key, value); }} /></span>; })}
      </div>; })}
      {!shown.length && <p className="orbit-access-empty">{campaigns.length ? `Aucune campagne ne correspond à « ${query.trim()} ».` : "Chargement des campagnes…"}</p>}
    </section>
  </div>;
}

// Réglage du plafond de questions par jour (navigateur Vodacom ou compte BTL) : super_admin seulement.
export function AiQuotaSetting({ actorId }: { actorId: string }) {
  const [quota, setQuota] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  useEffect(() => { loadAiQuota().then((value) => { setQuota(value); setDraft(String(value)); }).catch(() => setMessage("Réglage indisponible.")); }, []);
  const value = Number(draft);
  const valid = draft.trim() !== "" && Number.isInteger(value) && value >= 0 && value <= 1000;
  const save = async () => { if (!valid) return; setState("saving"); setMessage(""); try { await saveAiQuota(actorId, value); setQuota(value); setState("saved"); window.setTimeout(() => setState("idle"), 1800); } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Enregistrement impossible."); } };
  const step = (delta: number) => setDraft(String(Math.max(0, Math.min(1000, (Number(draft) || 0) + delta))));
  return <section className="orbit-settings-card glass-card orbit-quota" aria-label="Questions à l'IA">
    <h2>Questions à l'IA</h2>
    <p>Nombre de questions par jour, pour chaque navigateur Vodacom et chaque compte BTL.</p>
    <div className="orbit-quota-field">
      <button type="button" className="orbit-quota-step" onClick={() => step(-5)} aria-label="Moins 5">−</button>
      <input inputMode="numeric" value={draft} onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 4))} aria-label="Questions par jour" />
      <button type="button" className="orbit-quota-step" onClick={() => step(5)} aria-label="Plus 5">+</button>
      <span>par jour</span>
      <button type="button" className="orbit-primary" disabled={!valid || quota === value || state === "saving"} onClick={() => void save()}>{state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : "Enregistrer"}</button>
    </div>
    {message && <small className="orbit-access-message">{message}</small>}
  </section>;
}
