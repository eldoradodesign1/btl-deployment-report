import { useId, useRef, useState } from "react";
import { commentExcerpt } from "./CommentDetailModal";

type Props = { data: [string, number][]; startDate: string; endDate: string; formatDate: (value: string) => string; dailyComments?: Record<string, string>; onCommentOpen?: (date: string, value: number) => void; onRangeChange?: (startDate: string, endDate: string) => void; readOnly?: boolean };
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

export default function ProgressionChart({ data, startDate, endDate, formatDate, dailyComments = {}, onCommentOpen, onRangeChange, readOnly = false }: Props) {
  const clipId = useId().replace(/:/g, "");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [dragHandle, setDragHandle] = useState<"start" | "end" | null>(null);
  const progressionRef = useRef<HTMLDivElement | null>(null);
  const chartData: [string, number][] = data.length ? data : [["", 0]];
  const width = 900; const height = 220; const padX = 34; const padTop = 22; const padBottom = 32;
  const max = Math.max(...chartData.map(([, value]) => value), 1);
  const x = (index: number) => padX + (index / Math.max(1, chartData.length - 1)) * (width - padX * 2);
  const y = (value: number) => padTop + (1 - value / max) * (height - padTop - padBottom);
  const points = chartData.map(([, value], index) => ({ x: x(index), y: y(value) }));
  const linePath = smoothPath(points);
  const baseline = height - padBottom;
  const areaPath = points.length ? `${linePath} L ${points.at(-1)!.x},${baseline} L ${points[0].x},${baseline} Z` : "";
  const startIndex = Math.max(0, chartData.findIndex(([date]) => date && date >= startDate));
  const endIndex = Math.max(startIndex, chartData.findIndex(([date]) => date && date > endDate) - 1);
  const activeStart = x(startIndex); const activeEnd = x(endIndex < 0 ? chartData.length - 1 : endIndex);
  const peakIndex = chartData.reduce((best, current, currentIndex, all) => current[1] > all[best][1] ? currentIndex : best, 0);
  const hoveredPoint = hoveredIndex == null ? null : points[hoveredIndex];
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
    setHoverX(Math.min(width, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * width)));
    updateDragFromPointer(event.clientX);
  };

  return <article className={`progression-card glass-card ${readOnly ? "progression-readonly" : ""}`}>
    <div className="card-heading"><div><div className="eyebrow">PROGRESSION CAMPAGNE</div><h3>Le mouvement sur toute la campagne.</h3></div><div className="progression-meta"><span className="progression-dot" /> Zone filtrée en surbrillance</div></div>
    <div className="progression-wrap" ref={progressionRef} onPointerMove={handlePointerMove} onPointerEnter={handlePointerMove} onPointerLeave={() => { if (!dragHandle) { setHoverX(null); setHoveredIndex(null); } }} onPointerUp={() => setDragHandle(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Courbe de progression des activations">
        <defs><linearGradient id={`${clipId}-fill`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8be8e5" stopOpacity=".22" /><stop offset="1" stopColor="#8be8e5" stopOpacity="0" /></linearGradient><clipPath id={`${clipId}-zone`}><rect x={activeStart} y="0" width={Math.max(1, activeEnd - activeStart)} height={height} /></clipPath></defs>
        <line x1={padX} x2={width - padX} y1={baseline} y2={baseline} className="progress-axis" /><line x1={padX} x2={width - padX} y1={y(max / 2)} y2={y(max / 2)} className="progress-gridline" />
        <path d={areaPath} fill={`url(#${clipId}-fill)`} />
        <rect x={activeStart} y="10" width={Math.max(1, activeEnd - activeStart)} height={baseline - 10} className="progress-zone" />
        <path d={linePath} className="progress-line progress-line-muted" /><path d={linePath} className="progress-line progress-line-active" clipPath={`url(#${clipId}-zone)`} />
        {hoverX != null && <line x1={hoverX} x2={hoverX} y1="10" y2={baseline} className="progress-hover-line" />}
        <circle cx={activeStart} cy={y(chartData[startIndex]?.[1] ?? 0)} r="5" className="progress-handle progress-handle-draggable" onPointerDown={(event) => { if (!onRangeChange) return; event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic or unsupported pointer capture; the wrapper still tracks movement. */ } setDragHandle("start"); }} />
        <circle cx={activeEnd} cy={y(chartData[endIndex < 0 ? chartData.length - 1 : endIndex]?.[1] ?? 0)} r="5" className="progress-handle progress-handle-draggable" onPointerDown={(event) => { if (!onRangeChange) return; event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic or unsupported pointer capture; the wrapper still tracks movement. */ } setDragHandle("end"); }} />
        {chartData.map(([date, value], index) => <g key={`${date}-${index}`}><text x={x(index)} y={height - 9} className="progress-label" textAnchor={index === 0 ? "start" : index === chartData.length - 1 ? "end" : "middle"}>{date && (index === 0 || index === chartData.length - 1 || index === startIndex || index === endIndex) ? formatDate(date) : ""}</text><text x={x(index)} y={y(value) - 10} className="progress-value" textAnchor="middle">{index === peakIndex ? value : ""}</text></g>)}
      </svg>
      <div className="progression-tooltip-layer" aria-label="Détails quotidiens">{chartData.map(([date, value], index) => { const hasComment = Boolean(dailyComments[date]); const label = date ? formatDate(date) : "Aucune date"; return <span className={`progression-hover-point has-value ${hasComment ? "is-clickable" : ""} ${index === 0 ? "tooltip-left" : index === chartData.length - 1 ? "tooltip-right" : ""}`} key={`tooltip-${date}-${index}`} style={{ left: `${(x(index) / width) * 100}%`, top: `${(y(value) / height) * 100}%` }} role={hasComment ? "button" : undefined} tabIndex={hasComment ? 0 : -1} aria-label={hasComment ? `Lire le commentaire du ${label}` : undefined} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => hasComment && onCommentOpen?.(date, value)} onKeyDown={(event) => { if (hasComment && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onCommentOpen?.(date, value); } }}><span className="progression-tooltip"><b>{label}</b><em>{value} activations</em>{hasComment && <small>{commentExcerpt(dailyComments[date])}</small>}</span></span>; })}</div>
    </div>
    <div className="progression-footer"><span>{data.length} jours actifs sur la campagne source</span><strong>{formatDate(startDate)} → {formatDate(endDate)}</strong></div>
  </article>;
}
