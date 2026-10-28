// Réglages d'apparence : choix de l'ambiance et curseurs de matière. Utilisé dans Paramètres et dans le menu du compte.
import { useEffect, type CSSProperties } from "react";
import { RotateCcw, X } from "lucide-react";
import { AMBIANCES, DEFAULT_APPEARANCE, SLIDERS, setAppearance, useAppearance } from "./appearance";

export function AppearanceControls() {
  const appearance = useAppearance();
  const isDefault = SLIDERS.every(({ key }) => appearance[key] === DEFAULT_APPEARANCE[key]);
  return (
    <div className="orbit-appearance">
      <div className="orbit-ambiances" role="radiogroup" aria-label="Ambiance">
        {AMBIANCES.map((item) => (
          <button key={item.id} type="button" role="radio" aria-checked={appearance.ambiance === item.id} className="orbit-ambiance" onClick={() => setAppearance({ ambiance: item.id })}>
            <span className="orbit-ambiance-preview" data-ambiance-preview={item.id}><i /><i /><i /><b /></span>
            <strong>{item.label}</strong>
            <small>{item.hint}</small>
          </button>
        ))}
      </div>
      <div className="orbit-sliders">
        {SLIDERS.map(({ key, label }) => (
          <label key={key} className="orbit-slider" style={{ "--fill": `${appearance[key]}%` } as CSSProperties}>
            <span>{label}<output>{appearance[key]}</output></span>
            <input type="range" min={0} max={100} step={1} value={appearance[key]} onChange={(event) => setAppearance({ [key]: Number(event.target.value) })} />
          </label>
        ))}
        <button type="button" className="orbit-reset" disabled={isDefault} onClick={() => setAppearance({ solidity: 50, blur: 50, shadow: 50, glow: 50 })}><RotateCcw size={14} /> Rétablir la matière</button>
      </div>
    </div>
  );
}

export function AppearanceDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="orbit-dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="orbit-dialog glass-card" role="dialog" aria-modal="true" aria-label="Apparence">
        <header><h2>Apparence</h2><button type="button" className="icon-button" aria-label="Fermer" onClick={onClose}><X size={17} /></button></header>
        <AppearanceControls />
      </section>
    </div>
  );
}
