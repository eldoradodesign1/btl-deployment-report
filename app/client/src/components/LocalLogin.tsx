// Design philosophy: Halo Opaline — Vodacom stays direct while BTL reaches a visually legible identity tile field.
import { useEffect, useState } from "react";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import "@/login-compact.css";
import { type Role } from "@/lib/roles";
import BtlProfileDialog from "@/components/BtlProfileDialog";
import { warmBtlLoginProfiles, type SupabaseBtlProfile } from "@/lib/supabase";
import { OrbitSky } from "@/orbit/OrbitSky";
import { APP_NAME, APP_TAGLINE, OrbitIcon } from "@/orbit/OrbitIcon";

type Props = { onLogin: (role: Role, profile?: SupabaseBtlProfile) => void };

export default function LocalLogin({ onLogin }: Props) {
  const loginRelease = "profiles-20260819";
  const [role, setRole] = useState<Role>("vodacom");
  const [btlDialogOpen, setBtlDialogOpen] = useState(false);
  const isBtl = role === "btl";
  useEffect(() => { warmBtlLoginProfiles(); }, []);
  const openBtlDialog = () => { setRole("btl"); setBtlDialogOpen(true); };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (role === "vodacom") onLogin("vodacom"); else openBtlDialog(); };
  return <main className="login-screen" data-login-release={loginRelease}><OrbitSky context="login" /><section className="login-card glass-card"><div className="login-brand"><div className="brand-mark"><OrbitIcon size={44} /></div><div><div className="brand-name">{APP_NAME}</div><div className="brand-sub">{APP_TAGLINE}</div></div></div><div className="login-heading login-heading-minimal"><h1>Connexion</h1></div><div className="avatar-switch" role="tablist" aria-label="Choisissez votre avatar"><button className={`avatar-option ${!isBtl ? "is-selected" : ""}`} onClick={() => { setRole("vodacom"); setBtlDialogOpen(false); }} role="tab" aria-selected={!isBtl}><span className="avatar-portrait avatar-vodacom"><Eye size={17} /></span><strong>Vodacom</strong>{!isBtl && <span className="avatar-check">●</span>}</button><button className={`avatar-option ${isBtl ? "is-selected" : ""}`} onClick={openBtlDialog} role="tab" aria-selected={isBtl}><span className="avatar-portrait avatar-btl"><Sparkles size={17} /></span><strong>BTL</strong>{isBtl && <span className="avatar-check">●</span>}</button></div><form onSubmit={submit} className="login-form login-form-minimal"><button className="login-submit" type="submit">{isBtl ? "Choisir un utilisateur" : "Continuer"} <ArrowRight size={16} /></button></form></section>{btlDialogOpen && <BtlProfileDialog onClose={() => setBtlDialogOpen(false)} onAuthenticated={(profile) => onLogin("btl", profile)} />}</main>;
}
