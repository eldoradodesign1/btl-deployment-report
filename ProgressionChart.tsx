// Design philosophy: Halo Opaline — the campaign curve is a luminous instrument with rounded points and readable daily signals.
import { useId } from "react";

type Props = { data: [string, number][]; startDate: string; endDate: string; formatDate: (value: string) => string; dailyComments?: Record<string, string>; readOnly?: boolean };

export default function ProgressionChart({ data, startDate, endDate, formatDate, dailyComments = {}, readOnly = false }: Props) {
  const clipId = useId().replace(/:/g, "");
  const width = 900; const height = 220; const padX = 34; const padTop = 22; const padBottom = 32;
  const max = Math.max(...data.map(([, value]) => value), 1);
  const x = (index: number) => padX + (index / Math.max(1, data.length - 1)) * (width - padX * 2);
  const y = (value: number) => padTop + (1 - value / max) * (height - padTop - padBottom);
  const points = data.map(([, value], index) => `${x(index)},${y(value)}`).join(" ");
  const startIndex = Math.max(0, data.findIndex(([date]) => date >= startDate));
  const endIndex = Math.max(startIndex, data.findIndex(([date]) => date > endDate) - 1);
  const activeStart = x(startIndex); const activeEnd = x(endIndex < 0 ? data.length - 1 : endIndex); const baseline = height - padBottom;
  const peakIndex = data.reduce((best, current, currentIndex, all) => current[1] > all[best][1] ? currentIndex : best, 0);

  return <article className={`progression-card glass-card ${readOnly ? "progression-readonly" : ""}`}>
    <div className="card-heading"><div><div className="eyebrow">PROGRESSION CAMPAGNE</div><h3>Le mouvement sur toute la campagne.</h3></div><div className="progression-meta"><span className="progression-dot" /> Zone filtrée en surbrillance</div></div>
    <div className="progression-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Courbe de progression des activations">
        <defs><linearGradient id={`${clipId}-fill`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8be8e5" stopOpacity=".22" /><stop offset="1" stopColor="#8be8e5" stopOpacity="0" /></linearGradient><clipPath id={`${clipId}-zone`}><rect x={activeStart} y="0" width={Math.max(1, activeEnd - activeStart)} height={height} /></clipPath></defs>
        <line x1={padX} x2={width - padX} y1={baseline} y2={baseline} className="progress-axis" /><line x1={padX} x2={width - padX} y1={y(max / 2)} y2={y(max / 2)} className="progress-gridline" />
        <polygon points={`${points} ${x(data.length - 1)},${baseline} ${x(0)},${baseline}`} fill={`url(#${clipId}-fill)`} /><rect x={activeStart} y="10" width={Math.max(1, activeEnd - activeStart)} height={baseline - 10} className="progress-zone" />
        <polyline points={points} className="progress-line progress-line-muted" /><polyline points={points} className="progress-line progress-line-active" clipPath={`url(#${clipId}-zone)`} />
        <circle cx={activeStart} cy={y(data[startIndex]?.[1] ?? 0)} r="4" className="progress-handle" /><circle cx={activeEnd} cy={y(data[endIndex < 0 ? data.length - 1 : endIndex]?.[1] ?? 0)} r="4" className="progress-handle" />
        {data.map(([date, value], index) => <g key={date}><text x={x(index)} y={height - 9} className="progress-label" textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}>{index === 0 || index === data.length - 1 || index === startIndex || index === endIndex ? formatDate(date) : ""}</text><text x={x(index)} y={y(value) - 10} className="progress-value" textAnchor="middle">{index === peakIndex ? value : ""}</text></g>)}
      </svg>
      <div className="progression-tooltip-layer" aria-label="Détails quotidiens">{data.map(([date, value], index) => <span className="progression-hover-point" key={`tooltip-${date}`} style={{ left: `${(x(index) / width) * 100}%`, top: `${(y(value) / height) * 100}%` }}><span className="progression-tooltip"><b>{formatDate(date)}</b><em>{value} activations</em>{dailyComments[date] && <small>{dailyComments[date]}</small>}</span></span>)}</div>
    </div>
    <div className="progression-footer"><span>{data.length} jours actifs sur la campagne source</span><strong>{formatDate(startDate)} → {formatDate(endDate)}</strong></div>
  </article>;
}
