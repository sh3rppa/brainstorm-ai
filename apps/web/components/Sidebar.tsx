"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/icons";

type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
  matches: (pathname: string) => boolean;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Home", icon: "home", matches: (pathname) => pathname === "/" },
  {
    href: "/sessions",
    label: "Sessions",
    icon: "sessions",
    matches: (pathname) =>
      pathname.startsWith("/sessions") ||
      pathname.startsWith("/session") ||
      pathname.startsWith("/processing") ||
      pathname.startsWith("/results"),
  },
  { href: "/team", label: "Team", icon: "user", matches: (pathname) => pathname.startsWith("/team") },
  {
    href: "/settings",
    label: "Settings",
    icon: "settings",
    matches: (pathname) => pathname.startsWith("/settings"),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">B</span>
        <span className="brand-name">Brainstorm AI</span>
      </Link>
      <nav aria-label="Primary navigation" className="nav">
        {navigationItems.map((item) => (
          <Link className={`nav-button ${item.matches(pathname) ? "active" : ""}`} href={item.href} key={item.href}>
            <Icon className="nav-icon" name={item.icon} />
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="plan-row">
          <strong>FREE PLAN</strong>
          <span>3 / 5</span>
        </div>
        <div className="meter">
          <span />
        </div>
        <div className="plan-row">
          <span>Sessions this month</span>
        </div>
      </div>
    </aside>
  );
}

