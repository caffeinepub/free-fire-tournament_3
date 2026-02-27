import { useNavigate } from "@tanstack/react-router";
import { useGetCallerUserProfile } from "../../hooks/useQueries";
import { useLocalAuth } from "../../hooks/useLocalAuth";
import { Flame } from "lucide-react";
import { LCoinIcon } from "./LCoinIcon";

export default function TopHeader() {
  const navigate = useNavigate();
  const { isAuthenticated } = useLocalAuth();
  const { data: userProfile } = useGetCallerUserProfile();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      style={{
        background: "oklch(0.09 0.015 240)",
        borderBottom: "1px solid oklch(0.22 0.02 240)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "oklch(0.72 0.22 45 / 0.15)",
            border: "1px solid oklch(0.72 0.22 45 / 0.4)",
          }}
        >
          <Flame className="w-4 h-4 neon-text-orange" />
        </div>
        <span className="font-display font-bold text-lg neon-text-orange tracking-widest">
          FF ARENA
        </span>
      </div>

      {/* Balance shortcut */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => navigate({ to: "/wallet" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{
            background: "oklch(0.82 0.18 85 / 0.1)",
            border: "1px solid oklch(0.82 0.18 85 / 0.3)",
          }}
        >
          <LCoinIcon size={22} />
          <span
            className="font-display font-bold text-sm"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            {(userProfile?.balance ?? 0n).toString()}
          </span>
        </button>
      )}
    </header>
  );
}
