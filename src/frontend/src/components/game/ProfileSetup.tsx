import { useState } from "react";
import { useSaveCallerUserProfile } from "../../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState("");
  const saveMutation = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Enter a username");
      return;
    }
    try {
      await saveMutation.mutateAsync({ username: username.trim(), balance: 0n });
      toast.success("Welcome to FF Arena!");
      onComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create profile");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 0.8)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 animate-slide-up"
        style={{
          background: "linear-gradient(135deg, oklch(0.13 0.025 45), oklch(0.1 0.015 240))",
          border: "1px solid oklch(0.72 0.22 45 / 0.4)",
          boxShadow: "0 0 40px oklch(0.72 0.22 45 / 0.15)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(0.72 0.22 45 / 0.15)", border: "1px solid oklch(0.72 0.22 45 / 0.4)" }}
          >
            <User className="w-8 h-8 neon-text-orange" />
          </div>
          <div className="text-center">
            <h2 className="font-display font-bold text-2xl text-foreground tracking-wider">
              CREATE PROFILE
            </h2>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Choose your battle name to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              YOUR BATTLE NAME
            </Label>
            <Input
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              autoFocus
              className="h-12 text-lg font-display font-bold text-center"
              style={{
                background: "oklch(0.16 0.02 240)",
                border: "1px solid oklch(0.72 0.22 45 / 0.3)",
                color: "oklch(0.95 0.005 80)",
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending || !username.trim()}
            className="w-full h-12 font-display font-bold text-base tracking-wider uppercase btn-glow"
            style={{
              background:
                !username.trim()
                  ? "oklch(0.3 0.02 240)"
                  : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: !username.trim() ? "oklch(0.5 0.02 240)" : "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "oklch(0.08 0.01 240)", borderTopColor: "transparent" }}
                />
                CREATING...
              </span>
            ) : (
              "ENTER THE ARENA"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
