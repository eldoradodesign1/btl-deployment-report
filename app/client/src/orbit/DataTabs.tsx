// Onglets de l'espace Données : les écrans de lecture et de contrôle, au même endroit.
import type { ComponentType } from "react";

type Item = { id: string; label: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }> };

export function DataTabs({ items, page, onSelect, label = "Données" }: { items: Item[]; page: string; onSelect: (id: string) => void; label?: string }) {
  return (
    <nav className="orbit-tabs" aria-label={label}>
      {items.map(({ id, label: text, icon: Icon }) => (
        <button key={id} type="button" className={page === id ? "is-active" : ""} aria-current={page === id ? "page" : undefined} onClick={() => onSelect(id)}>
          {Icon && <Icon size={15} strokeWidth={1.9} />}{text}
        </button>
      ))}
    </nav>
  );
}
