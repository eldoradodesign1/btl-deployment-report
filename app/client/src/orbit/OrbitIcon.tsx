// Icône Orbit (piste « Orbite ») : l'anneau de verre, sa trajectoire et le point corail du hero d'origine.
import { useId } from "react";

export const APP_NAME = "Orbit";
export const APP_TAGLINE = "BTL · Rapports de campagne";

export function OrbitIcon({ size = 34, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`orbit-icon ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}bg`} cx="70%" cy="20%" r="95%">
          <stop offset="0" stopColor="#1b2f6b" />
          <stop offset=".55" stopColor="#0a1433" />
          <stop offset="1" stopColor="#040915" />
        </radialGradient>
        <linearGradient id={`${id}ring`} x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c8fffa" />
          <stop offset=".5" stopColor="#8be8e5" />
          <stop offset="1" stopColor="#9b86ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}bg)`} />
      <rect x="14" y="10" width="5" height="40" rx="2.5" fill="#4a7dff" opacity=".22" />
      <rect x="45" y="8" width="4" height="36" rx="2" fill="#a77bff" opacity=".22" />
      <ellipse cx="32" cy="33" rx="17" ry="18" fill="none" stroke={`url(#${id}ring)`} strokeWidth="5" />
      <ellipse cx="32" cy="33" rx="10.5" ry="11.5" fill="none" stroke="#dff" strokeOpacity=".28" strokeWidth="1.2" />
      <path d="M9 58 C 22 44, 38 30, 60 9" fill="none" stroke="#6fe9ff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="40.6" cy="25.6" r="4.6" fill="#ff795c" />
      <circle cx="39.4" cy="24.4" r="1.4" fill="#fff0d4" />
    </svg>
  );
}
