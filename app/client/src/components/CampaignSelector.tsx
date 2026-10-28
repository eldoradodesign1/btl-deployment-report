import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { campaignTerms, vodacomCampaignCode, type Campaign } from "@/lib/campaigns";
import { loadCampaigns } from "@/lib/supabaseData";
import { readSession } from "@/lib/roles";

type Props = { campaigns?: Campaign[]; selectedId?: string; onSelect?: (campaign: Campaign) => void };

const statusLabel = (campaign: Campaign) => campaign.status === "active" ? "en cours" : campaign.status === "archived" ? "terminée" : "en préparation";
const kindLabel = (campaign: Campaign) => { const terms = campaignTerms(campaign.campaignType); return campaign.campaignType === "hostess" ? "Hôtesses · Activations" : `${terms.participants} · ${terms.records}`; };

// Choix de la campagne : un bouton dans la barre latérale ouvre une palette de commande avec recherche (touche C),
// pensée pour un catalogue qui grandit. Les events ne sont pas des campagnes et n'y figurent pas.
export default function CampaignSelector({ campaigns: suppliedCampaigns, selectedId: suppliedSelectedId, onSelect }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => { try { const cached = JSON.parse(localStorage.getItem("btl-campaign-catalog") ?? "[]") as Campaign[]; return Array.isArray(cached) ? cached : []; } catch { return []; } });
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const session = readSession();
  const displayedCampaigns = (suppliedCampaigns?.length ? suppliedCampaigns : campaigns).filter((campaign) => (campaign.campaignType as string) !== "event");
  const selectedId = suppliedSelectedId ?? localStorage.getItem("btl-selected-campaign") ?? "";
  const selected = displayedCampaigns.find((campaign) => campaign.id === selectedId) ?? displayedCampaigns.find((campaign) => campaign.code === vodacomCampaignCode) ?? displayedCampaigns[0];
  const needle = query.trim().toLocaleLowerCase("fr");
  const shown = useMemo(() => displayedCampaigns.filter((campaign) => !needle || `${campaign.name} ${kindLabel(campaign)} ${statusLabel(campaign)}`.toLocaleLowerCase("fr").includes(needle)), [displayedCampaigns, needle]);

  useEffect(() => { if (!suppliedCampaigns?.length && session) loadCampaigns().then((availableCampaigns) => { setCampaigns(availableCampaigns); localStorage.setItem("btl-campaign-catalog", JSON.stringify(availableCampaigns)); }).catch(() => undefined); }, [session?.role, suppliedCampaigns?.length]);
  useEffect(() => { if (selected) document.documentElement.dataset.campaignType = selected.campaignType; }, [selected?.campaignType]);
  useEffect(() => {
    const attach = () => setHost(document.querySelector<HTMLElement>(".sidebar-context"));
    const frame = window.requestAnimationFrame(attach);
    return () => window.cancelAnimationFrame(frame);
  }, [session?.role]);
  // Touche C (hors champ de saisie) et demande d'ouverture depuis l'en-tête du téléphone
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key.toLowerCase() !== "c" || event.ctrlKey || event.metaKey || event.altKey || target.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      setOpen(true);
    };
    const onAsk = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("orbit:campaigns", onAsk);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("orbit:campaigns", onAsk); };
  }, []);
  useEffect(() => { if (open) setActive(Math.max(0, shown.findIndex((campaign) => campaign.id === selected?.id))); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [active]);
  if (!session || displayedCampaigns.length < 2 || !selected) return null;

  const close = () => { setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false); setQuery(""); }, 180); };
  const choose = (campaign: Campaign) => {
    if (campaign.id === selected.id) { close(); return; }
    localStorage.setItem("btl-selected-campaign", campaign.id);
    localStorage.setItem("btl-selected-campaign-type", campaign.campaignType);
    if (onSelect) onSelect(campaign);
    else window.location.reload();
  };
  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (event.key === "Enter") { event.preventDefault(); if (shown[active]) choose(shown[active]); }
  };

  return <>
    {host && createPortal(<div className="campaign-selector-wrap"><button type="button" className="campaign-selector-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Choisir la campagne" title="Changer de campagne · touche C"><span className="campaign-selector-dot" /><span><b>{selected.name}</b><small>{triggerLabel(selected)}</small></span><ChevronsUpDown size={15} /></button></div>, host)}
    {open && createPortal(<div className={`orbit-palette-backdrop ${closing ? "is-closing" : ""}`} onPointerDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="orbit-palette" role="dialog" aria-modal="true" aria-label="Choisir la campagne" onKeyDown={onKey}>
        <label className="orbit-palette-search"><Search size={18} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} placeholder="Rechercher une campagne" aria-label="Rechercher une campagne" /><kbd>Échap</kbd></label>
        <div ref={listRef} className="orbit-palette-list" role="listbox" aria-label="Campagnes">
          {shown.map((campaign, index) => <div key={campaign.id} role="option" data-index={index} aria-selected={campaign.id === selected.id} className={`orbit-palette-item ${index === active ? "is-active" : ""}`} onPointerEnter={() => setActive(index)} onClick={() => choose(campaign)}>
            <span className="campaign-selector-dot" /><span className="orbit-palette-text"><b>{campaign.name}</b><small>{kindLabel(campaign)} · {statusLabel(campaign)}</small></span>{campaign.id === selected.id && <Check size={16} />}
          </div>)}
          {!shown.length && <p className="orbit-palette-empty">Aucune campagne ne correspond à « {query.trim()} ».</p>}
        </div>
        <footer className="orbit-palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> parcourir</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>C</kbd> rouvrir la palette</span></footer>
      </div>
    </div>, document.querySelector(".app-shell") ?? document.body)}
  </>;
}

function triggerLabel(campaign: Campaign) {
  return `${campaign.campaignType === "hostess" ? "Hôtesses" : campaignTerms(campaign.campaignType).participants} · ${statusLabel(campaign)}`;
}
