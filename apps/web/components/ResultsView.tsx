"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/icons";
import { ResultContent } from "@/components/ResultContent";
import { ResultTabs } from "@/components/ResultTabs";
import { showToast } from "@/components/toast";
import { apiJson } from "@/lib/api-client";
import type { BrainstormSession } from "@/types/domain";

export type ResultTab = "summary" | "ideas" | "diagram" | "code" | "brief";

type ResultsViewProps = {
  session: BrainstormSession;
};

export function ResultsView({ session }: ResultsViewProps) {
  const [tab, setTab] = useState<ResultTab>("summary");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const output = session.aiOutput;

  async function copyBrief(): Promise<void> {
    if (!output) return;
    await navigator.clipboard.writeText(output.projectBrief).catch(() => undefined);
    showToast("Project brief copied.");
  }

  async function createNewSession(): Promise<void> {
    setBusy(true);
    try {
      const nextSession = await apiJson<BrainstormSession>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled brainstorm" }),
      });
      router.push(`/session/${nextSession.id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create the session.");
      setBusy(false);
    }
  }

  if (!output) return <div className="empty">Results are still being prepared.</div>;

  return (
    <>
      <div className="result-header">
        <div>
          <p className="eyebrow">Session complete</p>
          <h1>{session.title}</h1>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={copyBrief} type="button">
            <Icon name="copy" />
            Copy brief
          </button>
          <button className="btn acid" disabled={busy} onClick={createNewSession} type="button">
            <Icon name="plus" />
            New session
          </button>
        </div>
      </div>
      <ResultTabs activeTab={tab} onChange={setTab} />
      <section className="result-card">
        <ResultContent output={output} tab={tab} />
      </section>
    </>
  );
}

