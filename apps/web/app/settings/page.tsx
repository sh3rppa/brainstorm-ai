import { AppShell } from "@/components/AppShell";
import { SettingsRow } from "@/components/SettingsRow";

export default function SettingsPage() {
  return (
    <AppShell eyebrow="Account" title="Your preferences">
      <section className="simple-panel">
        <p className="eyebrow">Preferences</p>
        <h2>Settings</h2>
        <SettingsRow description="Keep session audio in memory until processing begins." title="Local-first capture" type="toggle" />
        <SettingsRow description="Show a notification when AI results are ready." title="Processing notifications" type="toggle" />
        <SettingsRow description="Receive a concise summary of themes across your sessions." title="Weekly thinking recap" type="toggle" />
        <SettingsRow
          actionLabel="View plans"
          description="Free - 3 of 5 sessions used this month"
          title="Plan"
          toast="Plans are ready for a future billing adapter."
          type="button"
        />
        <SettingsRow
          actionLabel="Connect"
          description="Notion, GitHub, Figma, Slack, Google Drive, and Linear"
          title="Integrations"
          toast="Integration adapters are ready to configure."
          type="button"
        />
      </section>
    </AppShell>
  );
}

