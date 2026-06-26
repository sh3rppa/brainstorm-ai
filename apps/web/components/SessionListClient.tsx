"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { SessionCard } from "@/components/SessionCard";
import { showToast } from "@/components/toast";
import { apiJson } from "@/lib/api-client";
import type { BrainstormSession } from "@/types/domain";

type SessionListClientProps = {
  initialSessions: BrainstormSession[];
  limit?: number;
  mode: "home" | "library";
};

export function SessionListClient({ initialSessions, limit, mode }: SessionListClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const visibleSessions = limit ? sessions.slice(0, limit) : sessions;

  async function createNewSession(): Promise<void> {
    setBusy(true);
    try {
      const session = await apiJson<BrainstormSession>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled brainstorm" }),
      });
      router.push(`/session/${session.id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create the session.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentSession(id: string): Promise<void> {
    const session = sessions.find((item) => item.id === id);
    if (!session) return;
    if (!window.confirm(`Delete "${session.title}"?`)) return;

    try {
      await apiJson<{ deleted: true }>(`/sessions/${id}`, { method: "DELETE" });
      setSessions((current) => current.filter((item) => item.id !== id));
      showToast("Session deleted.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not delete the session.");
    }
  }

  if (mode === "home") {
    return (
      <>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">From idea to something real</p>
            <h2>Make room for the messy first draft.</h2>
            <p>
              Speak, sketch, and write without stopping to organize. Brainstorm AI turns the session into a clear,
              actionable starting point.
            </p>
            <button className="btn primary" disabled={busy} onClick={createNewSession} type="button">
              <Icon name="plus" />
              Start a new session
            </button>
          </div>
          <aside className="insight-card">
            <div className="spark">B</div>
            <div>
              <p className="eyebrow">Today&apos;s prompt</p>
              <h3>What would become possible if the first version took one week?</h3>
              <p>Start with the outcome. Let the details arrive later.</p>
            </div>
          </aside>
        </section>
        <div className="section-head">
          <div>
            <h2>Recent sessions</h2>
            <p>Pick up where your thinking left off.</p>
          </div>
          <a className="btn small" href="/sessions">
            View all
          </a>
        </div>
        <section className="session-grid">
          {visibleSessions.length > 0 ? (
            visibleSessions.map((session) => (
              <SessionCard key={session.id} onDelete={deleteCurrentSession} session={session} />
            ))
          ) : (
            <div className="empty">Your completed sessions will appear here.</div>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <div className="section-head topless">
        <div>
          <h2>All sessions</h2>
          <p>{sessions.length} ideas captured and ready to revisit.</p>
        </div>
        <button className="btn acid" disabled={busy} onClick={createNewSession} type="button">
          <Icon name="plus" />
          New session
        </button>
      </div>
      <section className="session-grid">
        {sessions.length > 0 ? (
          sessions.map((session) => <SessionCard key={session.id} onDelete={deleteCurrentSession} session={session} />)
        ) : (
          <div className="empty">Start your first session to see it here.</div>
        )}
      </section>
    </>
  );
}


