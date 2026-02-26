import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetTransactionHistory,
  useSetUsername,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { Variant_deposit_withdrawal_tournamentEntry as TxnType } from "../backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  Edit2,
  Check,
  X,
  Trophy,
  Shield,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: transactions } = useGetTransactionHistory();
  const { data: isAdmin } = useIsCallerAdmin();
  const setUsernameMutation = useSetUsername();

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const initials = (userProfile?.username ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tournamentEntries = transactions?.filter(
    (tx) => tx.txnType === TxnType.tournamentEntry
  ) ?? [];

  const handleSignOut = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const handleStartEdit = () => {
    setUsernameInput(userProfile?.username ?? "");
    setEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    try {
      await setUsernameMutation.mutateAsync(usernameInput.trim());
      toast.success("Username updated!");
      setEditingUsername(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update username");
    }
  };

  const handleCancelEdit = () => {
    setEditingUsername(false);
    setUsernameInput("");
  };

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 8)}...${principal.slice(-6)}`
    : "";

  return (
    <div className="flex flex-col gap-4 p-4 animate-fade-in">
      {/* Profile card */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.13 0.025 240), oklch(0.1 0.015 260))",
          border: "1px solid oklch(0.25 0.02 240)",
        }}
      >
        <div className="absolute inset-0 diagonal-stripe opacity-20 pointer-events-none" />

        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-2xl relative"
          style={{
            background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
            boxShadow: "0 0 20px oklch(0.72 0.22 45 / 0.3)",
          }}
        >
          <span style={{ color: "oklch(0.08 0.01 240)" }}>{initials}</span>
          {isAdmin && (
            <div
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.82 0.18 85)",
                boxShadow: "0 0 8px oklch(0.82 0.18 85 / 0.5)",
              }}
            >
              <Shield className="w-3 h-3" style={{ color: "oklch(0.08 0.01 240)" }} />
            </div>
          )}
        </div>

        {/* Username */}
        {profileLoading ? (
          <Skeleton className="h-7 w-32 bg-muted/50 rounded" />
        ) : editingUsername ? (
          <div className="flex items-center gap-2">
            <Input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="h-8 text-center font-display font-bold text-lg w-36"
              style={{
                background: "oklch(0.16 0.02 240)",
                border: "1px solid oklch(0.72 0.22 45 / 0.5)",
                color: "oklch(0.95 0.005 80)",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveUsername();
                if (e.key === "Escape") handleCancelEdit();
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveUsername}
              disabled={setUsernameMutation.isPending}
              className="w-7 h-7 rounded-lg flex items-center justify-center neon-text-green"
              style={{ background: "oklch(0.72 0.22 145 / 0.2)" }}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center neon-text-red"
              style={{ background: "oklch(0.65 0.25 25 / 0.2)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-foreground">
              {userProfile?.username || "Unknown Player"}
            </span>
            <button
              type="button"
              onClick={handleStartEdit}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Role badge */}
        {isAdmin && (
          <span
            className="text-[10px] font-display font-bold px-3 py-1 rounded-full tracking-widest"
            style={{
              background: "oklch(0.82 0.18 85 / 0.15)",
              color: "oklch(0.82 0.18 85)",
              border: "1px solid oklch(0.82 0.18 85 / 0.4)",
            }}
          >
            ADMINISTRATOR
          </span>
        )}

        {/* Principal */}
        <p className="text-[10px] font-mono-game text-muted-foreground/60">{shortPrincipal}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          <div
            className="flex flex-col items-center gap-1 p-3 rounded-xl"
            style={{ background: "oklch(0.09 0.01 240)" }}
          >
            <span className="neon-text-gold font-display font-bold text-xl">
              {(userProfile?.balance ?? 0n).toString()}
            </span>
            <span className="text-[10px] font-body text-muted-foreground">COINS</span>
          </div>
          <div
            className="flex flex-col items-center gap-1 p-3 rounded-xl"
            style={{ background: "oklch(0.09 0.01 240)" }}
          >
            <span className="neon-text-orange font-display font-bold text-xl">
              {tournamentEntries.length}
            </span>
            <span className="text-[10px] font-body text-muted-foreground">TOURNAMENTS</span>
          </div>
        </div>
      </div>

      {/* Tournaments joined */}
      {tournamentEntries.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid oklch(0.25 0.02 240)" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: "oklch(0.14 0.02 240)", borderBottom: "1px solid oklch(0.2 0.02 240)" }}
          >
            <Trophy className="w-4 h-4 neon-text-orange" />
            <span className="font-display font-bold text-sm tracking-wider">TOURNAMENTS JOINED</span>
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: "oklch(0.2 0.02 240)" }}>
            {tournamentEntries.map((tx) => (
              <div key={tx.id.toString()} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-display font-bold text-foreground">
                    Tournament Entry
                  </p>
                  <p className="text-[10px] font-mono-game text-muted-foreground">
                    {new Date(Number(tx.timestamp / 1_000_000n)).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="neon-text-red font-display font-bold text-sm">
                  -{tx.amount.toString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin panel link */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate({ to: "/admin" })}
          className="w-full rounded-xl p-4 flex items-center gap-3 card-glass card-glow-hover transition-colors text-left"
          style={{ border: "1px solid oklch(0.82 0.18 85 / 0.3)" }}
        >
          <Shield className="w-5 h-5" style={{ color: "oklch(0.82 0.18 85)" }} />
          <div className="flex-1">
            <p className="font-display font-bold text-sm" style={{ color: "oklch(0.82 0.18 85)" }}>
              ADMIN PANEL
            </p>
            <p className="text-xs font-body text-muted-foreground">
              Manage tournaments, categories, and users
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Sign out */}
      <Button
        type="button"
        variant="outline"
        onClick={handleSignOut}
        className="w-full h-12 font-display font-bold tracking-wider text-sm"
        style={{
          background: "oklch(0.65 0.25 25 / 0.1)",
          border: "1px solid oklch(0.65 0.25 25 / 0.4)",
          color: "oklch(0.65 0.25 25)",
        }}
      >
        <LogOut className="w-4 h-4 mr-2" />
        SIGN OUT
      </Button>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground font-body pb-2">
        © 2026. Built with ❤️ using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="neon-text-orange"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
