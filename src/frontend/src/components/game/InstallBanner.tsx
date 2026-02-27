import { useState, useEffect, useRef } from "react";
import { Flame, X, Download, Share } from "lucide-react";

const DISMISSED_KEY = "ff_install_dismissed";

// Detect iOS
function isIOS(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad"))
  );
}

// BeforeInstallPromptEvent is not in standard lib types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [promptAvailable, setPromptAvailable] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const ios = isIOS();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setPromptAvailable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!promptRef.current) return;
    await promptRef.current.prompt();
    await promptRef.current.userChoice;
    setDismissed(true);
  };

  // Don't render if dismissed
  if (dismissed) return null;

  // iOS: show share instructions banner
  if (ios) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: "oklch(0.08 0.015 240)",
          borderBottom: "2px solid oklch(0.72 0.22 45 / 0.5)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "oklch(0.72 0.22 45 / 0.15)",
            border: "1px solid oklch(0.72 0.22 45 / 0.4)",
          }}
        >
          <Share className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-display font-bold text-xs tracking-wider leading-tight"
            style={{ color: "oklch(0.72 0.22 45)" }}
          >
            INSTALL FF ARENA
          </p>
          <p className="text-[10px] font-body text-muted-foreground leading-tight mt-0.5">
            Tap <strong className="text-foreground">Share</strong> →{" "}
            <strong className="text-foreground">"Add to Home Screen"</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{
            background: "oklch(0.18 0.02 240)",
            color: "oklch(0.5 0.01 240)",
          }}
          aria-label="Dismiss install banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Android / Desktop: show beforeinstallprompt banner only when event fired
  if (!promptAvailable) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: "oklch(0.08 0.015 240)",
        borderBottom: "2px solid oklch(0.72 0.22 45 / 0.5)",
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: "oklch(0.72 0.22 45 / 0.15)",
          border: "1px solid oklch(0.72 0.22 45 / 0.4)",
        }}
      >
        <Flame className="w-5 h-5" style={{ color: "oklch(0.72 0.22 45)" }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="font-display font-bold text-xs tracking-wider leading-tight"
          style={{ color: "oklch(0.72 0.22 45)" }}
        >
          DOWNLOAD FF ARENA APP
        </p>
        <p className="text-[10px] font-body text-muted-foreground leading-tight mt-0.5 truncate">
          Install on your phone for best experience
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display font-bold text-[11px] tracking-wider transition-all active:scale-95"
          style={{
            background: "oklch(0.52 0.18 145)",
            color: "oklch(0.98 0.01 100)",
            boxShadow: "0 0 10px oklch(0.52 0.18 145 / 0.4)",
          }}
        >
          <Download className="w-3 h-3" />
          INSTALL
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "oklch(0.18 0.02 240)",
            color: "oklch(0.5 0.01 240)",
          }}
          aria-label="Dismiss install banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
