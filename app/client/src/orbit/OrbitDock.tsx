// Dock du téléphone : quatre destinations libellées et l'export au centre, en action principale.
import { Activity, Database, Download, LayoutDashboard, Users } from "lucide-react";

const DATA_PAGES = ["activations", "analysis", "quality", "import"];

export function OrbitDock({ page, onNavigate, onExport }: { page: string; onNavigate: (page: string) => void; onExport: () => void }) {
  const tab = (id: string, label: string, Icon: typeof Activity, active: boolean) => (
    <button type="button" className={`orbit-dock-tab ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onNavigate(id)}>
      <Icon size={20} strokeWidth={1.9} /><span>{label}</span>
    </button>
  );
  return (
    <nav className="orbit-dock" aria-label="Navigation">
      {tab("dashboard", "Accueil", LayoutDashboard, page === "dashboard")}
      {tab("activity", "Activité", Activity, page === "activity")}
      <button type="button" className="orbit-dock-tab orbit-dock-export" onClick={onExport}><span className="orbit-dock-fab"><Download size={21} strokeWidth={2} /></span><span>Export</span></button>
      {tab("agents", "Terrain", Users, page === "agents" || page === "shops")}
      {tab("activations", "Données", Database, DATA_PAGES.includes(page))}
    </nav>
  );
}
