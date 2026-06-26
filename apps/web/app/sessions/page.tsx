import { AppShell } from "@/components/AppShell";
import { SessionListClient } from "@/components/SessionListClient";
import { listSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await listSessions();

  return (
    <AppShell eyebrow="Your work" title="Session library">
      <SessionListClient initialSessions={sessions} mode="library" />
    </AppShell>
  );
}

