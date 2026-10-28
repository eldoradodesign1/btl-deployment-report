import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Layers3 } from "lucide-react";
import { campaignTerms, vodacomCampaignCode, type Campaign } from "@/lib/campaigns";
import { loadCampaigns } from "@/lib/supabaseData";
import { readSession } from "@/lib/roles";

type Props = { campaigns?: Campaign[]; selectedId?: string; onSelect?: (campaign: Campaign) => void };

export default function CampaignSelector({ campaigns: suppliedCampaigns, selectedId: suppliedSelectedId, onSelect }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => { try { const cached = JSON.parse(localStorage.getItem("btl-campaign-catalog") ?? "[]") as Campaign[]; return Array.isArray(cached) ? cached : []; } catch { return []; } });
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const session = readSession();
  const displayedCampaigns = suppliedCampaigns?.length ? suppliedCampaigns : campaigns;
  const selectedId = suppliedSelectedId ?? localStorage.getItem("btl-selected-campaign") ?? "";
  const selected = displayedCampaigns.find((campaign) => campaign.id === selectedId) ?? displayedCampaigns.find((campaign) => campaign.code === vodacomCampaignCode) ?? displayedCampaigns[0];

  useEffect(() => { if (!suppliedCampaigns?.length && session) loadCampaigns().then((availableCampaigns) => { setCampaigns(availableCampaigns); localStorage.setItem("btl-campaign-catalog", JSON.stringify(availableCampaigns)); }).catch(() => undefined); }, [session?.role, suppliedCampaigns?.length]);
  useEffect(() => { if (selected) document.documentElement.dataset.campaignType = selected.campaignType; }, [selected?.campaignType]);
  useEffect(() => {
    const attach = () => setHost(document.querySelector<HTMLElement>(".sidebar-context"));
    const frame = window.requestAnimationFrame(attach);
    return () => window.cancelAnimationFrame(frame);
  }, [session?.role]);
  useEffect(() => { if (!open) return; const close = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, [open]);
  if (!session || displayedCampaigns.length < 2 || !selected || !host) return null;

  const choose = (campaign: Campaign) => {
    localStorage.setItem("btl-selected-campaign", campaign.id);
    localStorage.setItem("btl-selected-campaign-type", campaign.campaignType);
    if (onSelect) onSelect(campaign);
    else window.location.reload();
  };
  return createPortal(<div ref={ref} className="campaign-selector-wrap"><button type="button" className={`campaign-selector-trigger ${open ? "is-open" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Choisir la campagne à monitorer"><Layers3 size={14} /><span><small>CAMPAGNE</small><b>{selected.name}</b></span><ChevronDown size={14} /></button>{open && <div className="campaign-selector-menu glass-card" role="menu">{displayedCampaigns.map((campaign) => { const terms = campaignTerms(campaign.campaignType); return <button type="button" role="menuitem" className={campaign.id === selected.id ? "is-selected" : ""} onClick={() => choose(campaign)} key={campaign.id}><span className="campaign-selector-dot" /><span><strong>{campaign.name}</strong><small>{campaign.campaignType === "brand_ambassador" ? `${terms.participants} · ${terms.records}` : "Hôtesses · Activations"}</small></span>{campaign.status === "active" && <em>ACTIVE</em>}</button>; })}</div>}</div>, host);
}
