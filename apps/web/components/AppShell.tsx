import type { ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";
import { ToastHost } from "@/components/toast";
import { Topbar } from "@/components/Topbar";

type AppShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
};

export function AppShell({ children, eyebrow, title }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Topbar eyebrow={eyebrow} title={title} />
        <div className="page">{children}</div>
      </main>
      <ToastHost />
    </div>
  );
}

