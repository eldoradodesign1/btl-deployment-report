// Design philosophy: Halo Opaline — two clear entry points, one calm threshold into the campaign cockpit.
import { useState } from "react";
import { ArrowRight, Eye, LockKeyhole, Sparkles } from "lucide-react";
import "@/login-compact.css";
import { type Role } from "@/lib/roles";

const logoUrl = "/manus-storage/vodacom-opaline-logo_4fe805cb.png";
type Props = { onLogin: (role: Role) => void };

export default function LocalLogin({ onLogin }: Props) {
  const [role, setRole] = useState<Role>("vodacom");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (role === "vodacom") { onLogin("vodacom"); return; } if (password === "BTL2026") onLogin("btl"); else setError("Le mot de passe BTL ne correspond pas à la session locale."); };
  const isBtl = role === "btl";
  return <main className="login-screen"><div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" /><div className="login-trajectory"><span /> <b>PRV-26</b></div><section className="login-card glass-card"><div className="login-brand"><div className="brand-mark"><img src={logoUrl} alt="" /></div><div><div className="brand-name">BTL</div><div className="brand-sub">DEPLOYMENT REPORT</div></div><span className="login-brand-code">LOCAL / 02</span></div><div className="login-heading login-heading-minimal"><h1>Choisissez votre avatar</h1></div><div className="avatar-switch" role="tablist" aria-label="Choisissez votre avatar"><button className={`avatar-option ${!isBtl ? "is-selected" : ""}`} onClick={() => { setRole("vodacom"); setPassword(""); setError(""); }} role="tab" aria-selected={!isBtl}><span className="avatar-portrait avatar-vodacom"><Eye size={17} /></span><strong>Vodacom</strong>{!isBtl && <span className="avatar-check">●</span>}</button><button className={`avatar-option ${isBtl ? "is-selected" : ""}`} onClick={() => { setRole("btl"); setError(""); }} role="tab" aria-selected={isBtl}><span className="avatar-portrait avatar-btl"><Sparkles size={17} /></span><strong>BTL</strong>{isBtl && <span className="avatar-check">●</span>}</button></div><form onSubmit={submit} className="login-form login-form-minimal">{isBtl && <div className="input-with-icon"><LockKeyhole size={15} /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Code d’accès" aria-label="Code d’accès" /></div>}{error && <div className="login-error">{error}</div>}<button className="login-submit" type="submit">Continuer <ArrowRight size={16} /></button></form></section></main>;
}
