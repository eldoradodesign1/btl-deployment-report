// Design philosophy: Halo Opaline — access is explicit, calm and visible without exposing unnecessary detail.
export type Role = "vodacom" | "btl";
export type Session = { role: Role; label: "Vodacom" | "BTL" };

export const roleConfig = {
  vodacom: { label: "Vodacom", mode: "Lecture uniquement", canSeePerformance: false, canEdit: false, canImport: false, canConfigure: false },
  btl: { label: "BTL", mode: "Pilotage complet", canSeePerformance: true, canEdit: true, canImport: true, canConfigure: true },
} as const;

export function readSession(): Session | null {
  try {
    const value = localStorage.getItem("vodacom-session");
    if (!value) return null;
    if (value === "pilotage@vodacom.cd") return { role: "btl", label: "BTL" };
    const parsed = JSON.parse(value) as Session;
    return parsed.role === "vodacom" || parsed.role === "btl" ? parsed : null;
  } catch { return null; }
}

export function writeSession(role: Role) {
  const session: Session = role === "btl" ? { role, label: "BTL" } : { role, label: "Vodacom" };
  localStorage.setItem("vodacom-session", JSON.stringify(session));
  return session;
}
