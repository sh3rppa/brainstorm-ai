import Link from "next/link";

type TopbarProps = {
  eyebrow?: string;
  title?: string;
};

export function Topbar({ eyebrow = "Brainstorm AI", title = "Your thinking space" }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <Link className="btn ghost" href="/sessions">
          Browse sessions
        </Link>
        <div className="avatar" title="Alex Morgan">
          AM
        </div>
      </div>
    </header>
  );
}

