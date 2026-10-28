// Design philosophy: Halo Opaline — keep privileged database controls calm, explicit and isolated from day-to-day BTL work.
import { useEffect, useState } from "react";
import { Database, LockKeyhole, RefreshCcw, X } from "lucide-react";
import type { SupabaseConfig, SupabaseSuperadminProfile } from "@/lib/supabase";

type Props = {
  initialConfig: SupabaseConfig;
  onAuthenticate: (phone: string, password: string) => Promise<SupabaseSuperadminProfile>;
  onSynchronize: (config: SupabaseConfig) => Promise<void>;
  onClose: () => void;
};

const messageOf = (error: unknown) => error instanceof Error ? error.message : "La synchronisation n’a pas pu être effectuée.";

export default function SupabaseSyncDialog({ initialConfig, onAuthenticate, onSynchronize, onClose }: Props) {
  const [step, setStep] = useState<"superadmin" | "config">("superadmin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState(initialConfig);
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setConfig(initialConfig); }, [initialConfig]);

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { const profile = await onAuthenticate(phone, password); setAdminName(profile.full_name); setPassword(""); setStep("config"); }
    catch (reason) { setError(messageOf(reason)); }
    finally { setBusy(false); }
  };

  const synchronize = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { await onSynchronize({ url: config.url.trim(), anonKey: config.anonKey.trim() }); onClose(); }
    catch (reason) { setError(messageOf(reason)); }
    finally { setBusy(false); }
  };

  return <div className="sync-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><section className="sync-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="sync-dialog-title"><button type="button" className="sync-modal-close" onClick={onClose} aria-label="Fermer"><X size={16} /></button><div className="sync-modal-icon"><Database size={19} /></div><div className="eyebrow">SYNCHRONISATION SUPABASE</div><h2 id="sync-dialog-title">{step === "superadmin" ? "Vérification superadministrateur" : "Paramètres de la base"}</h2><p>{step === "superadmin" ? "Un compte superadministrateur de la table users est requis avant de modifier la source." : `Superadministrateur validé : ${adminName}. Saisissez la source Supabase à synchroniser.`}</p>{step === "superadmin" ? <form onSubmit={authenticate} className="sync-form"><label>Numéro de téléphone superadministrateur<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="081…" pattern="0[0-9]{8,}" required /></label><label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Mot de passe" required /></label>{error && <div className="sync-error"><LockKeyhole size={14} /> {error}</div>}<button type="submit" className="primary-button" disabled={busy}><LockKeyhole size={14} /> {busy ? "Vérification…" : "Continuer"}</button></form> : <form onSubmit={synchronize} className="sync-form"><label>URL Supabase<input type="url" value={config.url} onChange={(event) => setConfig((current) => ({ ...current, url: event.target.value }))} placeholder="https://projet.supabase.co" required /></label><label>Clé anon publique<input type="password" value={config.anonKey} onChange={(event) => setConfig((current) => ({ ...current, anonKey: event.target.value }))} autoComplete="off" placeholder="Clé anon Supabase" required /></label>{error && <div className="sync-error"><RefreshCcw size={14} /> {error}</div>}<div className="sync-form-actions"><button type="button" className="soft-button" onClick={() => { setStep("superadmin"); setError(""); }}>Retour</button><button type="submit" className="primary-button" disabled={busy}><RefreshCcw size={14} /> {busy ? "Synchronisation…" : "Synchroniser"}</button></div></form>}</section></div>;
}
