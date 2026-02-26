import { Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetGlobalLeaderboard } from "../hooks/useQueries";
import type { GlobalLeaderboardEntry } from "../backend.d";

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.85 0.18 85), oklch(0.70 0.22 65))",
          color: "oklch(0.15 0.02 80)",
          boxShadow: "0 0 12px oklch(0.85 0.18 85 / 0.6)",
        }}
      >
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.82 0.04 240), oklch(0.65 0.06 240))",
          color: "oklch(0.15 0.02 240)",
          boxShadow: "0 0 10px oklch(0.82 0.04 240 / 0.5)",
        }}
      >
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.16 50), oklch(0.55 0.14 40))",
          color: "oklch(0.92 0.04 50)",
          boxShadow: "0 0 10px oklch(0.72 0.16 50 / 0.5)",
        }}
      >
        3
      </div>
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{
        background: "oklch(0.16 0.02 240)",
        color: "oklch(0.45 0.02 240)",
        border: "1px solid oklch(0.22 0.02 240)",
      }}
    >
      {rank}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function LeaderboardRow({ entry, rank }: { entry: GlobalLeaderboardEntry; rank: number }) {
  const isTopThree = rank <= 3;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-100"
      style={{
        background:
          rank % 2 === 0
            ? "oklch(0.12 0.015 240 / 0.6)"
            : "transparent",
        borderBottom: "1px solid oklch(0.16 0.015 240)",
        ...(isTopThree && {
          borderLeft: `2px solid ${
            rank === 1
              ? "oklch(0.85 0.18 85)"
              : rank === 2
              ? "oklch(0.82 0.04 240)"
              : "oklch(0.72 0.16 50)"
          }`,
        }),
      }}
    >
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p
          className="font-display font-bold text-sm truncate tracking-wide"
          style={{
            color: isTopThree ? "oklch(0.95 0.02 240)" : "oklch(0.80 0.02 240)",
          }}
        >
          {entry.username || "Anonymous"}
        </p>
      </div>

      {/* Score & Winnings */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span
          className="text-xs font-bold font-display tracking-wider"
          style={{ color: "oklch(0.72 0.22 45)" }}
        >
          {Number(entry.totalScore).toLocaleString()} pts
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: "oklch(0.72 0.20 145)" }}
        >
          {Number(entry.totalWinnings).toLocaleString()} 🪙
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="flex flex-col">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}
        >
          <Skeleton className="w-8 h-8 rounded-full bg-muted/30 shrink-0" />
          <div className="flex-1 flex flex-col gap-1">
            <Skeleton className="h-3.5 w-28 bg-muted/30 rounded" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-16 bg-muted/30 rounded" />
            <Skeleton className="h-3 w-12 bg-muted/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { data: entries, isLoading, isError } = useGetGlobalLeaderboard();

  const topHundred = (entries ?? []).slice(0, 100);

  return (
    <div
      className="min-h-full flex flex-col"
      style={{ background: "oklch(0.09 0.015 240)" }}
    >
      {/* Header */}
      <div
        className="px-4 pt-5 pb-4 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.13 0.025 240), oklch(0.09 0.015 240))",
          borderBottom: "1px solid oklch(0.18 0.02 240)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.72 0.22 45 / 0.15), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.22 45 / 0.2), oklch(0.72 0.22 45 / 0.05))",
              border: "1px solid oklch(0.72 0.22 45 / 0.4)",
              boxShadow: "0 0 20px oklch(0.72 0.22 45 / 0.2)",
            }}
          >
            <Trophy
              className="w-6 h-6"
              style={{ color: "oklch(0.72 0.22 45)" }}
            />
          </div>

          <div>
            <h1
              className="font-display font-black text-xl tracking-[0.2em] uppercase"
              style={{ color: "oklch(0.95 0.02 240)" }}
            >
              Global Leaderboard
            </h1>
            <p
              className="text-[11px] font-bold tracking-[0.3em] mt-0.5"
              style={{ color: "oklch(0.72 0.22 45)" }}
            >
              TOP 100 PLAYERS
            </p>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div
        className="flex items-center px-4 py-2 gap-3"
        style={{
          background: "oklch(0.11 0.015 240)",
          borderBottom: "1px solid oklch(0.18 0.02 240)",
        }}
      >
        <div className="w-8 shrink-0" />
        <p
          className="flex-1 text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "oklch(0.45 0.02 240)" }}
        >
          PLAYER
        </p>
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "oklch(0.45 0.02 240)" }}
        >
          SCORE / WINNINGS
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6">
          <Trophy
            className="w-12 h-12 opacity-20"
            style={{ color: "oklch(0.72 0.22 45)" }}
          />
          <p
            className="text-sm font-display tracking-wider"
            style={{ color: "oklch(0.45 0.02 240)" }}
          >
            Failed to load leaderboard
          </p>
        </div>
      ) : topHundred.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6">
          <Trophy
            className="w-14 h-14 opacity-20"
            style={{ color: "oklch(0.72 0.22 45)" }}
          />
          <p
            className="text-base font-display font-bold tracking-wider"
            style={{ color: "oklch(0.55 0.02 240)" }}
          >
            No scores posted yet
          </p>
          <p
            className="text-xs text-center"
            style={{ color: "oklch(0.40 0.02 240)" }}
          >
            Complete a tournament to appear on the leaderboard
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="pb-4">
            {topHundred.map((entry, idx) => (
              <LeaderboardRow key={entry.player.toString()} entry={entry} rank={idx + 1} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
