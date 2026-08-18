import { CalendarDays, LoaderCircle, MessageSquareText, Pencil, Save, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

export type CommentDetail = {
  date: string;
  label: string;
  comment: string;
  value: number;
  source: "curve" | "histogram" | "weekly" | "custom";
  week?: number;
  endDate?: string;
};

export function normalizeSupervisorComment(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

export function commentExcerpt(value: string, maxLength = 150) {
  const normalized = normalizeSupervisorComment(value).replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export default function CommentDetailModal({ detail, role = "vodacom", autoGenerating = false, onClose, onSave, onGenerate }: { detail: CommentDetail | null; role?: "btl" | "vodacom"; autoGenerating?: boolean; onClose: () => void; onSave?: (detail: CommentDetail, comment: string) => Promise<void>; onGenerate?: (detail: CommentDetail) => Promise<string> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"save" | "generate" | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { setEditing(false); setDraft(detail?.comment ?? ""); setError(""); }, [detail]);
  if (!detail) return null;
  const canEdit = role === "btl";
  const canGenerate = role === "btl" || detail.source === "custom";
  const displayComment = detail.source === "custom" ? draft.trim() || detail.comment.trim() : detail.comment.trim();
  const hasComment = Boolean(displayComment);
  const edit = () => { setDraft(detail.comment); setEditing(true); setError(""); };
  const save = async () => { if (!onSave || !draft.trim()) return; setBusy("save"); setError(""); try { await onSave(detail, draft.trim()); setEditing(false); } catch (reason) { setError(reason instanceof Error ? reason.message : "La sauvegarde du commentaire a échoué."); } finally { setBusy(null); } };
  const generate = async () => { if (!onGenerate) return; setBusy("generate"); setError(""); try { const next = await onGenerate(detail); setDraft(next); setEditing(canEdit); } catch (reason) { setError(reason instanceof Error ? reason.message : "La génération IA a échoué."); } finally { setBusy(null); } };
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
        <div className="comment-detail-context"><CalendarDays size={14} /><span>{detail.source === "weekly" ? `Synthèse semaine ${detail.week}` : detail.source === "custom" ? "Période personnalisée · stockage local" : detail.source === "curve" ? "Progression campagne" : "Cadence quotidienne"}</span><strong>{detail.value} activation{detail.value > 1 ? "s" : ""}</strong></div>
        {autoGenerating ? <div className="comment-detail-generating"><LoaderCircle size={17} className="is-spinning" /><span>Analyse des commentaires terrain et création de la synthèse…</span></div> : editing ? <textarea className="comment-detail-editor" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Modifier le commentaire superviseur" /> : <p className={`comment-detail-copy ${hasComment ? "" : "is-empty"}`}>{hasComment ? normalizeSupervisorComment(displayComment) : "Aucun commentaire n’est encore enregistré pour cette période."}</p>}
        {(canGenerate || canEdit) && <div className="comment-detail-actions">{canGenerate && <button type="button" className="soft-button" onClick={generate} disabled={busy !== null || autoGenerating}>{busy === "generate" || autoGenerating ? <LoaderCircle size={14} className="is-spinning" /> : <Sparkles size={14} />} {hasComment ? "Régénérer par IA" : "Générer par IA"}</button>}{canEdit && (editing ? <><button type="button" className="soft-button" onClick={() => { setEditing(false); setDraft(detail.comment); }}>Annuler</button><button type="button" className="primary-button" onClick={save} disabled={busy !== null || autoGenerating || !draft.trim()}>{busy === "save" ? <LoaderCircle size={14} className="is-spinning" /> : <Save size={14} />} Confirmer & enregistrer</button></> : <button type="button" className="primary-button" onClick={edit} disabled={autoGenerating}><Pencil size={14} /> Modifier</button>)}</div>}
        {error && <div className="comment-detail-error">{error}</div>}
        <footer className="comment-detail-footer">{detail.source === "weekly" ? "Synthèse associée à la semaine sélectionnée." : detail.source === "custom" ? "Cette synthèse reste enregistrée uniquement dans ce navigateur et accompagne les exports de cette période." : "Commentaire associé à la date sélectionnée."}</footer>
      </section>
    </div>
  );
}
