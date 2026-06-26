"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { showToast } from "@/components/toast";
import { apiJson } from "@/lib/api-client";
import type { BrainstormSession } from "@/types/domain";

type ProcessingCardProps = {
  session: BrainstormSession;
};

export function ProcessingCard({ session }: ProcessingCardProps) {
  const router = useRouter();

  useEffect(() => {
    if (session.status === "done") {
      router.replace(`/results/${session.id}`);
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const latest = await apiJson<BrainstormSession>(`/sessions/${session.id}`);
        if (latest.status === "done") router.replace(`/results/${latest.id}`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not load processing status.");
      }
    }, 900);

    return () => window.clearInterval(interval);
  }, [router, session.id, session.status]);

  return (
    <section className="processing">
      <div className="processing-card">
        <div className="processing-mark">
          <span />
        </div>
        <p className="eyebrow">Multimodal analysis</p>
        <h2>Connecting the useful dots.</h2>
        <p>
          Brainstorm AI is organizing your notes and canvas into a focused summary, prioritized ideas, a diagram,
          starter code, and a project brief.
        </p>
        <div className="progress">
          <span />
        </div>
        <small>This local demo usually takes about two seconds.</small>
      </div>
    </section>
  );
}

