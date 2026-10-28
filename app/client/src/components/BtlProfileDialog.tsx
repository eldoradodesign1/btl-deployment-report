// Design philosophy: Halo Opaline — role identity is legible at a glance through calm, colored glass tiles.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Crown, KeyRound, LoaderCircle, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { authenticateBtlProfile, btlRoleLabel, loadBtlLoginProfiles, type SupabaseBtlProfile } from "@/lib/supabase";
import "@/login-compact.css";

type Props = { onAuthenticated: (profile: SupabaseBtlProfile) => void; onClose: () => void; context?: "login" | "switch" };

function ProfileRoleIcon({ role, size = 19 }: { role: string; size?: number }) {
  const normalized = role.toLowerCase();
  if (normalized === "admin") return <ShieldCheck size={size} />;
  if (normalized === "super_admin" || normalized === "superadmin") return <Crown size={size} />;
  if (normalized === "sub_admin" || normalized === "sous_admin") return <BadgeCheck size={size} />;
  return <UsersRound size={size} />;
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }

export { ProfileRoleIcon, initials };

export default function BtlProfileDialog({ onAuthenticated, onClose, context = "login" }: Props) {
  const [profiles, setProfiles] = useState<SupabaseBtlProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<SupabaseBtlProfile | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const title = context === "switch" ? "Choisissez le profil BTL" : "Choisissez votre profil";
  const subtitle = context === "switch" ? "CHANGEMENT DE COMPTE" : "ACCÈS BTL";
  const selectedRole = useMemo(() => selectedProfile?.role.replaceAll("_", "-") ?? "", [selectedProfile]);
  const loadProfiles = async () => {
    setProfilesLoading(true); setProfilesError("");
    try { setProfiles(await loadBtlLoginProfiles()); }
    catch (loadError) { setProfilesError(loadError instanceof Error ? loadError.message : "Impossible de charger les profils BTL autorisés."); }
    finally { setProfilesLoading(false); }
  };
  useEffect(() => { void loadProfiles(); }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProfile) return;
    setVerifying(true); setError("");
    try { onAuthenticated(await authenticateBtlProfile(selectedProfile.id, password)); }
    catch (authError) { setError(authError instanceof Error ? authError.message : "Connexion BTL refusée."); }
    finally { setVerifying(false); }
  };
  return <div className="btl-login-modal-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="btl-login-modal glass-card" role="dialog" aria-modal="true" aria-label={title}><div className="btl-login-modal-head"><div><span>{subtitle}</span><h2>{selectedProfile ? "Confirmez votre identité" : title}</h2></div><button type="button" className="btl-dialog-close" onClick={onClose} aria-label="Fermer"><span>×</span></button></div>{selectedProfile ? <form className="btl-password-form" onSubmit={verify}><button type="button" className="btl-back-button" onClick={() => { setSelectedProfile(null); setPassword(""); setError(""); }}><ArrowLeft size={14} /> Changer de profil</button><div className="btl-selected-profile"><span className={`btl-profile-avatar btl-role-${selectedRole}`}>{selectedProfile.avatar_url ? <img src={selectedProfile.avatar_url} alt="" /> : <ProfileRoleIcon role={selectedProfile.role} size={20} />}</span><div><strong>{selectedProfile.full_name}</strong><small>{btlRoleLabel(selectedProfile.role)}</small></div></div><label className="btl-password-field"><span><KeyRound size={14} /> Mot de passe</span><input value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} type="password" autoComplete="current-password" autoFocus placeholder="Saisissez votre mot de passe" aria-label="Mot de passe du profil sélectionné" /></label>{error && <div className="login-error">{error}</div>}<button className="btl-confirm-button" type="submit" disabled={verifying}>{verifying ? <><LoaderCircle className="spin" size={16} /> Vérification</> : <><ShieldCheck size={16} /> Ouvrir le pilotage</>}</button></form> : <div className="btl-profiles-stage">{profilesLoading && <div className="btl-profiles-loading"><LoaderCircle className="spin" size={18} /> Chargement des profils autorisés</div>}{profilesError && <div className="btl-profiles-error"><p>{profilesError}</p><button type="button" onClick={() => void loadProfiles()}>Réessayer</button></div>}{!profilesLoading && !profilesError && !profiles.length && <div className="btl-profiles-error"><p>Aucun profil BTL autorisé n’est disponible.</p></div>}{!profilesLoading && !profilesError && profiles.length > 0 && <div className="btl-profile-grid">{profiles.map((profile) => <button type="button" className={`btl-profile-tile btl-role-${profile.role.replaceAll("_", "-")}`} onClick={() => { setSelectedProfile(profile); setError(""); }} key={profile.id}><span className="btl-profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <ProfileRoleIcon role={profile.role} />}</span><strong>{profile.full_name}</strong><small><ProfileRoleIcon role={profile.role} size={11} /> {btlRoleLabel(profile.role)}</small></button>)}</div>}</div>}</section></div>;
}
