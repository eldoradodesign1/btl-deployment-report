import { ChevronDown, LogOut } from "lucide-react";
import { type RefObject } from "react";
import { type Role, type Session } from "@/lib/roles";

type Props = {
  session: Session;
  accountOpen: boolean;
  accountRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onSwitchRole: (role: Role) => void;
  onOpenBtlPicker: () => void;
  onLogout: () => void;
};

export default function MobileProfileControl({
  session,
  accountOpen,
  accountRef,
  onToggle,
  onSwitchRole,
  onOpenBtlPicker,
  onLogout,
}: Props) {
  return <div className="mobile-profile-control" ref={accountRef}>
    <button type="button" className={`mobile-profile-button icon-button ${accountOpen ? "is-open" : ""}`} aria-label="Changer de profil" aria-expanded={accountOpen} onClick={onToggle}>
      <span className={`avatar avatar-session-${session.role}`}>{session.label.slice(0, 2).toUpperCase()}</span>
      <ChevronDown size={13} />
    </button>
    {accountOpen && <div className="mobile-profile-menu glass-card" role="menu" aria-label="Changer de profil">
      <div className="account-menu-label">CHANGER DE COMPTE</div>
      <button type="button" className="mobile-profile-option account-menu-option" onClick={onOpenBtlPicker}>
        <span className="mobile-profile-option-avatar avatar-session-btl">BT</span>
        <span className="mobile-profile-option-copy"><strong>BTL</strong><small>Pilotage complet</small></span>
        {session.role === "btl" && <em>ACTIF</em>}
      </button>
      <button type="button" className="mobile-profile-option account-menu-option" onClick={() => onSwitchRole("vodacom")}>
        <span className="mobile-profile-option-avatar avatar-session-vodacom">VO</span>
        <span className="mobile-profile-option-copy"><strong>Vodacom</strong><small>Lecture uniquement</small></span>
        {session.role === "vodacom" && <em>ACTIF</em>}
      </button>
      <button type="button" className="account-menu-logout" onClick={onLogout}><LogOut size={14} /> Déconnexion</button>
    </div>}
  </div>;
}
