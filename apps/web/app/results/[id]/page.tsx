import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ResultsView } from "@/components/ResultsView";
import { getSession } from "@/lib/sessions";

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  if (!session.aiOutput) redirect(`/processing/${session.id}`);

  return (
    <AppShell eyebrow="AI results" title="Your idea, organized">
      <ResultsView session={session} />
    </AppShell>
  );
}

