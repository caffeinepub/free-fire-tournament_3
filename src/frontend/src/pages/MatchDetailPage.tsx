import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
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
  Coins,
  Users,
  ChevronDown,
  ChevronUp,
  Medal,
} from "lucide-react";
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
}: {
  tournamentId: bigint;
  status: TournamentStatus;
  entryFee: bigint;
  totalSlots: bigint;
  rules: string;
  prizeDistribution: bigint[];
}) {
  const { identity } = useInternetIdentity();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<bigint | null>(null);
  const { data: takenSlots, isLoading: slotsLoading } = useGetTakenSlots(tournamentId);
  const { data: userProfile } = useGetCallerUserProfile();
  const joinMutation = useJoinTournament();

  const isActive = status === TournamentStatus.active;
  const isLoggedIn = !!identity;
  const canJoin = isActive && isLoggedIn;
  const hasEnoughBalance = userProfile ? userProfile.balance >= entryFee : false;

  const mySlot = null; // Would need per-user slot tracking from backend

  const handleJoin = async () => {
    if (!selectedSlot) {
      toast.error("Select a slot first!");
      return;
    }
    if (!hasEnoughBalance) {
      toast.error("Insufficient balance to join");
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

  const rankColors = [
    "oklch(0.82 0.18 85)",
    "oklch(0.75 0.04 240)",
    "oklch(0.6 0.12 55)",
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Join section */}
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

          <Button
            onClick={handleJoin}
            disabled={!selectedSlot || joinMutation.isPending || !hasEnoughBalance}
            className="w-full h-12 font-display font-bold text-base tracking-wider uppercase btn-glow"
            style={{
              background:
                !selectedSlot || !hasEnoughBalance
                  ? "oklch(0.3 0.02 240)"
                  : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: !selectedSlot || !hasEnoughBalance ? "oklch(0.5 0.02 240)" : "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {joinMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "oklch(0.08 0.01 240)", borderTopColor: "transparent" }} />
                JOINING...
              </span>
            ) : !hasEnoughBalance ? (
              "INSUFFICIENT BALANCE"
            ) : !selectedSlot ? (
              "SELECT A SLOT TO JOIN"
            ) : (
              `JOIN FOR ${entryFee.toString()} COINS`
            )}
          </Button>
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
                    <Coins className="w-3.5 h-3.5" style={{ color: "oklch(0.82 0.18 85)" }} />
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

  const tournamentId = BigInt(id);
  const { data: tournament, isLoading } = useGetTournament(tournamentId);
  const { data: categories } = useGetCategories();

  const categoryName = categories?.find(
    (c) => c.id === tournament?.categoryId
  )?.name ?? "";

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
            <Coins className="w-4 h-4 neon-text-orange" />
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
        />
      ) : (
        <LeaderboardTab tournamentId={tournament.id} />
      )}
    </div>
  );
}
