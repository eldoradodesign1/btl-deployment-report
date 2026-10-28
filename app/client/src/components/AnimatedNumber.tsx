// Halo Opaline motion primitive: numbers settle with a soft eased count instead of snapping between filtered states.
import { useEffect, useRef, useState } from "react";

type Props = { value: number; decimals?: number; suffix?: string; prefix?: string; className?: string };

export default function AnimatedNumber({ value, decimals = 0, suffix = "", prefix = "", className = "" }: Props) {
  const previous = useRef(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = previous.current;
    previous.current = value;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); return; }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 660);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const formatted = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(display);
  return <span className={`animated-number ${className}`} data-final-display={`${prefix}${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}${suffix}`}>{prefix}{formatted}{suffix}</span>;
}
