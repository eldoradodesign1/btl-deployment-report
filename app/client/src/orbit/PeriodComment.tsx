// Commentaire de la période : quitte le filtre et devient une carte de lecture à côté de la progression.
// Semaine exacte → commentaire hebdomadaire (modifiable par BTL) ; autre sélection → synthèse de période (locale).
import { MessageSquareText, Sparkles } from "lucide-react";

type Props = {
  weekNumber: number | null;
  weeklyComment: string;
  customPeriodComment: string;
  role: "btl" | "vodacom";
  onWeeklyCommentOpen?: (week: number, comment: string) => void;
  onCustomPeriodCommentOpen?: () => void;
};

export function PeriodComment({ weekNumber, weeklyComment, customPeriodComment, role, onWeeklyCommentOpen, onCustomPeriodCommentOpen }: Props) {
  const weekly = weekNumber !== null;
  const comment = weekly ? weeklyComment : customPeriodComment;
  const action = weekly
    ? role === "btl" && onWeeklyCommentOpen ? { label: comment ? "Modifier" : "Générer par IA", run: () => onWeeklyCommentOpen(weekNumber, comment) } : null
    : onCustomPeriodCommentOpen ? { label: comment ? (role === "btl" ? "Modifier" : "Régénérer") : "Générer par IA", run: onCustomPeriodCommentOpen } : null;
  return (
    <article className="orbit-comment-card glass-card">
      <div className="orbit-comment-head">
        <div><span className="eyebrow">{weekly ? `Semaine ${weekNumber}` : "Période choisie"}</span><h3>Commentaire de la période</h3></div>
        {action && <button type="button" className="orbit-ghost" onClick={action.run}>{comment ? <MessageSquareText size={14} /> : <Sparkles size={14} />}{action.label}</button>}
      </div>
      {comment ? <p>{comment}</p> : <p className="orbit-comment-empty">{weekly ? "Pas encore de commentaire pour cette semaine." : "Pas encore de synthèse pour cette sélection."}</p>}
      {!weekly && comment && <small className="orbit-comment-note">Synthèse enregistrée sur cet appareil.</small>}
    </article>
  );
}
