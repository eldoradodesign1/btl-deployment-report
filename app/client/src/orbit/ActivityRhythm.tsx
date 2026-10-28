// Activité : rythme de la campagne en calendrier (une ligne par semaine) et fiche du jour sélectionné.
// Tout est dérivé des activations chargées et des commentaires quotidiens / hebdomadaires existants.
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { Activation } from "@/data/vodacomData";
import { ACTIONS } from "@/lib/analytics";
import { getWeekRanges } from "@/components/DateRangeFilter";
import { addDays, dayTitle, mondayOf, shortDay, toDate } from "@/orbit/dates";

type Props = { filtered: Activation[]; allData: Activation[]; dailyComments: Record<string, string>; weeklyComments: Record<string, string>; merchant: boolean };
const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const number = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

export function ActivityRhythm({ filtered, allData, dailyComments, weeklyComments, merchant }: Props) {
  const contact = typeof document !== "undefined" && document.documentElement.dataset.campaignType === "contact";
  const record = merchant ? "transactions" : contact ? "contacts" : "activations"; const participants = merchant || contact ? "ambassadeurs" : "agents"; const locations = merchant ? "points de vente" : contact ? "lieux" : "shops";
  const byDate = useMemo(() => { const groups = new Map<string, Activation[]>(); filtered.forEach((item) => groups.set(item.d, [...(groups.get(item.d) ?? []), item])); return groups; }, [filtered]);
  const dates = useMemo(() => Array.from(byDate.keys()).sort(), [byDate]);
  const weekNumbers = useMemo(() => new Map(getWeekRanges(allData).map((week, index) => [week.key, { index: index + 1, start: week.start, end: week.end }])), [allData]);
  const [selected, setSelected] = useState<string | null>(null);
  const dayRef = useRef<HTMLElement | null>(null);
  // Sur téléphone, la fiche est sous le calendrier : on la fait venir à l'écran après un choix.
  useEffect(() => { if (selected && window.matchMedia("(max-width: 1180px)").matches) dayRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }, [selected]);
  if (!dates.length) return <div className="module-page"><section className="orbit-empty-state glass-card"><h3>Aucune activité sur cette période</h3><p>Élargissez la période pour retrouver les jours actifs.</p></section></div>;

  const first = dates[0]; const last = dates.at(-1)!;
  const max = Math.max(...dates.map((date) => byDate.get(date)!.length), 1);
  const best = dates.reduce((a, b) => byDate.get(b)!.length > byDate.get(a)!.length ? b : a, dates[0]);
  const columns = dates.some((date) => toDate(date).getDay() === 0) ? 7 : 6;
  const weeks: string[] = []; for (let monday = mondayOf(first); monday <= last; monday = addDays(monday, 7)) weeks.push(monday);
  const day = selected && byDate.has(selected) ? selected : best;

  const rows = byDate.get(day)!; const monday = mondayOf(day); const week = weekNumbers.get(monday);
  const present = new Set(rows.map((item) => item.a)).size; const totalAgents = new Set(filtered.map((item) => item.a)).size;
  const shops = Array.from(rows.reduce((counts, item) => counts.set(item.s, (counts.get(item.s) ?? 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1]);
  const optIn = rows.filter((item) => item.t === ACTIONS[0] || item.t === "Contact avec transaction").length;
  const dailyNote = dailyComments[day]?.trim();
  const weeklyNote = (week && weeklyComments[`${week.start}|${week.end}`]) || Object.entries(weeklyComments).find(([key]) => mondayOf(key.split("|")[0]) === monday)?.[1];
  const weekTotal = week ? filtered.filter((item) => item.d >= week.start && item.d <= week.end).length : 0;

  return <div className="module-page at-activity">
    <section className="glass-card at-card at-rhythm" aria-label="Rythme de la campagne">
      <div className="at-row"><h3>Rythme de la campagne</h3><span className="at-sp" /><div className="at-legend" aria-hidden="true"><span>moins</span>{[12, 30, 55, 85].map((p) => <i key={p} style={{ background: `rgb(var(--o-acc) / ${p / 100})` }} />)}<span>plus</span><i className="is-pause" /><span>pause</span></div></div>
      <div className="at-heat" style={{ gridTemplateColumns: `64px repeat(${columns}, minmax(0, 1fr))` }}>
        <span />{DAY_NAMES.slice(0, columns).map((name) => <span className="at-heat-h" key={name}>{name}</span>)}
        {weeks.map((weekStart) => { const cells = Array.from({ length: columns }, (_, index) => addDays(weekStart, index)); const resting = cells.every((date) => !byDate.has(date)); return <div className="at-heat-week" key={weekStart} style={{ display: "contents" }}>
          <span className="at-heat-w">{shortDay(weekStart)}</span>
          {cells.map((date) => { const count = byDate.get(date)?.length; if (date < first || date > last) return <span className="at-d is-out" key={date} />; if (!count) return <span className={`at-d ${resting ? "is-pause" : "is-zero"}`} key={date} title={`${dayTitle(date)} · ${resting ? "pause" : `0 ${record}`}`}>{resting ? "" : "0"}</span>; const p = Math.round(12 + (count / max) * 76); return <button type="button" key={date} className={`at-d ${date === day ? "is-sel" : ""} ${p > 55 ? "is-strong" : ""}`} style={{ background: `rgb(var(--o-acc) / ${p / 100})` }} title={`${dayTitle(date)} · ${count} ${record}`} aria-pressed={date === day} onClick={() => setSelected(date)}>{count}</button>; })}
        </div>; })}
      </div>
    </section>
    <aside ref={dayRef} className="glass-card at-card at-day" aria-label="Fiche du jour" key={day}>
      <div className="at-row"><div><h3>{dayTitle(day)}</h3><span className="at-sub">{week ? `Semaine ${week.index}` : "Hors semaine"}{day === best ? " · meilleur jour" : ""}</span></div><span className="at-sp" /><span className="at-figure">{number(rows.length)}</span></div>
      <div className="at-facts"><span><b>{present}</b> / {totalAgents} {participants}</span><span><b>{shops.length}</b> {locations}</span>{!merchant && <span><b>{optIn}</b> {contact ? "avec transaction" : "opt-in"}</span>}</div>
      <div className="at-bars">{shops.slice(0, 8).map(([name, value]) => <div className="at-bar-row" key={name}><span className="at-bar-name" title={name}>{name}</span><span className="at-minibar"><i style={{ width: `${(value / shops[0][1]) * 100}%` }} /></span><b>{value}</b></div>)}{shops.length > 8 && <span className="at-sub">+ {shops.length - 8} autres {locations}</span>}</div>
      <div className="at-inner"><div className="at-row"><span className="at-tag"><MessageSquareText size={13} />Note du jour</span><span className="at-sp" /><span className="at-sub">Supervision</span></div><p className={dailyNote ? "" : "is-empty"}>{dailyNote || "Aucune note de supervision pour ce jour."}</p></div>
      <div className="at-inner"><div className="at-row"><span className="at-tag"><MessageSquareText size={13} />Note de la semaine</span>{week && <><span className="at-sp" /><span className="at-sub">{number(weekTotal)} {record}</span></>}</div><p className={weeklyNote ? "" : "is-empty"}>{weeklyNote?.trim() || "Aucune note pour cette semaine."}</p></div>
    </aside>
  </div>;
}
