import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "@/components/ui/button";
import { Flame, Shield, Zap } from "lucide-react";

export default function AuthPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loading = isLoggingIn || loginStatus === "logging-in";

  return (
    <div className="min-h-dvh gradient-bg flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 diagonal-stripe opacity-40 pointer-events-none" />
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.22 45 / 0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.58 0.25 25 / 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Top spacer */}
      <div />

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 animate-slide-up w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.15 0.03 45), oklch(0.12 0.015 240))",
                border: "1px solid oklch(0.72 0.22 45 / 0.4)",
                boxShadow: "0 0 30px oklch(0.72 0.22 45 / 0.2)",
              }}
            >
              <img
                src="/assets/generated/ff-logo-transparent.dim_200x200.png"
                alt="FF Tournaments"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
              style={{ background: "oklch(0.72 0.22 45)" }}
            />
          </div>

          <div className="text-center">
            <h1
              className="font-display text-4xl font-bold neon-text-orange tracking-widest uppercase"
            >
              FF ARENA
            </h1>
            <p className="text-muted-foreground text-sm font-body mt-1 tracking-wider">
              TOURNAMENT PLATFORM
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { icon: Flame, label: "Hot Tournaments", color: "neon-text-orange" },
            { icon: Shield, label: "Secure Platform", color: "neon-text-green" },
            { icon: Zap, label: "Instant Prizes", color: "neon-text-gold" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="card-glass rounded-xl p-3 flex flex-col items-center gap-2 text-center"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs text-muted-foreground font-body leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Sign in card */}
        <div
          className="w-full rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.13 0.02 240), oklch(0.11 0.015 260))",
            border: "1px solid oklch(0.25 0.02 240)",
          }}
        >
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">
              JOIN THE BATTLE
            </h2>
            <p className="text-muted-foreground text-sm font-body mt-1">
              Sign in to compete in tournaments and win prizes
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 font-display text-base font-bold tracking-wider uppercase btn-glow"
            style={{
              background: loading
                ? "oklch(0.45 0.1 45)"
                : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "oklch(0.08 0.01 240)", borderTopColor: "transparent" }}
                />
                CONNECTING...
              </span>
            ) : (
              "SIGN IN WITH INTERNET IDENTITY"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground font-body">
            Secure authentication powered by{" "}
            <span className="neon-text-orange">Internet Computer</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground text-xs font-body text-center">
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
