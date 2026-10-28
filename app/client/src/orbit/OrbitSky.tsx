// Ciel vivant d'Orbit : la signature (l'image du hero d'origine) déclinée par ambiance et par écran,
// des rideaux d'aurore qui s'allongent, s'éclaircissent et pulsent, et les phénomènes propres à chaque ambiance.
// Tout est décoratif (aria-hidden) et s'immobilise quand le système demande moins d'animations.
import type { CSSProperties } from "react";

const heroUrl = `${import.meta.env.BASE_URL}assets/vodacom-opaline-hero.png`;

// x (%), largeur (px), teinte (1 à 3), durée (s), retard (s)
const CURTAINS: [number, number, number, number, number][] = [
  [8, 90, 2, 19, 0], [21, 50, 1, 14, 3], [34, 120, 3, 23, 6], [49, 60, 1, 17, 1],
  [58, 100, 2, 21, 8], [68, 46, 3, 13, 4], [77, 130, 1, 25, 10], [88, 70, 2, 16, 2], [95, 40, 3, 18, 7],
];

const STREAKS = [0, 1, 2, 3];

export function OrbitSky({ context = "dashboard" }: { context?: string }) {
  return (
    <div className="orbit-sky" data-context={context} aria-hidden="true">
      <div className="orbit-sky-base" />
      <div className="orbit-signature" style={{ "--signature": `url(${heroUrl})` } as CSSProperties} />
      <div className="orbit-curtains">
        {CURTAINS.map(([x, w, tone, dur, delay], index) => (
          <span key={index} className={`orbit-curtain tone-${tone}`} style={{ "--x": `${x}%`, "--w": `${w}px`, "--dur": `${dur}s`, "--delay": `-${delay}s` } as CSSProperties} />
        ))}
      </div>
      <div className="orbit-stars" />
      <div className="orbit-streaks">{STREAKS.map((index) => <span key={index} className="orbit-streak" style={{ "--i": index } as CSSProperties} />)}</div>
      <div className="orbit-phenomenon"><span className="orbit-core" /><span className="orbit-beam" /><span className="orbit-beam is-twin" /><span className="orbit-disk" /></div>
      <svg className="orbit-trajectory" viewBox="0 0 1000 1000" preserveAspectRatio="none"><path d="M380 1000 C 620 640, 780 380, 1040 60" /></svg>
      <span className="orbit-point" />
    </div>
  );
}
