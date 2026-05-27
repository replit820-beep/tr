import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutDashboard, User, Headphones } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/support", label: "Support", icon: Headphones },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <div className="h-24" />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl transition ${active ? "bg-[var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-transparent"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}