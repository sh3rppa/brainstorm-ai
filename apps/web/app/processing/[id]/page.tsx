import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ProcessingCard } from "@/components/ProcessingCard";
import { getSession } from "@/lib/sessions";

type ProcessingPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProcessingPage({ params }: ProcessingPageProps) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  if (session.status === "done") redirect(`/results/${session.id}`);

  return (
    <AppShell eyebrow={session.title} title="Making sense of it">
      <ProcessingCard session={session} />
    </AppShell>
  );
}

