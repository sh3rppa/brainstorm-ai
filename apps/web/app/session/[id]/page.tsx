import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { CaptureWorkspace } from "@/components/CaptureWorkspace";
import { getSession } from "@/lib/sessions";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  if (session.status === "done") redirect(`/results/${session.id}`);
  if (session.status === "processing") redirect(`/processing/${session.id}`);

  return (
    <AppShell eyebrow={session.title} title="Live session">
      <CaptureWorkspace session={session} />
    </AppShell>
  );
}

