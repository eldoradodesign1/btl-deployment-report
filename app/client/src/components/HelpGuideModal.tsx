// Halo Opaline guide: a calm, glass information surface that explains the cockpit without changing the shell layout.
import { CalendarRange, Database, Grid2X2, Keyboard, X } from "lucide-react";

type Props = { onClose: () => void };

export default function HelpGuideModal({ onClose }: Props) {
  return <div className="help-guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="help-guide-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="help-guide-title">
      <header className="help-guide-header"><div><div className="eyebrow"><Keyboard size={14} /> GUIDE D’UTILISATION</div><h2 id="help-guide-title">Lire le cockpit BTL.</h2><p>Un aperçu rapide pour passer de la période sélectionnée à une lecture opérationnelle complète.</p></div><button className="icon-button" type="button" aria-label="Fermer le guide" onClick={onClose}><X size={17} /></button></header>
      <div className="help-guide-body">
        <section className="help-guide-section"><span className="help-guide-icon"><CalendarRange size={17} /></span><div><h3>Filtrer la période</h3><p>Choisissez une semaine ou déplacez directement les deux poignées du double slider. Sur le Dashboard, la courbe permet aussi de déplacer les bornes ; la sélection reste visible dans la topbar quand vous changez de menu.</p></div></section>
        <section className="help-guide-section"><span className="help-guide-icon"><Grid2X2 size={17} /></span><div><h3>Lire les menus</h3><p>Dashboard donne la cadence et les signaux. Activité détaille les dates, agents et shops. Performances & attendance croise deux dimensions ; les cellules sans présence à une date affichent <strong>Absent</strong>.</p></div></section>
        <section className="help-guide-section"><span className="help-guide-icon"><Database size={17} /></span><div><h3>Importer d’autres données</h3><p>Depuis Import & sources, déposez un CSV ou un classeur XLS/XLSX. Vérifiez l’aperçu, les anomalies et validez. Le compte BTL peut aussi synchroniser une source Supabase après vérification administrateur.</p></div></section>
        <section className="help-guide-section help-guide-shortcuts"><span className="help-guide-icon"><Keyboard size={17} /></span><div><h3>Raccourcis clavier</h3><div className="help-guide-key-grid"><span><kbd>D</kbd> Dashboard</span><span><kbd>A</kbd> Activité</span><span><kbd>G</kbd> Agents</span><span><kbd>S</kbd> Shops</span><span><kbd>I</kbd> Activations</span><span><kbd>P</kbd> Performances</span><span><kbd>Q</kbd> Qualité</span><span><kbd>M</kbd> Import</span><span><kbd>T</kbd> Paramètres</span><span><kbd>Alt+0</kbd> Toute la période</span><span><kbd>Alt+1–9</kbd> Semaine choisie</span><span><kbd>Alt+S</kbd> Compte</span><span><kbd>Alt+L</kbd> Déconnexion</span><span><kbd>Échap</kbd> Fermer</span></div><small>Les raccourcis de navigation sont suspendus pendant la saisie dans un champ texte.</small></div></section>
      </div>
    </article>
  </div>;
}
