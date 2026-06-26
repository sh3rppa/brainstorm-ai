import { AppShell } from "@/components/AppShell";
import { TeamMemberCard } from "@/components/TeamMemberCard";

export default function TeamPage() {
  return (
    <AppShell eyebrow="Collaborate" title="Team space">
      <section className="simple-panel">
        <p className="eyebrow">Early access</p>
        <h2>Think together, without losing the thread.</h2>
        <p className="panel-copy">
          Team Mode keeps collaborators in the same session and gives everyone a clear role. Real-time presence and
          invitations are prepared for the production adapter.
        </p>
        <div className="section-head">
          <div>
            <h2>Your team</h2>
            <p>3 members - Pro trial</p>
          </div>
          <button className="btn primary" type="button">
            Invite member
          </button>
        </div>
        <div className="team-grid">
          <TeamMemberCard initials="AM" name="Alex Morgan" role="Host - Product" />
          <TeamMemberCard initials="SK" name="Sam Kim" role="Contributor - Design" />
          <TeamMemberCard initials="JR" name="Jamie Rivera" role="Contributor - Engineering" />
        </div>
      </section>
    </AppShell>
  );
}

