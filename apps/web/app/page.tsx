import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/AppShell";
import { SessionListClient } from "@/components/SessionListClient";
import { listSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await auth.protect();

  const sessions = await listSessions();

  return (
    <AppShell>
      <SessionListClient initialSessions={sessions} limit={3} mode="home" />
    </AppShell>
  );
}