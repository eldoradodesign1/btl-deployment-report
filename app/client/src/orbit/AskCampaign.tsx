// « Questionner la campagne » : panneau de questions libres sur la campagne et la période affichées.
// Les réponses viennent de la fonction serveur ask-campaign (données de la base, quota quotidien).
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Sparkles, X } from "lucide-react";
import type { Session } from "@/lib/roles";
import { askCampaign, type AskTurn } from "@/lib/clientAccess";

type Props = { session: Session; campaignId: string; campaignName: string; startDate: string; endDate: string; rangeLabel: string; onClose: () => void };

const suggestions = ["Qui sont les trois meilleurs et pourquoi ?", "Quels jours ont été les plus faibles ?", "Que disent les notes de terrain ?", "Quelles pistes pour progresser ?"];

export function AskCampaign({ session, campaignId, campaignName, startDate, endDate, rangeLabel, onClose }: Props) {
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [turns.length, busy]);
  // Nouvelle période : la conversation repart de zéro.
  useEffect(() => { setTurns([]); setError(""); }, [campaignId, startDate, endDate]);

  const close = () => { setClosing(true); window.setTimeout(onClose, 180); };
  const send = async (text = question) => {
    const asked = text.trim();
    if (asked.length < 3 || busy || remaining === 0) return;
    setBusy(true); setError(""); setQuestion("");
    try {
      const result = await askCampaign(session, campaignId, startDate, endDate, asked, turns);
      setTurns((current) => [...current, { question: asked, answer: result.answer }]);
      setRemaining(result.remaining);
    } catch (caught) {
      const failure = caught as Error & { remaining?: number };
      setError(failure.message); setQuestion(asked);
      if (typeof failure.remaining === "number") setRemaining(failure.remaining);
    } finally { setBusy(false); inputRef.current?.focus(); }
  };

  return createPortal(<div className={`orbit-palette-backdrop orbit-ask-backdrop ${closing ? "is-closing" : ""}`} onPointerDown={(event) => { if (event.target === event.currentTarget) close(); }} onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
    <section className="orbit-ask" role="dialog" aria-modal="true" aria-label="Questionner la campagne">
      <header className="orbit-ask-head">
        <span className="orbit-ask-mark"><Sparkles size={16} /></span>
        <div><h2>Questionner la campagne</h2><small>{campaignName} · {rangeLabel}</small></div>
        <button type="button" className="dn-icon-button" onClick={close} aria-label="Fermer"><X size={16} /></button>
      </header>
      <div ref={listRef} className="orbit-ask-thread" aria-live="polite">
        {!turns.length && !busy && <div className="orbit-ask-intro"><p>Posez une question sur les chiffres, les équipes, les lieux ou les notes de terrain de cette période.</p><div className="orbit-ask-chips">{suggestions.map((item) => <button type="button" key={item} onClick={() => void send(item)}>{item}</button>)}</div></div>}
        {turns.map((turn, index) => <div className="orbit-ask-turn" key={index}><p className="orbit-ask-q">{turn.question}</p><div className="orbit-ask-a">{turn.answer.split("\n").filter((line) => line.trim()).map((line, i) => <p key={i}>{line.replace(/^\s*[*-]\s+/, "• ").replace(/\*\*(.+?)\*\*/g, "$1")}</p>)}</div></div>)}
        {busy && <div className="orbit-ask-turn"><div className="orbit-ask-a is-thinking"><span /><span /><span /></div></div>}
        {error && <p className="orbit-ask-error" role="alert">{error}</p>}
      </div>
      <form className="orbit-ask-form" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <textarea ref={inputRef} rows={1} value={question} maxLength={500} disabled={remaining === 0} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={remaining === 0 ? "Plus de questions aujourd'hui" : "Votre question…"} aria-label="Votre question" />
        <button type="submit" className="orbit-ask-send" disabled={busy || question.trim().length < 3 || remaining === 0} aria-label="Envoyer"><ArrowUp size={17} /></button>
      </form>
      <footer className="orbit-ask-foot"><span>Réponses générées par IA à partir des données de la période ; à vérifier avant décision.</span>{remaining !== null && <b>{remaining} question{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""} aujourd'hui</b>}</footer>
    </section>
  </div>, document.querySelector(".app-shell") ?? document.body);
}
