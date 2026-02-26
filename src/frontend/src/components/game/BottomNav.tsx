import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, User, Trophy } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "HOME" },
  { to: "/wallet", icon: Wallet, label: "WALLET" },
  { to: "/leaderboard", icon: Trophy, label: "RANKS" },
  { to: "/profile", icon: User, label: "PROFILE" },
] as const;

export default function BottomNav() {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30"
      style={{
        background: "oklch(0.09 0.015 240)",
        borderTop: "1px solid oklch(0.22 0.02 240)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-150 relative"
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.22 45)" }}
                />
              )}
              <Icon
                className="w-5 h-5 transition-all duration-150"
                style={{
                  color: isActive ? "oklch(0.72 0.22 45)" : "oklch(0.45 0.02 240)",
                  filter: isActive ? "drop-shadow(0 0 6px oklch(0.72 0.22 45 / 0.6))" : "none",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
              />
              <span
                className="text-[10px] font-display font-bold tracking-wider transition-all duration-150"
                style={{
                  color: isActive ? "oklch(0.72 0.22 45)" : "oklch(0.45 0.02 240)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
