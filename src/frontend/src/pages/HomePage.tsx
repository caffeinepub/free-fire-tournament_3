import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Flame, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { TournamentStatus } from "../backend.d";
import { InstallBanner } from "../components/game/InstallBanner";
import { LCoinIcon } from "../components/game/LCoinIcon";
import { useGetCategories, useGetTournaments } from "../hooks/useQueries";

function StatusBadge({ status }: { status: TournamentStatus }) {
  const config = {
    [TournamentStatus.active]: {
      label: "LIVE",
      className: "bg-neon-green/20 text-neon-green border border-neon-green/40",
    },
    [TournamentStatus.upcoming]: {
      label: "UPCOMING",
      className: "bg-neon-blue/20 text-neon-blue border border-neon-blue/40",
    },
    [TournamentStatus.completed]: {
      label: "ENDED",
      className: "bg-muted/40 text-muted-foreground border border-border",
    },
  };
  const c = config[status];
  return (
    <span
      className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full tracking-widest ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function TournamentCardSkeleton({ idx }: { idx: number }) {
  return (
    <div key={idx} className="card-glass rounded-xl p-3 flex flex-col gap-2">
      <Skeleton className="h-4 w-3/4 bg-muted/50" />
      <Skeleton className="h-3 w-1/2 bg-muted/50" />
      <Skeleton className="h-8 w-full bg-muted/50" />
      <Skeleton className="h-2 w-full bg-muted/50" />
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading: tournamentsLoading } =
    useGetTournaments();
  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (categories) {
      for (const c of categories) {
        map[c.id.toString()] = c.name;
      }
    }
    return map;
  }, [categories]);

  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    if (activeCategory === "all") return tournaments;
    const cat = categories?.find(
      (c) => c.name.toLowerCase() === activeCategory.toLowerCase(),
    );
    if (!cat) return tournaments;
    return tournaments.filter((t) => t.categoryId === cat.id);
  }, [tournaments, categories, activeCategory]);

  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", name: "ALL" }];
    if (categories) {
      for (const c of categories) {
        tabs.push({ id: c.name.toLowerCase(), name: c.name.toUpperCase() });
      }
    }
    return tabs;
  }, [categories]);

  const handleTournamentClick = (id: bigint) => {
    navigate({ to: "/match/$id", params: { id: id.toString() } });
  };

  return (
    <div className="flex flex-col h-full">
      <InstallBanner />
      {/* Category tabs */}
      <div
        className="sticky top-0 z-10 px-3 py-3"
        style={{ background: "oklch(0.08 0.01 240)" }}
      >
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {categoriesLoading
            ? [0, 1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-8 w-16 rounded-full shrink-0 bg-muted/50"
                />
              ))
            : categoryTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-display font-semibold tracking-wider transition-all duration-200 ${
                    activeCategory === tab.id ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
        </div>
      </div>

      {/* Tournament grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {tournamentsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TournamentCardSkeleton key={i} idx={i} />
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <Flame className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-body">
              No tournaments found
            </p>
            <p className="text-xs text-muted-foreground/60">
              Check back soon for upcoming events
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {filteredTournaments.map((tournament) => {
              const slotPercent =
                tournament.totalSlots > 0n
                  ? Number(
                      (tournament.slotsFilled * 100n) / tournament.totalSlots,
                    )
                  : 0;
              const catName =
                categoryMap[tournament.categoryId.toString()] || "Tournament";

              return (
                <button
                  type="button"
                  key={tournament.id.toString()}
                  className="card-glass card-glow-hover rounded-xl p-3 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform duration-100 text-left w-full"
                  onClick={() => handleTournamentClick(tournament.id)}
                >
                  {tournament.imageUrl && (
                    <div
                      className="w-full rounded-lg overflow-hidden"
                      style={{ height: "90px" }}
                    >
                      <img
                        src={tournament.imageUrl}
                        alt={tournament.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  {/* Header */}
                  <div className="flex items-start justify-between gap-1">
                    <StatusBadge status={tournament.status} />
                    <span
                      className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded tracking-wider"
                      style={{
                        background: "oklch(0.72 0.22 45 / 0.1)",
                        color: "oklch(0.72 0.22 45)",
                        border: "1px solid oklch(0.72 0.22 45 / 0.3)",
                      }}
                    >
                      {catName.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-sm leading-tight text-foreground line-clamp-2">
                    {tournament.title}
                  </h3>

                  {/* Entry fee */}
                  <div className="flex items-center gap-1">
                    <LCoinIcon size={16} />
                    <span className="text-xs font-body text-muted-foreground">
                      Entry:
                    </span>
                    <span className="text-xs font-display font-bold neon-text-orange">
                      {tournament.entryFee.toString()}
                    </span>
                  </div>

                  {/* Prize pool */}
                  <div className="flex items-center gap-1">
                    <Trophy
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "oklch(0.82 0.18 85)" }}
                    />
                    <span className="text-xs font-body text-muted-foreground">
                      Prize:
                    </span>
                    <span
                      className="text-xs font-display font-bold"
                      style={{ color: "oklch(0.82 0.18 85)" }}
                    >
                      {tournament.prizePool.toString()}
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-body text-muted-foreground">
                          {tournament.slotsFilled.toString()}/
                          {tournament.totalSlots.toString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-game text-muted-foreground">
                        {slotPercent}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "oklch(0.2 0.02 240)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${slotPercent}%`,
                          background:
                            slotPercent >= 90
                              ? "oklch(0.65 0.25 25)"
                              : slotPercent >= 60
                                ? "oklch(0.72 0.22 45)"
                                : "oklch(0.72 0.22 145)",
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
