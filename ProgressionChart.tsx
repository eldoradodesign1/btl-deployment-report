// Design philosophy: Halo Opaline — progression feedback snaps softly to observed days for a precise, tactile reading of field activity.
import { useEffect, useId, useRef, useState } from "react";
import { commentExcerpt } from "./CommentDetailModal";

type Props = { data: [string, number][]; targetData?: [string, number][]; showTargets?: boolean; startDate: string; endDate: string; formatDate: (value: string) => string; dailyComments?: Record<string, string>; onCommentOpen?: (date: string, value: number) => void; onRangeChange?: (startDate: string, endDate: string) => void; onToggleTargets?: () => void; readOnly?: boolean; editable?: boolean };
type Point = { x: number; y: number };

function smoothPath(points: Point[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let path = `M ${points[0].x},${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]; const p1 = points[index]; const p2 = points[index + 1]; const p3 = points[index + 2] ?? p2;
    const controlOne = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const controlTwo = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    path += ` C ${controlOne.x},${controlOne.y} ${controlTwo.x},${controlTwo.y} ${p2.x},${p2.y}`;
  }
  return path;
}

export default function ProgressionChart({ data, targetData = [], showTargets = false, startDate, endDate, formatDate, dailyComments = {}, onCommentOpen, onRangeChange, onToggleTargets, readOnly = false, editable = false }: Props) {
  const clipId = useId().replace(/:/g, "");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [smoothHoverX, setSmoothHoverX] = useState<number | null>(null);
  const [dragHandle, setDragHandle] = useState<"start" | "end" | null>(null);
  const progressionRef = useRef<HTMLDivElement | null>(null);
  const hoverLineTargetRef = useRef<number | null>(null);
  const hoverLineDisplayRef = useRef<number | null>(null);
  const hoverLineFrameRef = useRef<number | null>(null);
  const chartData: [string, number][] = data.length ? data : [["", 0]];
  const width = 900; const height = 220; const padX = 34; const padTop = 22; const padBottom = 32;
  const x = (index: number) => padX + (index / Math.max(1, chartData.length - 1)) * (width - padX * 2);
  const targetByDate = new Map(targetData);
  const actualMax = Math.max(...chartData.map(([, value]) => value), 1);
  const targetMax = Math.max(actualMax, ...targetData.map(([, value]) => value), 1);
  const startIndex = Math.max(0, chartData.findIndex(([date]) => date && date >= startDate));
  const endIndex = Math.max(startIndex, chartData.findIndex(([date]) => date && date > endDate) - 1);
  const rangeEndIndex = endIndex < 0 ? chartData.length - 1 : endIndex;
  const selectionRef = useRef({ start: x(startIndex), end: x(rangeEndIndex) });
  const selectionFrameRef = useRef<number | null>(null);
  const [animatedSelection, setAnimatedSelection] = useState(() => selectionRef.current);
  useEffect(() => {
    const target = { start: x(startIndex), end: x(rangeEndIndex) };
    const from = selectionRef.current;
    if (Math.abs(from.start - target.start) < .1 && Math.abs(from.end - target.end) < .1) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      selectionRef.current = target;
      setAnimatedSelection(target);
      return;
    }
    if (selectionFrameRef.current != null) cancelAnimationFrame(selectionFrameRef.current);
    let startedAt = 0;
    const duration = typeof window !== "undefined" && window.innerWidth <= 760 ? 340 : 440;
    const animate = (time: number) => {
      if (!startedAt) startedAt = time;
      const progress = Math.min(1, (time - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      const next = {
        start: from.start + (target.start - from.start) * eased,
        end: from.end + (target.end - from.end) * eased,
      };
      selectionRef.current = next;
      setAnimatedSelection(next);
      if (progress < 1) selectionFrameRef.current = requestAnimationFrame(animate);
      else selectionFrameRef.current = null;
    };
    selectionFrameRef.current = requestAnimationFrame(animate);
    return () => { if (selectionFrameRef.current != null) cancelAnimationFrame(selectionFrameRef.current); };
  }, [endIndex, rangeEndIndex, startIndex]);
  const [displayMax, setDisplayMax] = useState(actualMax);
  const displayMaxRef = useRef(actualMax);
  useEffect(() => {
    const nextMax = showTargets ? targetMax : actualMax;
    const previousMax = displayMaxRef.current;
    if (Math.abs(nextMax - previousMax) < .01) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { displayMaxRef.current = nextMax; setDisplayMax(nextMax); return; }
    let frame = 0; let start = 0; const duration = typeof window !== "undefined" && window.innerWidth <= 760 ? 300 : 420;
    const step = (time: number) => { if (!start) start = time; const progress = Math.min(1, (time - start) / duration); const eased = 1 - Math.pow(1 - progress, 3); const value = previousMax + (nextMax - previousMax) * eased; displayMaxRef.current = value; setDisplayMax(value); if (progress < 1) frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame);
  }, [actualMax, showTargets, targetMax]);
  const max = displayMax;
  const y = (value: number) => padTop + (1 - value / max) * (height - padTop - padBottom);
  const points = chartData.map(([, value], index) => ({ x: x(index), y: y(value) }));
  const targetPoints = chartData.map(([date], index) => ({ x: x(index), y: y(targetByDate.get(date) ?? 0) }));
  const linePath = smoothPath(points);
  const targetPath = targetData.length ? smoothPath(targetPoints) : "";
  const baseline = height - padBottom;
  const areaPath = points.length ? `${linePath} L ${points.at(-1)!.x},${baseline} L ${points[0].x},${baseline} Z` : "";
  const activeStart = animatedSelection.start; const activeEnd = animatedSelection.end;
  const peakIndex = chartData.reduce((best, current, currentIndex, all) => current[1] > all[best][1] ? currentIndex : best, 0);
  const hoveredPoint = hoveredIndex == null ? null : points[hoveredIndex];
  const hoveredDatum = hoveredIndex == null ? null : chartData[hoveredIndex];
  const hoverTooltipX = hoverX == null ? null : hoverX + 14;
  const hoverTooltipY = hoverY == null ? null : Math.min(height - 12, Math.max(12, hoverY));
  const tooltipReversed = hoverTooltipX != null && hoverTooltipX > width - 320;
  const moveHoverLine = (nextX: number | null) => {
    hoverLineTargetRef.current = nextX;
    if (nextX == null) {
      if (hoverLineFrameRef.current != null) cancelAnimationFrame(hoverLineFrameRef.current);
      hoverLineFrameRef.current = null;
      hoverLineDisplayRef.current = null;
      setSmoothHoverX(null);
      return;
    }
    if (hoverLineFrameRef.current != null) return;
    const tick = () => {
      const target = hoverLineTargetRef.current;
      if (target == null) { hoverLineFrameRef.current = null; return; }
      const previous = hoverLineDisplayRef.current ?? target;
      const next = previous + (target - previous) * 0.22;
      hoverLineDisplayRef.current = Math.abs(target - next) < 0.08 ? target : next;
      setSmoothHoverX(hoverLineDisplayRef.current);
      if (hoverLineDisplayRef.current !== target) hoverLineFrameRef.current = requestAnimationFrame(tick);
      else hoverLineFrameRef.current = null;
    };
    hoverLineFrameRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => { if (hoverLineFrameRef.current != null) cancelAnimationFrame(hoverLineFrameRef.current); }, []);
  const updateDragFromPointer = (clientX: number) => {
    if (!dragHandle || !onRangeChange || chartData.length < 2) return;
    const bounds = progressionRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    const requestedIndex = Math.round(ratio * (chartData.length - 1));
    const nextIndex = dragHandle === "start" ? Math.min(requestedIndex, endIndex < 0 ? chartData.length - 1 : endIndex) : Math.max(requestedIndex, startIndex);
    const nextDate = chartData[nextIndex]?.[0];
    if (!nextDate) return;
    if (dragHandle === "start") onRangeChange(nextDate, endDate);
    else onRangeChange(startDate, nextDate);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = progressionRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) return;
    const chartX = Math.min(width, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * width));
    const chartY = Math.min(height, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * height));
    const pointerX = event.clientX - bounds.left;
    const snappedIndex = points.findIndex((point) => Math.abs((point.x / width) * bounds.width - pointerX) <= 5);
    const nextLineX = snappedIndex === -1 ? chartX : points[snappedIndex].x;
    setHoverX(chartX);
    setHoverY(chartY);
    setHoveredIndex(snappedIndex === -1 ? null : snappedIndex);
    moveHoverLine(nextLineX);
    updateDragFromPointer(event.clientX);
  };

  return <article className={`progression-card glass-card ${readOnly ? "progression-readonly" : ""}`}>
    <div className="card-heading"><div><div className="eyebrow">PROGRESSION CAMPAGNE</div><h3>Le mouvement sur toute la campagne.</h3></div><div className="progression-meta"><span className="progression-dot" /> Zone filtrée en surbrillance{targetData.length > 0 && <span className={`target-legend-animated ${showTargets ? "is-visible" : ""}`}><span className="target-legend-dot" /> Objectif quotidien</span>}{onToggleTargets && <button type="button" className={`target-dashboard-switch target-inline-switch ${showTargets ? "is-active" : ""}`} data-tooltip={showTargets ? "Masquer l’objectif quotidien de la courbe" : "Afficher l’objectif quotidien de la courbe"} aria-label={showTargets ? "Masquer l’objectif quotidien de la courbe" : "Afficher l’objectif quotidien de la courbe"} aria-pressed={showTargets} onClick={onToggleTargets}><i /><b>Objectifs</b></button>}</div></div>
    <div className="progression-wrap" ref={progressionRef} onPointerMove={handlePointerMove} onPointerEnter={handlePointerMove} onPointerLeave={() => { if (!dragHandle) { setHoverX(null); setHoverY(null); setHoveredIndex(null); moveHoverLine(null); } }} onPointerUp={() => setDragHandle(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Courbe de progression des activations">
        <defs><linearGradient id={`${clipId}-fill`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8be8e5" stopOpacity=".22" /><stop offset="1" stopColor="#8be8e5" stopOpacity="0" /></linearGradient><clipPath id={`${clipId}-zone`}><rect x={activeStart} y="0" width={Math.max(1, activeEnd - activeStart)} height={height} /></clipPath></defs>
        <line x1={padX} x2={width - padX} y1={baseline} y2={baseline} className="progress-axis" /><line x1={padX} x2={width - padX} y1={y(max / 2)} y2={y(max / 2)} className="progress-gridline" />
        <path d={areaPath} fill={`url(#${clipId}-fill)`} />
        <rect x={activeStart} y="10" width={Math.max(1, activeEnd - activeStart)} height={baseline - 10} className="progress-zone" />
        <path d={linePath} className="progress-line progress-line-muted" /><path d={linePath} className="progress-line progress-line-active" clipPath={`url(#${clipId}-zone)`} />
        {targetPath && <path d={targetPath} className={`progress-target-line ${showTargets ? "is-visible" : ""}`} />}
        {smoothHoverX != null && <line x1={smoothHoverX} x2={smoothHoverX} y1="10" y2={baseline} className={`progress-hover-line ${hoveredPoint ? "is-snapped" : ""}`} />}
        <circle cx={activeStart} cy={y(chartData[startIndex]?.[1] ?? 0)} r="5" className="progress-handle progress-handle-draggable" onPointerDown={(event) => { if (!onRangeChange) return; event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic or unsupported pointer capture; the wrapper still tracks movement. */ } setDragHandle("start"); }} />
        <circle cx={activeEnd} cy={y(chartData[endIndex < 0 ? chartData.length - 1 : endIndex]?.[1] ?? 0)} r="5" className="progress-handle progress-handle-draggable" onPointerDown={(event) => { if (!onRangeChange) return; event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic or unsupported pointer capture; the wrapper still tracks movement. */ } setDragHandle("end"); }} />
        {chartData.map(([date, value], index) => <g key={`${date}-${index}`}><text x={x(index)} y={height - 9} className="progress-label" textAnchor={index === 0 ? "start" : index === chartData.length - 1 ? "end" : "middle"}>{date && (index === 0 || index === chartData.length - 1 || index === startIndex || index === endIndex) ? formatDate(date) : ""}</text><text x={x(index)} y={y(value) - 10} className="progress-value" textAnchor="middle">{index === peakIndex ? value : ""}</text></g>)}
      </svg>
      <div className="progression-tooltip-layer" aria-label="Détails quotidiens">{chartData.map(([date, value], index) => { const hasComment = Boolean(dailyComments[date]); const clickable = hasComment || editable; const label = date ? formatDate(date) : "Aucune date"; return <span className={`progression-hover-point has-value ${hoveredIndex === index ? "is-active" : ""} ${clickable ? "is-clickable" : ""}`} key={`tooltip-${date}-${index}`} style={{ left: `${(x(index) / width) * 100}%`, top: `${(y(value) / height) * 100}%` }} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : -1} aria-label={clickable ? `Lire ou créer le commentaire du ${label}` : undefined} onFocus={() => { setHoverX(x(index)); setHoverY(y(value)); setHoveredIndex(index); }} onBlur={() => { setHoverX(null); setHoverY(null); setHoveredIndex(null); }} onClick={() => clickable && onCommentOpen?.(date, value)} onKeyDown={(event) => { if (clickable && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onCommentOpen?.(date, value); } }} />; })}</div>
      {hoveredDatum && hoverTooltipX != null && hoverTooltipY != null && <div className={`progression-cursor-tooltip ${tooltipReversed ? "is-reversed" : ""}`} style={{ left: `${((tooltipReversed ? hoverX! - 14 : hoverTooltipX) / width) * 100}%`, top: `${(hoverTooltipY / height) * 100}%` }}><b>{hoveredDatum[0] ? formatDate(hoveredDatum[0]) : "Aucune date"}</b><em>{hoveredDatum[1]} activations</em>{showTargets && targetByDate.has(hoveredDatum[0]) && <span className="cursor-target-detail">Objectif · {targetByDate.get(hoveredDatum[0])}</span>}{dailyComments[hoveredDatum[0]] && <small>{commentExcerpt(dailyComments[hoveredDatum[0]])}</small>}</div>}
    </div>
    <div className="progression-footer"><span>{data.length} jours actifs sur la campagne source</span><strong>{formatDate(startDate)} → {formatDate(endDate)}</strong></div>
  </article>;
}
