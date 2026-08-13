import { CalendarDays, MessageSquareText, X } from "lucide-react";

export type CommentDetail = {
  date: string;
  label: string;
  comment: string;
  value: number;
  source: "curve" | "histogram";
};

export function normalizeSupervisorComment(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

export function commentExcerpt(value: string, maxLength = 150) {
  const normalized = normalizeSupervisorComment(value).replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export default function CommentDetailModal({ detail, onClose }: { detail: CommentDetail | null; onClose: () => void }) {
  if (!detail) return null;
  return (
    <div className="comment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="comment-detail-modal" role="dialog" aria-modal="true" aria-labelledby="comment-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="comment-detail-header">
          <div>
            <div className="eyebrow"><MessageSquareText size={13} /> COMMENTAIRE SUPERVISEUR</div>
            <h2 id="comment-detail-title">{detail.label}</h2>
          </div>
          <button className="icon-button comment-modal-close" type="button" aria-label="Fermer le commentaire" onClick={onClose}><X size={17} /></button>
        </header>
        <div className="comment-detail-context"><CalendarDays size={14} /><span>{detail.source === "curve" ? "Progression campagne" : "Cadence quotidienne"}</span><strong>{detail.value} activation{detail.value > 1 ? "s" : ""}</strong></div>
        <p className="comment-detail-copy">{normalizeSupervisorComment(detail.comment)}</p>
        <footer className="comment-detail-footer">Commentaire associé à la date sélectionnée.</footer>
      </section>
    </div>
  );
}
