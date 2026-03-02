import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Crown, Star, Swords, Trophy } from "lucide-react";
import { useState } from "react";
import type { GlobalLeaderboardEntry } from "../backend.d";
import { LCoinIcon } from "../components/game/LCoinIcon";
import { useGetAllUsers, useGetGlobalLeaderboard } from "../hooks/useQueries";

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.85 0.18 85), oklch(0.70 0.22 65))",
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
          background:
            "linear-gradient(135deg, oklch(0.82 0.04 240), oklch(0.65 0.06 240))",
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
          background:
            "linear-gradient(135deg, oklch(0.72 0.16 50), oklch(0.55 0.14 40))",
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
            <Skeleton className="h-3 w-16 bg-muted/30 rounded" />
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

// ─── Prime Level Row ──────────────────────────────────────────────────────────

function PrimeLevelRow({
  entry,
  rank,
}: { entry: GlobalLeaderboardEntry; rank: number }) {
  const isTopThree = rank <= 3;
  return (
    <div
      data-ocid={`leaderboard.prime.item.${rank}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-100"
      style={{
        background:
          rank % 2 === 0 ? "oklch(0.12 0.015 240 / 0.6)" : "transparent",
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
      <RankBadge rank={rank} />
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
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span
          className="text-xs font-bold font-display tracking-wider"
          style={{ color: "oklch(0.72 0.22 45)" }}
        >
          {Number(entry.totalScore).toLocaleString()} pts
        </span>
        <span
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: "oklch(0.72 0.20 145)" }}
        >
          <LCoinIcon size={13} />
          {Number(entry.totalWinnings).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Oldest Member Row ────────────────────────────────────────────────────────

function getMemberTier(legendIdNum: number): {
  label: string;
  color: string;
  glow: string;
} {
  if (legendIdNum <= 2) {
    return {
      label: "FOUNDING MEMBER",
      color: "oklch(0.85 0.22 55)",
      glow: "oklch(0.72 0.22 45 / 0.5)",
    };
  }
  if (legendIdNum <= 10) {
    return {
      label: "FOUNDER",
      color: "oklch(0.82 0.20 55)",
      glow: "oklch(0.72 0.22 45 / 0.4)",
    };
  }
  if (legendIdNum <= 50) {
    return {
      label: "VETERAN",
      color: "oklch(0.72 0.18 200)",
      glow: "oklch(0.60 0.18 200 / 0.3)",
    };
  }
  if (legendIdNum <= 100) {
    return {
      label: "PIONEER",
      color: "oklch(0.72 0.18 160)",
      glow: "oklch(0.60 0.18 160 / 0.3)",
    };
  }
  return {
    label: "MEMBER",
    color: "oklch(0.55 0.06 240)",
    glow: "transparent",
  };
}

function OldestMemberRow({
  profile,
  rank,
}: {
  profile: { username: string; inGameName: string; legendId: number };
  rank: number;
}) {
  const isTopThree = rank <= 3;
  const isFounder = profile.legendId <= 10;
  const tier = getMemberTier(profile.legendId);
  const legendIdStr = `#${String(profile.legendId).padStart(4, "0")}`;

  return (
    <div
      data-ocid={`leaderboard.oldest.item.${rank}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-100"
      style={{
        background:
          rank % 2 === 0 ? "oklch(0.12 0.015 240 / 0.6)" : "transparent",
        borderBottom: "1px solid oklch(0.18 0.02 240)",
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

      {/* Name + tier */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {isFounder && (
            <Crown
              className="w-3 h-3 shrink-0"
              style={{ color: "oklch(0.85 0.22 55)" }}
            />
          )}
          <p
            className="font-display font-bold text-sm truncate tracking-wide"
            style={{
              color: isTopThree
                ? "oklch(0.95 0.02 240)"
                : "oklch(0.80 0.02 240)",
            }}
          >
            {profile.inGameName || profile.username || "Anonymous"}
          </p>
        </div>
        <span
          className="text-[10px] font-bold tracking-[0.12em] uppercase"
          style={{
            color: tier.color,
            textShadow: `0 0 8px ${tier.glow}`,
          }}
        >
          {tier.label}
        </span>
      </div>

      {/* Legend ID badge */}
      <div
        className="shrink-0 px-2 py-1 rounded-lg"
        style={{
          background: "oklch(0.72 0.22 45 / 0.10)",
          border: "1px solid oklch(0.72 0.22 45 / 0.3)",
          boxShadow: isFounder ? "0 0 10px oklch(0.72 0.22 45 / 0.2)" : "none",
        }}
      >
        <span
          className="font-display font-black text-xs tracking-wider"
          style={{
            color: "oklch(0.82 0.22 55)",
            textShadow: isFounder
              ? "0 0 8px oklch(0.72 0.22 45 / 0.5)"
              : "none",
          }}
        >
          {legendIdStr}
        </span>
      </div>
    </div>
  );
}

// ─── Global Rankings Row ──────────────────────────────────────────────────────

function GlobalRankRow({
  entry,
  rank,
}: { entry: GlobalLeaderboardEntry; rank: number }) {
  const isTopThree = rank <= 3;
  const approxWins = Math.max(1, Math.floor(Number(entry.totalScore) / 10));

  return (
    <div
      data-ocid={`leaderboard.global.item.${rank}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-100"
      style={{
        background:
          rank % 2 === 0 ? "oklch(0.12 0.015 300 / 0.5)" : "transparent",
        borderBottom: "1px solid oklch(0.18 0.02 290)",
        ...(isTopThree && {
          borderLeft: `2px solid ${
            rank === 1
              ? "oklch(0.75 0.22 310)"
              : rank === 2
                ? "oklch(0.82 0.04 240)"
                : "oklch(0.72 0.16 50)"
          }`,
        }),
      }}
    >
      <RankBadge rank={rank} />

      <div className="flex-1 min-w-0">
        <p
          className="font-display font-bold text-sm truncate tracking-wide"
          style={{
            color: isTopThree ? "oklch(0.95 0.02 290)" : "oklch(0.80 0.02 290)",
          }}
        >
          {entry.username || "Anonymous"}
        </p>
        <span
          className="text-[10px] font-bold tracking-[0.12em] uppercase"
          style={{ color: "oklch(0.62 0.16 310)" }}
        >
          {approxWins} {approxWins === 1 ? "WIN" : "WINS"}
        </span>
      </div>

      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span
          className="text-xs font-bold font-display tracking-wider"
          style={{
            color: "oklch(0.75 0.22 310)",
            textShadow: isTopThree
              ? "0 0 8px oklch(0.75 0.22 310 / 0.5)"
              : "none",
          }}
        >
          {Number(entry.totalScore).toLocaleString()}
        </span>
        <span
          className="text-[10px] font-bold tracking-widest"
          style={{ color: "oklch(0.50 0.10 310)" }}
        >
          WIN PTS
        </span>
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

type TabId = "prime" | "oldest" | "global";

function TabButton({
  id,
  active,
  icon,
  label,
  onClick,
}: {
  id: TabId;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid={`leaderboard.${id}.tab`}
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 transition-all duration-150 relative"
      style={{
        background: active ? "oklch(0.13 0.025 240)" : "transparent",
        borderBottom: active
          ? `2px solid ${
              id === "prime"
                ? "oklch(0.72 0.22 45)"
                : id === "oldest"
                  ? "oklch(0.80 0.20 55)"
                  : "oklch(0.72 0.22 310)"
            }`
          : "2px solid transparent",
      }}
    >
      <span className="text-base leading-none">{icon}</span>
      <span
        className="text-[9px] font-display font-black tracking-[0.15em] uppercase"
        style={{
          color: active
            ? id === "prime"
              ? "oklch(0.72 0.22 45)"
              : id === "oldest"
                ? "oklch(0.80 0.20 55)"
                : "oklch(0.72 0.22 310)"
            : "oklch(0.42 0.02 240)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Prime Level Tab ──────────────────────────────────────────────────────────

function PrimeLevelTab() {
  const { data: entries, isLoading, isError } = useGetGlobalLeaderboard();
  const top100 = (entries ?? []).slice(0, 100);

  return (
    <>
      {/* Column headers */}
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

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <div
          data-ocid="leaderboard.prime.error_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6"
        >
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
      ) : top100.length === 0 ? (
        <div
          data-ocid="leaderboard.prime.empty_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6"
        >
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
            {top100.map((entry, idx) => (
              <PrimeLevelRow
                key={entry.player.toString()}
                entry={entry}
                rank={idx + 1}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}

// ─── Oldest Member Tab ────────────────────────────────────────────────────────

function OldestMemberTab() {
  const { data: allUsers, isLoading, isError } = useGetAllUsers();

  // Sort by legendId ascending (lowest = oldest)
  const sorted = [...(allUsers ?? [])]
    .map(([, profile]) => ({
      username: profile.username,
      inGameName: profile.inGameName,
      legendId: Number(profile.legendId),
    }))
    .sort((a, b) => a.legendId - b.legendId)
    .slice(0, 50);

  return (
    <>
      {/* Hall of fame header */}
      <div
        className="px-4 py-3 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.04 55), oklch(0.11 0.015 240))",
          borderBottom: "1px solid oklch(0.22 0.04 55 / 0.5)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.22 45 / 0.08), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <Clock
            className="w-4 h-4 shrink-0"
            style={{ color: "oklch(0.80 0.20 55)" }}
          />
          <div>
            <p
              className="text-xs font-display font-black tracking-[0.2em] uppercase"
              style={{ color: "oklch(0.80 0.20 55)" }}
            >
              TOP 50 OLDEST MEMBERS
            </p>
            <p
              className="text-[10px] font-body"
              style={{ color: "oklch(0.50 0.06 55)" }}
            >
              Oldest accounts since platform launch
            </p>
          </div>
        </div>
      </div>

      {/* Column headers */}
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
          MEMBER
        </p>
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "oklch(0.45 0.02 240)" }}
        >
          LEGEND ID
        </p>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <div
          data-ocid="leaderboard.oldest.error_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6"
        >
          <Clock
            className="w-12 h-12 opacity-20"
            style={{ color: "oklch(0.72 0.22 45)" }}
          />
          <p
            className="text-sm font-display tracking-wider"
            style={{ color: "oklch(0.45 0.02 240)" }}
          >
            Failed to load members
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="leaderboard.oldest.empty_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6"
        >
          <Crown
            className="w-14 h-14 opacity-20"
            style={{ color: "oklch(0.72 0.22 45)" }}
          />
          <p
            className="text-base font-display font-bold tracking-wider"
            style={{ color: "oklch(0.55 0.02 240)" }}
          >
            No members yet
          </p>
          <p
            className="text-xs text-center"
            style={{ color: "oklch(0.40 0.02 240)" }}
          >
            Be the first to register and claim the Founding Member badge!
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="pb-4">
            {sorted.map((member, idx) => (
              <OldestMemberRow
                key={member.legendId}
                profile={member}
                rank={idx + 1}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}

// ─── Global Rankings Tab ──────────────────────────────────────────────────────

function GlobalRankingsTab() {
  const { data: entries, isLoading, isError } = useGetGlobalLeaderboard();

  // Sort by totalScore descending for win points
  const sorted = [...(entries ?? [])]
    .sort((a, b) => Number(b.totalScore) - Number(a.totalScore))
    .slice(0, 100);

  return (
    <>
      {/* Rankings header */}
      <div
        className="px-4 py-3 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.04 300), oklch(0.11 0.015 240))",
          borderBottom: "1px solid oklch(0.22 0.04 300 / 0.5)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.22 310 / 0.08), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <Star
            className="w-4 h-4 shrink-0"
            style={{ color: "oklch(0.72 0.22 310)" }}
          />
          <div>
            <p
              className="text-xs font-display font-black tracking-[0.2em] uppercase"
              style={{ color: "oklch(0.72 0.22 310)" }}
            >
              GLOBAL RANKINGS
            </p>
            <p
              className="text-[10px] font-body"
              style={{ color: "oklch(0.50 0.08 310)" }}
            >
              Top players by total win points
            </p>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center px-4 py-2 gap-3"
        style={{
          background: "oklch(0.11 0.015 290)",
          borderBottom: "1px solid oklch(0.18 0.02 290)",
        }}
      >
        <div className="w-8 shrink-0" />
        <p
          className="flex-1 text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "oklch(0.42 0.04 290)" }}
        >
          PLAYER
        </p>
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "oklch(0.42 0.04 290)" }}
        >
          WIN POINTS
        </p>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <div
          data-ocid="leaderboard.global.error_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6"
        >
          <Star
            className="w-12 h-12 opacity-20"
            style={{ color: "oklch(0.72 0.22 310)" }}
          />
          <p
            className="text-sm font-display tracking-wider"
            style={{ color: "oklch(0.45 0.02 240)" }}
          >
            Failed to load rankings
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="leaderboard.global.empty_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6"
        >
          <Star
            className="w-14 h-14 opacity-20"
            style={{ color: "oklch(0.72 0.22 310)" }}
          />
          <p
            className="text-base font-display font-bold tracking-wider"
            style={{ color: "oklch(0.55 0.02 240)" }}
          >
            No rankings yet
          </p>
          <p
            className="text-xs text-center"
            style={{ color: "oklch(0.40 0.02 240)" }}
          >
            Win tournaments to climb the global rankings
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="pb-4">
            {sorted.map((entry, idx) => (
              <GlobalRankRow
                key={entry.player.toString()}
                entry={entry}
                rank={idx + 1}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("prime");
  const navigate = useNavigate();

  return (
    <div
      className="min-h-full flex flex-col"
      style={{ background: "oklch(0.09 0.015 240)" }}
    >
      {/* ── GREEN JOIN BUTTON ─────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-0">
        <button
          type="button"
          data-ocid="leaderboard.join.primary_button"
          onClick={() => navigate({ to: "/" })}
          className="w-full h-12 rounded-xl font-display font-black text-base tracking-[0.2em] uppercase transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.60 0.22 145), oklch(0.52 0.20 150))",
            color: "#ffffff",
            boxShadow:
              "0 0 20px oklch(0.60 0.22 145 / 0.45), 0 2px 8px oklch(0.40 0.20 145 / 0.4)",
            border: "1px solid oklch(0.68 0.22 145 / 0.5)",
          }}
        >
          <Swords className="w-4 h-4 shrink-0" />
          JOIN A TOURNAMENT
        </button>
      </div>

      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div
        className="px-4 pt-5 pb-4 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.13 0.025 240), oklch(0.09 0.015 240))",
          borderBottom: "1px solid oklch(0.18 0.02 240)",
        }}
      >
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
              Leaderboard
            </h1>
            <p
              className="text-[11px] font-bold tracking-[0.3em] mt-0.5"
              style={{ color: "oklch(0.72 0.22 45)" }}
            >
              RANKINGS & HALL OF FAME
            </p>
          </div>
        </div>
      </div>

      {/* ── 3-TAB SWITCHER ────────────────────────────────────────── */}
      <div
        className="flex"
        style={{
          background: "oklch(0.11 0.015 240)",
          borderBottom: "1px solid oklch(0.18 0.02 240)",
        }}
      >
        <TabButton
          id="prime"
          active={activeTab === "prime"}
          icon="🏆"
          label="Prime Level"
          onClick={() => setActiveTab("prime")}
        />
        <TabButton
          id="oldest"
          active={activeTab === "oldest"}
          icon="⏰"
          label="Oldest Member"
          onClick={() => setActiveTab("oldest")}
        />
        <TabButton
          id="global"
          active={activeTab === "global"}
          icon="🌟"
          label="Global Rank"
          onClick={() => setActiveTab("global")}
        />
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "prime" && <PrimeLevelTab />}
        {activeTab === "oldest" && <OldestMemberTab />}
        {activeTab === "global" && <GlobalRankingsTab />}
      </div>
    </div>
  );
}
