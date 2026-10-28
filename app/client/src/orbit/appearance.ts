// Apparence Orbit : ambiance cosmique et réglages de matière (opacité, flou, ombre, lueur), propres à chaque appareil.
// Les curseurs vont de 0 à 100 ; 50 est l'apparence de référence (même règle que le tracker).
import { useSyncExternalStore } from "react";

export type Ambiance = "aurore" | "nebuleuse" | "aube" | "starfly" | "blackhole" | "pulsar";
export type Appearance = { ambiance: Ambiance; solidity: number; blur: number; shadow: number; glow: number };

export const AMBIANCES: { id: Ambiance; label: string; hint: string; light?: boolean; themeColor: string }[] = [
  { id: "aurore", label: "Aurore", hint: "Rideaux boréals sur la nuit", themeColor: "#040915" },
  { id: "nebuleuse", label: "Nébuleuse", hint: "Poussières violettes et roses", themeColor: "#07040f" },
  { id: "pulsar", label: "Pulsar", hint: "Faisceaux qui battent la mesure", themeColor: "#03060f" },
  { id: "blackhole", label: "Trou noir", hint: "Le noir, et un anneau de lumière", themeColor: "#000000" },
  { id: "starfly", label: "Starfly", hint: "Ciel clair, étoiles filantes", light: true, themeColor: "#eaf2ff" },
  { id: "aube", label: "Aube", hint: "Lever de jour, tons chauds", light: true, themeColor: "#f7f1ea" },
];

export const SLIDERS: { key: Exclude<keyof Appearance, "ambiance">; label: string }[] = [
  { key: "solidity", label: "Opacité" },
  { key: "blur", label: "Flou" },
  { key: "shadow", label: "Ombre" },
  { key: "glow", label: "Lueur" },
];

export const DEFAULT_APPEARANCE: Appearance = { ambiance: "aurore", solidity: 50, blur: 50, shadow: 50, glow: 50 };
const KEY = "orbit-appearance";
const listeners = new Set<() => void>();
let current: Appearance = read();

function clamp(value: unknown, fallback: number) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function read(): Appearance {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Appearance>;
    const ambiance = AMBIANCES.some((item) => item.id === saved.ambiance) ? (saved.ambiance as Ambiance) : DEFAULT_APPEARANCE.ambiance;
    return { ambiance, solidity: clamp(saved.solidity, 50), blur: clamp(saved.blur, 50), shadow: clamp(saved.shadow, 50), glow: clamp(saved.glow, 50) };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function applyAppearance(next: Appearance = current) {
  const root = document.documentElement;
  const meta = AMBIANCES.find((item) => item.id === next.ambiance) ?? AMBIANCES[0];
  root.dataset.ambiance = next.ambiance;
  root.style.colorScheme = meta.light ? "light" : "dark";
  root.style.setProperty("--ui-solidity-n", String(next.solidity));
  root.style.setProperty("--ui-blur-n", String(next.blur));
  root.style.setProperty("--ui-shadow-n", String(next.shadow));
  root.style.setProperty("--ui-glow-n", String(next.glow));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", meta.themeColor);
}

export function setAppearance(patch: Partial<Appearance>) {
  const next = { ...current, ...patch };
  const ambianceChanged = next.ambiance !== current.ambiance;
  current = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* stockage indisponible : l'apparence reste pour la session */ }
  // Changement d'ambiance : fondu enchaîné de toute la page quand le navigateur sait le faire.
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ambianceChanged && doc.startViewTransition && !reduce) doc.startViewTransition(() => applyAppearance(next));
  else applyAppearance(next);
  listeners.forEach((listener) => listener());
}

export function useAppearance() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => current, () => current);
}
