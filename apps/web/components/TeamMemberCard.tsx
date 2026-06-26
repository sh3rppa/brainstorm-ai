type TeamMemberCardProps = {
  initials: string;
  name: string;
  role: string;
};

export function TeamMemberCard({ initials, name, role }: TeamMemberCardProps) {
  return (
    <div className="member">
      <div className="avatar">{initials}</div>
      <div>
        <strong>{name}</strong>
        <small>{role}</small>
      </div>
    </div>
  );
}

