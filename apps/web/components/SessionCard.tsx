"use client";

import Link from "next/link";

import { Icon } from "@/components/icons";
import { formatDate, formatDuration, previewText } from "@/lib/format";
import type { BrainstormSession } from "@/types/domain";

type SessionCardProps = {
  session: BrainstormSession;
  onDelete?: (id: string) => void;
};

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const statusLabel = session.status === "done" ? "Ready" : session.status;
  const summary = session.aiOutput?.summary || session.notes[0] || "A fresh space for the next useful idea.";
  const href =
    session.status === "done"
      ? `/results/${session.id}`
      : session.status === "processing"
        ? `/processing/${session.id}`
        : `/session/${session.id}`;

  return (
    <article className="session-card">
      <Link aria-label={`Open ${session.title}`} className="session-card-link" href={href}>
        <div className="card-top">
          <span className={`status ${session.status}`}>
            <i className="dot" />
            {statusLabel}
          </span>
          <span className="card-date">{formatDate(session.updatedAt)}</span>
        </div>
        <h3>{session.title}</h3>
        <p>{previewText(summary, 105)}</p>
        <div className="card-foot">
          <span>{formatDuration(session.durationSeconds)}</span>
          <span>{session.notes.length} notes</span>
        </div>
      </Link>
      {onDelete ? (
        <button
          aria-label={`Delete ${session.title}`}
          className="icon-button card-delete"
          onClick={() => onDelete(session.id)}
          type="button"
        >
          <Icon name="trash" />
        </button>
      ) : null}
    </article>
  );
}

