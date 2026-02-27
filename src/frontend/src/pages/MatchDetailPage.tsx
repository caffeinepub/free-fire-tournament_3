import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useLocalAuth } from "../hooks/useLocalAuth";
import {
  useGetTournament,
  useGetLeaderboard,
  useGetTakenSlots,
  useJoinTournament,
  useGetCallerUserProfile,
  useGetCategories,
} from "../hooks/useQueries";
import { TournamentStatus } from "../backend.d";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Trophy,
  Users,
  ChevronDown,
  ChevronUp,
  Medal,
  Swords,
  Clock,
  Ban,
} from "lucide-react";
import { LCoinIcon } from "../components/game/LCoinIcon";
import { toast } from "sonner";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TournamentStatus }) {
  const config = {
    [TournamentStatus.active]: { label: "LIVE", cls: "bg-neon-green/20 text-neon-green border-neon-green/40" },
    [TournamentStatus.upcoming]: { label: "UPCOMING", cls: "bg-neon-blue/20 text-neon-blue border-neon-blue/40" },
    [TournamentStatus.completed]: { label: "ENDED", cls: "bg-muted/40 text-muted-foreground border-border" },
  };
  const c = config[status];
  return (
    <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full tracking-widest border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Slot Grid ────────────────────────────────────────────────────────────────

function SlotGrid({
  totalSlots,
  takenSlots,
  mySlot,
  selectedSlot,
  onSelect,
  disabled,
}: {
  totalSlots: bigint;
  takenSlots: bigint[];
  mySlot: bigint | null;
  selectedSlot: bigint | null;
  onSelect: (n: bigint) => void;
  disabled: boolean;
}) {
  const takenSet = new Set(takenSlots.map((s) => s.toString()));
  const total = Number(totalSlots);

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}>
      {Array.from({ length: total }, (_, i) => {
        const num = BigInt(i + 1);
        const numStr = num.toString();
        const isMySlot = mySlot?.toString() === numStr;
        const isTaken = takenSet.has(numStr) && !isMySlot;
        const isSelected = selectedSlot?.toString() === numStr;

        let cls = "";
        if (isMySlot) cls = "slot-mine";
        else if (isTaken) cls = "slot-taken";
        else if (isSelected) cls = "slot-selected";
        else cls = "slot-available";

        return (
          <button
            type="button"
            key={numStr}
            disabled={isTaken || disabled}
            onClick={() => !isTaken && onSelect(num)}
            className={`h-11 rounded-lg text-xs font-display font-bold transition-all duration-100 ${cls} ${
              !isTaken && !disabled ? "active:scale-90" : ""
            }`}
          >
            {num.toString()}
          </button>
        );
      })}
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function LeaderboardTab({ tournamentId }: { tournamentId: bigint }) {
  const { data: entries, isLoading } = useGetLeaderboard(tournamentId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-muted/50" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <Trophy className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm font-body">No scores posted yet</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => (b.score > a.score ? 1 : -1));

  const rankColors = [
    "oklch(0.82 0.18 85)",  // gold
    "oklch(0.75 0.04 240)", // silver
    "oklch(0.6 0.12 55)",   // bronze
  ];

  return (
    <div className="flex flex-col gap-2 p-4">
      {sorted.map((entry, idx) => {
        const rankColor = rankColors[idx] ?? "oklch(0.55 0.02 240)";
        const principalShort =
          entry.player.toString().slice(0, 5) + "..." + entry.player.toString().slice(-5);
        return (
          <div
            key={`${entry.player.toString()}-${idx}`}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background:
                idx < 3
                  ? `oklch(${0.12 + idx * 0.01} 0.02 240)`
                  : "oklch(0.11 0.015 240)",
              border: `1px solid ${idx < 3 ? `${rankColor}40` : "oklch(0.22 0.02 240)"}`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0"
              style={{
                background: idx < 3 ? `${rankColor}20` : "oklch(0.18 0.02 240)",
                color: rankColor,
              }}
            >
              {idx < 3 ? <Medal className="w-4 h-4" style={{ color: rankColor }} /> : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-foreground truncate">
                {principalShort}
              </p>
            </div>
            <span
              className="font-mono-game text-sm font-bold shrink-0"
              style={{ color: rankColor }}
            >
              {entry.score.toString()} pts
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  tournamentId,
  status,
  entryFee,
  totalSlots,
  rules,
  prizeDistribution,
  selectedSlot,
  setSelectedSlot,
  joinMutation,
  hasEnoughBalance,
  isLoggedIn,
}: {
  tournamentId: bigint;
  status: TournamentStatus;
  entryFee: bigint;
  totalSlots: bigint;
  rules: string;
  prizeDistribution: bigint[];
  selectedSlot: bigint | null;
  setSelectedSlot: (s: bigint | null) => void;
  joinMutation: ReturnType<typeof useJoinTournament>;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const { data: takenSlots, isLoading: slotsLoading } = useGetTakenSlots(tournamentId);

  const isActive = status === TournamentStatus.active;
  const canJoin = isActive && isLoggedIn;

  const mySlot = null; // Would need per-user slot tracking from backend

  const rankColors = [
    "oklch(0.82 0.18 85)",
    "oklch(0.75 0.04 240)",
    "oklch(0.6 0.12 55)",
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Slot Selection (only when active + logged in) */}
      {canJoin && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{
            background: "linear-gradient(135deg, oklch(0.14 0.025 45), oklch(0.12 0.015 240))",
            border: "1px solid oklch(0.72 0.22 45 / 0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-bold text-foreground">
              Select Your Slot
            </span>
            {selectedSlot && (
              <span className="text-sm font-display neon-text-orange">
                Slot #{selectedSlot.toString()} selected
              </span>
            )}
          </div>

          {slotsLoading ? (
            <Skeleton className="h-20 bg-muted/50 rounded-lg" />
          ) : (
            <SlotGrid
              totalSlots={totalSlots}
              takenSlots={takenSlots ?? []}
              mySlot={mySlot}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
              disabled={joinMutation.isPending}
            />
          )}

          <div className="flex gap-3 text-xs font-body text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded slot-available inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded slot-taken inline-block" />
              Taken
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded slot-selected inline-block" />
              Selected
            </span>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "oklch(0.14 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
        >
          <p className="text-muted-foreground text-sm font-body">Sign in to join this tournament</p>
        </div>
      )}

      {isLoggedIn && !isActive && (
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "oklch(0.14 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
        >
          <p className="text-muted-foreground text-sm font-body">
            {status === TournamentStatus.upcoming
              ? "Tournament hasn't started yet"
              : "Tournament has ended"}
          </p>
        </div>
      )}

      {/* Prize Distribution */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid oklch(0.25 0.02 240)" }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ background: "oklch(0.14 0.02 240)" }}
        >
          <Trophy className="w-4 h-4" style={{ color: "oklch(0.82 0.18 85)" }} />
          <span className="font-display font-bold text-sm tracking-wider">
            PRIZE DISTRIBUTION
          </span>
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "oklch(0.2 0.02 240)" }}>
          {prizeDistribution.length === 0 ? (
            <div className="px-4 py-3 text-muted-foreground text-sm font-body text-center">
              No prize distribution set
            </div>
          ) : (
            prizeDistribution.map((prize, idx) => {
              const rankColor = rankColors[idx] ?? "oklch(0.55 0.02 240)";
              return (
                <div
                  key={`prize-rank-${idx + 1}`}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderColor: "oklch(0.2 0.02 240)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0"
                      style={{
                        background: `${rankColor}20`,
                        color: rankColor,
                        border: `1px solid ${rankColor}40`,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-body text-muted-foreground">
                      {idx === 0 ? "1st Place" : idx === 1 ? "2nd Place" : idx === 2 ? "3rd Place" : `${idx + 1}th Place`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <LCoinIcon size={14} />
                    <span className="font-display font-bold text-sm" style={{ color: rankColor }}>
                      {prize.toString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rules */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid oklch(0.25 0.02 240)" }}
      >
        <button
          type="button"
          className="w-full px-4 py-3 flex items-center justify-between"
          style={{ background: "oklch(0.14 0.02 240)" }}
          onClick={() => setRulesOpen((o) => !o)}
        >
          <span className="font-display font-bold text-sm tracking-wider">RULES</span>
          {rulesOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {rulesOpen && (
          <div className="px-4 py-3" style={{ background: "oklch(0.11 0.015 240)" }}>
            <p className="text-sm font-body text-muted-foreground whitespace-pre-line leading-relaxed">
              {rules || "No rules specified."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const { id } = useParams({ from: "/match/$id" });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "leaderboard">("details");
  const [selectedSlot, setSelectedSlot] = useState<bigint | null>(null);
  const [isJoinAnimating, setIsJoinAnimating] = useState(false);

  const tournamentId = BigInt(id);
  const { data: tournament, isLoading } = useGetTournament(tournamentId);
  const { data: categories } = useGetCategories();
  const { isAuthenticated } = useLocalAuth();
  const { data: userProfile } = useGetCallerUserProfile();
  const joinMutation = useJoinTournament();

  const categoryName = categories?.find(
    (c) => c.id === tournament?.categoryId
  )?.name ?? "";

  const isActive = tournament?.status === TournamentStatus.active;
  const isLoggedIn = isAuthenticated;
  const hasEnoughBalance = userProfile && tournament
    ? userProfile.balance >= tournament.entryFee
    : false;

  const handleJoin = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to join");
      return;
    }
    if (!isActive) {
      toast.error(
        tournament?.status === TournamentStatus.upcoming
          ? "Tournament hasn't started yet"
          : "Tournament has ended"
      );
      return;
    }
    if (!hasEnoughBalance) {
      toast.error("Insufficient balance to join");
      return;
    }
    if (!selectedSlot) {
      // Switch to details tab and let user pick a slot
      setActiveTab("details");
      toast("Select a slot from the grid below to join!", { icon: "👇" });
      return;
    }
    try {
      await joinMutation.mutateAsync({ tournamentId, slotNumber: selectedSlot });
      toast.success(`Joined slot #${selectedSlot}! Good luck!`);
      setSelectedSlot(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join tournament";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 animate-fade-in">
        <Skeleton className="h-6 w-1/3 bg-muted/50 rounded" />
        <Skeleton className="h-24 w-full bg-muted/50 rounded-xl" />
        <Skeleton className="h-48 w-full bg-muted/50 rounded-xl" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground font-body">Tournament not found</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          className="font-display"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-slide-up">
      {/* Header with back button */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: "oklch(0.08 0.01 240)" }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "oklch(0.16 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-lg leading-tight truncate">
            {tournament.title}
          </h1>
        </div>
        <StatusBadge status={tournament.status} />
      </div>

      {/* Tournament hero */}
      <div
        className="mx-4 mt-2 rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, oklch(0.13 0.02 240), oklch(0.1 0.015 260))",
          border: "1px solid oklch(0.25 0.02 240)",
        }}
      >
        {tournament.imageUrl && (
          <div className="w-full rounded-lg overflow-hidden mb-3" style={{ height: "140px" }}>
            <img
              src={tournament.imageUrl}
              alt={tournament.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        {categoryName && (
          <span
            className="text-[10px] font-display font-bold px-2 py-0.5 rounded tracking-wider"
            style={{
              background: "oklch(0.72 0.22 45 / 0.1)",
              color: "oklch(0.72 0.22 45)",
              border: "1px solid oklch(0.72 0.22 45 / 0.3)",
            }}
          >
            {categoryName.toUpperCase()}
          </span>
        )}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: "oklch(0.09 0.01 240)" }}>
            <LCoinIcon size={18} />
            <span className="text-[10px] font-body text-muted-foreground">Entry</span>
            <span className="text-sm font-display font-bold neon-text-orange">{tournament.entryFee.toString()}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: "oklch(0.09 0.01 240)" }}>
            <Trophy className="w-4 h-4" style={{ color: "oklch(0.82 0.18 85)" }} />
            <span className="text-[10px] font-body text-muted-foreground">Prize</span>
            <span className="text-sm font-display font-bold" style={{ color: "oklch(0.82 0.18 85)" }}>
              {tournament.prizePool.toString()}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: "oklch(0.09 0.01 240)" }}>
            <Users className="w-4 h-4 text-neon-blue" />
            <span className="text-[10px] font-body text-muted-foreground">Slots</span>
            <span className="text-sm font-display font-bold text-neon-blue">
              {tournament.slotsFilled.toString()}/{tournament.totalSlots.toString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── JOIN BUTTON (always visible above tabs) ─────────────────────── */}
      <style>{`
        @keyframes joinRingExpand {
          0%   { transform: scale(1);   opacity: 0.85; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        @keyframes joinRay {
          0%   { transform: scaleX(0); opacity: 1; }
          60%  { opacity: 0.9; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        @keyframes joinFlash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes joinSparkle {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity: 0; }
        }
        @keyframes joinGlowPulse {
          0%, 100% { box-shadow: 0 0 20px oklch(0.60 0.22 145 / 0.45), 0 2px 8px oklch(0.40 0.20 145 / 0.4); }
          50%       { box-shadow: 0 0 36px oklch(0.70 0.25 145 / 0.70), 0 0 60px oklch(0.60 0.22 145 / 0.30), 0 2px 8px oklch(0.40 0.20 145 / 0.4); }
        }
        @keyframes comingSoonPulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
      `}</style>
      <div className="px-4 pt-3 pb-0">
        {/* Wrapper keeps overflow visible for the burst */}
        <div style={{ position: "relative", isolation: "isolate" }}>

          {/* ── Burst layer — uses a 0×0 anchor at true button center ── */}
          {isJoinAnimating && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 50,
                overflow: "visible",
              }}
            >
              {/* Zero-size anchor at the exact center of the button */}
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0 }}>

                {/* Expanding rings — centered on the anchor */}
                {[
                  { delay: 0,   thick: 2,   opacity: 0.85, w: 260, h: 48 },
                  { delay: 120, thick: 1.6, opacity: 0.67, w: 260, h: 48 },
                  { delay: 240, thick: 1.2, opacity: 0.49, w: 260, h: 48 },
                  { delay: 360, thick: 0.8, opacity: 0.31, w: 260, h: 48 },
                ].map(({ delay, thick, opacity, w, h }) => (
                  <div
                    key={`ring-${delay}`}
                    style={{
                      position: "absolute",
                      width: `${w}px`,
                      height: `${h}px`,
                      top: `${-h / 2}px`,
                      left: `${-w / 2}px`,
                      borderRadius: "12px",
                      border: `${thick}px solid oklch(0.72 0.26 145 / ${opacity})`,
                      animation: `joinRingExpand 700ms ease-out ${delay}ms forwards`,
                      transformOrigin: "center center",
                    }}
                  />
                ))}

                {/* Light rays radiating outward from anchor */}
                {[0, 30, 60, 90, 120, 150, 210, 270, 330].map((angle, rayIdx) => {
                  const len = 55 + (rayIdx % 3) * 20;
                  const thick = rayIdx % 2 === 0 ? 2.5 : 1.5;
                  const delayMs = 30 + rayIdx * 20;
                  return (
                    <div
                      key={`ray-${angle}`}
                      style={{
                        position: "absolute",
                        top: `${-thick / 2}px`,
                        left: "0px",
                        width: `${len}px`,
                        height: `${thick}px`,
                        borderRadius: "999px",
                        background: `linear-gradient(90deg, oklch(0.75 0.27 145), transparent)`,
                        transformOrigin: "0% 50%",
                        transform: `rotate(${angle}deg) scaleX(0)`,
                        animation: `joinRay 620ms ease-out ${delayMs}ms forwards`,
                        boxShadow: `0 0 4px oklch(0.80 0.28 145 / 0.7)`,
                      }}
                    />
                  );
                })}

                {/* Sparkle dots flying out from anchor */}
                {[
                  { angle: 45,  dist: 60 },
                  { angle: 135, dist: 55 },
                  { angle: 225, dist: 62 },
                  { angle: 315, dist: 58 },
                  { angle: 10,  dist: 48 },
                  { angle: 170, dist: 50 },
                ].map(({ angle, dist }, sparkIdx) => {
                  const rad = (angle * Math.PI) / 180;
                  const dx = Math.round(Math.cos(rad) * dist);
                  const dy = Math.round(Math.sin(rad) * dist);
                  const sz = sparkIdx % 2 === 0 ? 6 : 4;
                  return (
                    <div
                      key={`spark-${angle}`}
                      style={{
                        position: "absolute",
                        top: `${-sz / 2}px`,
                        left: `${-sz / 2}px`,
                        width: `${sz}px`,
                        height: `${sz}px`,
                        borderRadius: "50%",
                        background: sparkIdx % 3 === 0 ? "#ffffff" : "oklch(0.85 0.25 145)",
                        boxShadow: `0 0 6px 2px ${sparkIdx % 3 === 0 ? "#ffffffcc" : "oklch(0.80 0.28 145 / 0.9)"}`,
                        // @ts-ignore -- CSS custom properties
                        "--dx": `${dx}px`,
                        "--dy": `${dy}px`,
                        animation: `joinSparkle 700ms ease-out ${sparkIdx * 50}ms forwards`,
                      } as React.CSSProperties}
                    />
                  );
                })}

              </div>{/* end anchor */}

              {/* Centre flash — covers full button area */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "12px",
                  background: "radial-gradient(ellipse at center, oklch(0.95 0.15 145 / 0.75) 0%, transparent 70%)",
                  animation: "joinFlash 400ms ease-out 0ms forwards",
                }}
              />
            </div>
          )}

          {/* ── The button itself — appearance changes per tournament status ── */}
          {tournament.status === TournamentStatus.upcoming ? (
            /* UPCOMING — grey "COMING SOON" */
            <button
              type="button"
              onClick={handleJoin}
              className="w-full h-12 rounded-xl font-display font-black text-base tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
              style={{
                position: "relative",
                zIndex: 1,
                background: "linear-gradient(135deg, oklch(0.22 0.02 240), oklch(0.18 0.015 240))",
                color: "oklch(0.55 0.04 240)",
                border: "1px solid oklch(0.30 0.02 240)",
                animation: "comingSoonPulse 2s ease-in-out infinite",
              }}
            >
              <Clock className="w-4 h-4 shrink-0" />
              COMING SOON
            </button>
          ) : tournament.status === TournamentStatus.completed ? (
            /* COMPLETED — dark "ENDED" */
            <button
              type="button"
              onClick={handleJoin}
              className="w-full h-12 rounded-xl font-display font-black text-base tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
              style={{
                position: "relative",
                zIndex: 1,
                background: "linear-gradient(135deg, oklch(0.16 0.015 240), oklch(0.13 0.01 240))",
                color: "oklch(0.42 0.03 240)",
                border: "1px solid oklch(0.24 0.015 240)",
                cursor: "not-allowed",
              }}
            >
              <Ban className="w-4 h-4 shrink-0" />
              ENDED
            </button>
          ) : (
            /* ACTIVE — green glowing JOIN */
            <button
              type="button"
              onClick={() => {
                if (!isJoinAnimating) {
                  setIsJoinAnimating(true);
                  setTimeout(() => setIsJoinAnimating(false), 820);
                }
                handleJoin();
              }}
              disabled={joinMutation.isPending}
              className="w-full h-12 rounded-xl font-display font-black text-base tracking-[0.2em] uppercase transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2"
              style={{
                position: "relative",
                zIndex: 1,
                background: joinMutation.isPending
                  ? "oklch(0.45 0.15 145)"
                  : "linear-gradient(135deg, oklch(0.60 0.22 145), oklch(0.52 0.20 150))",
                color: "#ffffff",
                animation: !joinMutation.isPending ? "joinGlowPulse 2.4s ease-in-out infinite" : undefined,
                border: "1px solid oklch(0.68 0.22 145 / 0.5)",
              }}
            >
              {joinMutation.isPending ? (
                <>
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                    style={{ borderColor: "#ffffff", borderTopColor: "transparent" }}
                  />
                  JOINING...
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 shrink-0" />
                  JOIN
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3">
        {(["details", "leaderboard"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-display font-semibold tracking-wider uppercase transition-all duration-200 ${
              activeTab === tab ? "tab-active" : "tab-inactive"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "details" ? (
        <DetailsTab
          tournamentId={tournament.id}
          status={tournament.status}
          entryFee={tournament.entryFee}
          totalSlots={tournament.totalSlots}
          rules={tournament.rules}
          prizeDistribution={tournament.prizeDistribution}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          joinMutation={joinMutation}
          hasEnoughBalance={hasEnoughBalance}
          isLoggedIn={isLoggedIn}
        />
      ) : (
        <LeaderboardTab tournamentId={tournament.id} />
      )}
    </div>
  );
}
