import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useLocalAuth } from "../hooks/useLocalAuth";

type View = "signin" | "register" | "forgot";

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const inputStyle = {
  background: "oklch(0.09 0.01 240)",
  border: "1px solid oklch(0.22 0.02 240)",
  color: "oklch(0.95 0.005 80)",
};

const inputFocusClass =
  "h-11 font-body text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-[oklch(0.72_0.22_45/0.7)] focus-visible:ring-1 focus-visible:ring-[oklch(0.72_0.22_45/0.7)]";

export default function AuthPage() {
  const { actor } = useActor();
  const { setCurrentUser } = useLocalAuth();
  const [view, setView] = useState<View>("signin");

  // ── Next Legend ID (for Register form) ────────────────────────────────────
  const [nextLegendId, setNextLegendId] = useState<string | null>(null);
  const legendIdFetchedRef = useRef(false);

  useEffect(() => {
    if (!actor || legendIdFetchedRef.current) return;
    legendIdFetchedRef.current = true;
    actor
      .getNextLegendId()
      .then((id) => {
        const num = Number(id);
        setNextLegendId(`#${String(num).padStart(4, "0")}`);
      })
      .catch(() => {
        legendIdFetchedRef.current = false; // allow retry
      });
  }, [actor]);

  // Re-fetch when switching to register tab and actor just became available
  useEffect(() => {
    if (view !== "register" || !actor || nextLegendId) return;
    actor
      .getNextLegendId()
      .then((id) => {
        const num = Number(id);
        setNextLegendId(`#${String(num).padStart(4, "0")}`);
      })
      .catch(() => {});
  }, [view, actor, nextLegendId]);

  // ── Sign In ────────────────────────────────────────────────────────────────
  const [siLegendId, setSiLegendId] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [showSiPwd, setShowSiPwd] = useState(false);
  const [siLoading, setSiLoading] = useState(false);

  // ── Register ───────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [inGameName, setInGameName] = useState("");
  const [gameUID, setGameUID] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referCode, setReferCode] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const submittingRef = useRef(false);

  // ── Forgot Password ────────────────────────────────────────────────────────
  const [fpLegendId, setFpLegendId] = useState("");
  const [fpResetCode, setFpResetCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showFpPwd, setShowFpPwd] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number.parseInt(siLegendId.trim(), 10);
    if (!siLegendId.trim() || Number.isNaN(idNum) || idNum < 1) {
      toast.error("Please enter your Legend ID (e.g. 1 or 0001)");
      return;
    }
    if (!siPassword) {
      toast.error("Please enter your password");
      return;
    }
    if (!actor) {
      toast.error("Connecting to server, please try again in a moment.");
      return;
    }

    setSiLoading(true);
    try {
      const passwordHash = await hashPassword(siPassword);
      const result = await actor.loginByLegendId(BigInt(idNum), passwordHash);

      if (result.__kind__ === "err") {
        toast.error(result.err || "Invalid Legend ID or password");
        return;
      }

      const profile = result.ok;
      const user = {
        email: profile.email,
        legendId: Number(profile.legendId),
        fullName: profile.fullName,
        inGameName: profile.inGameName,
        gameUID: profile.gameUID,
        mobileNo: profile.mobileNo,
        referCode: profile.referCode,
      };

      setCurrentUser(user);
      toast.success(`Welcome back, ${profile.inGameName || profile.fullName}!`);
      // Force full page reload so app state refreshes immediately
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSiLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!inGameName.trim()) {
      toast.error("In-game name is required");
      return;
    }
    if (!mobileNo.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    if (!regPassword) {
      toast.error("Password is required");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (regPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!privacyAccepted) {
      toast.error("Please accept the Privacy Policy");
      return;
    }
    if (!actor) {
      toast.error("Server not connected. Please reload and try again.");
      return;
    }

    submittingRef.current = true;
    setRegLoading(true);

    // Use provided email or generate a placeholder
    const email = regEmail.trim()
      ? regEmail.trim().toLowerCase()
      : `legend_${Date.now()}@arena.local`;

    try {
      const passwordHash = await hashPassword(regPassword);

      const regResult = await actor.registerAccount(
        email,
        passwordHash,
        fullName.trim(),
        inGameName.trim(),
        gameUID.trim(),
        mobileNo.trim(),
        referCode.trim(),
      );

      if (regResult.__kind__ === "err") {
        const errMsg = regResult.err ?? "";
        if (errMsg.toLowerCase().includes("already")) {
          toast.error(
            "This email is already registered. Please sign in with your Legend ID.",
          );
        } else {
          toast.error(errMsg || "Registration failed");
        }
        return;
      }

      // Auto-login immediately after successful registration
      const profile = regResult.ok;
      const user = {
        email: profile.email,
        legendId: Number(profile.legendId),
        fullName: profile.fullName,
        inGameName: profile.inGameName,
        gameUID: profile.gameUID,
        mobileNo: profile.mobileNo,
        referCode: profile.referCode,
      };
      setCurrentUser(user);
      toast.success(
        `Welcome to Legend Arena, ${profile.inGameName || profile.fullName}! 🎮`,
      );
      // Force full page reload so app state refreshes immediately
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
      submittingRef.current = false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number.parseInt(fpLegendId.trim(), 10);
    if (!fpLegendId.trim() || Number.isNaN(idNum) || idNum < 1) {
      toast.error("Please enter your Legend ID");
      return;
    }
    if (!fpResetCode.trim()) {
      toast.error("Please enter the reset code from admin");
      return;
    }
    if (!fpNewPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (fpNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!actor) {
      toast.error("Connecting to server, please try again in a moment.");
      return;
    }

    setFpLoading(true);
    try {
      const newPasswordHash = await hashPassword(fpNewPassword);
      const result = await actor.resetPasswordByLegendId(
        BigInt(idNum),
        fpResetCode.trim(),
        newPasswordHash,
      );

      if (result.__kind__ === "err") {
        toast.error(result.err || "Reset failed");
        return;
      }

      toast.success("Password reset successfully! Please sign in.");
      setFpLegendId("");
      setFpResetCode("");
      setFpNewPassword("");
      setFpConfirmPassword("");
      setView("signin");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password",
      );
    } finally {
      setFpLoading(false);
    }
  };

  const tabBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-3 font-display text-sm font-bold tracking-wider uppercase transition-all"
      style={{
        color: active ? "oklch(0.72 0.22 45)" : "oklch(0.5 0.02 240)",
        borderBottom: active
          ? "2px solid oklch(0.72 0.22 45)"
          : "2px solid transparent",
        background: active ? "oklch(0.72 0.22 45 / 0.06)" : "transparent",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-dvh gradient-bg flex flex-col items-center justify-between p-5 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 diagonal-stripe opacity-40 pointer-events-none" />
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.22 45 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div />

      <div className="flex flex-col items-center gap-6 animate-slide-up w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
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
                className="w-14 h-14 object-contain"
              />
            </div>
            <div
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full animate-pulse"
              style={{ background: "oklch(0.72 0.22 45)" }}
            />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold neon-text-orange tracking-widest uppercase">
              LEGEND ARENA
            </h1>
            <p className="text-muted-foreground text-xs font-body mt-0.5 tracking-wider">
              FREE FIRE TOURNAMENT PLATFORM
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            {
              icon: Flame,
              label: "Hot Tournaments",
              color: "neon-text-orange",
            },
            {
              icon: Shield,
              label: "Secure Platform",
              color: "neon-text-green",
            },
            { icon: Zap, label: "Instant Prizes", color: "neon-text-gold" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="card-glass rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] text-muted-foreground font-body leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.13 0.02 240), oklch(0.11 0.015 260))",
            border: "1px solid oklch(0.25 0.02 240)",
          }}
        >
          {/* ── SIGN IN ─────────────────────────────────────────────────────── */}
          {view === "signin" && (
            <>
              <div
                className="flex"
                style={{ borderBottom: "1px solid oklch(0.2 0.02 240)" }}
              >
                {tabBtn("SIGN IN", true, () => setView("signin"))}
                {tabBtn("REGISTER", false, () => setView("register"))}
              </div>

              <div className="p-5">
                <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                  {/* Legend ID info box */}
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "oklch(0.72 0.22 45 / 0.06)",
                      border: "1px solid oklch(0.72 0.22 45 / 0.2)",
                    }}
                  >
                    <p className="text-[10px] font-body text-muted-foreground leading-relaxed text-center">
                      Sign in with your{" "}
                      <span className="neon-text-orange font-bold">
                        Legend ID
                      </span>{" "}
                      (e.g.{" "}
                      <span className="neon-text-gold font-bold">#0001</span>)
                      and password
                    </p>
                  </div>

                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-display font-bold pointer-events-none"
                      style={{ color: "oklch(0.72 0.22 45)" }}
                    >
                      #
                    </span>
                    <Input
                      type="number"
                      placeholder="Legend ID (e.g. 1)"
                      value={siLegendId}
                      onChange={(e) => setSiLegendId(e.target.value)}
                      className={`${inputFocusClass} pl-7`}
                      style={inputStyle}
                      min={1}
                      autoComplete="username"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      type={showSiPwd ? "text" : "password"}
                      placeholder="Password"
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      className={`${inputFocusClass} pr-10`}
                      style={inputStyle}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSiPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showSiPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={siLoading || !actor}
                    className="w-full h-11 font-display text-sm font-bold tracking-wider uppercase btn-glow mt-1"
                    style={{
                      background:
                        siLoading || !actor
                          ? "oklch(0.45 0.1 45)"
                          : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                      color: "oklch(0.08 0.01 240)",
                      border: "none",
                    }}
                  >
                    {siLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SIGNING IN...
                      </span>
                    ) : !actor ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        CONNECTING...
                      </span>
                    ) : (
                      "🔐 SIGN IN"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-xs font-body font-bold text-center transition-colors mt-1"
                    style={{ color: "oklch(0.6 0.1 240)" }}
                  >
                    Forgot Password?
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── REGISTER ────────────────────────────────────────────────────── */}
          {view === "register" && (
            <>
              <div
                className="flex"
                style={{ borderBottom: "1px solid oklch(0.2 0.02 240)" }}
              >
                {tabBtn("SIGN IN", false, () => setView("signin"))}
                {tabBtn("REGISTER", true, () => setView("register"))}
              </div>

              <div className="p-5">
                <form
                  onSubmit={handleRegister}
                  className="flex flex-col gap-2.5"
                >
                  {/* Legend ID Preview Card */}
                  <div
                    className="rounded-2xl p-4 text-center relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.18 0.06 55), oklch(0.14 0.04 45))",
                      border: "1px solid oklch(0.72 0.22 45 / 0.5)",
                      boxShadow:
                        "0 0 24px oklch(0.72 0.22 45 / 0.15), inset 0 1px 0 oklch(0.72 0.22 45 / 0.2)",
                    }}
                  >
                    {/* Shine overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.22 45 / 0.05) 0%, transparent 60%)",
                      }}
                    />
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Sparkles
                        className="w-3 h-3"
                        style={{ color: "oklch(0.72 0.22 45)" }}
                      />
                      <span
                        className="text-[10px] font-body uppercase tracking-[0.15em]"
                        style={{ color: "oklch(0.72 0.22 45 / 0.8)" }}
                      >
                        Your Legend ID
                      </span>
                      <Sparkles
                        className="w-3 h-3"
                        style={{ color: "oklch(0.72 0.22 45)" }}
                      />
                    </div>
                    {nextLegendId ? (
                      <p
                        className="font-display font-bold text-4xl tracking-wider"
                        style={{
                          color: "oklch(0.85 0.22 55)",
                          textShadow:
                            "0 0 20px oklch(0.72 0.22 45 / 0.6), 0 0 40px oklch(0.72 0.22 45 / 0.3)",
                        }}
                      >
                        {nextLegendId}
                      </p>
                    ) : (
                      <div className="flex items-center justify-center gap-2 h-10">
                        <Loader2
                          className="w-5 h-5 animate-spin"
                          style={{ color: "oklch(0.72 0.22 45)" }}
                        />
                        <span
                          className="font-display text-sm"
                          style={{ color: "oklch(0.72 0.22 45 / 0.6)" }}
                        >
                          Loading...
                        </span>
                      </div>
                    )}
                    <p
                      className="text-[10px] font-body mt-1"
                      style={{ color: "oklch(0.6 0.05 55)" }}
                    >
                      This ID will be assigned to your account
                    </p>
                  </div>

                  <Input
                    type="text"
                    placeholder="Full Name *"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                    autoComplete="name"
                  />
                  <Input
                    type="text"
                    placeholder="In-Game Name *"
                    value={inGameName}
                    onChange={(e) => setInGameName(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                  />
                  <Input
                    type="text"
                    placeholder="Game UID (Optional)"
                    value={gameUID}
                    onChange={(e) => setGameUID(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                  />
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-body pointer-events-none"
                      style={{ color: "oklch(0.72 0.22 45)" }}
                    >
                      +92
                    </span>
                    <Input
                      type="tel"
                      placeholder="Mobile No. *"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      className={`${inputFocusClass} pl-11`}
                      style={inputStyle}
                      autoComplete="tel"
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address (Optional)"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                    autoComplete="email"
                  />
                  <div className="relative">
                    <Input
                      type={showRegPwd ? "text" : "password"}
                      placeholder="Password *"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={`${inputFocusClass} pr-10`}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showRegPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showConfirmPwd ? "text" : "password"}
                      placeholder="Confirm Password *"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputFocusClass} pr-10`}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="Refer Code (Optional)"
                    value={referCode}
                    onChange={(e) => setReferCode(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                  />

                  <div className="flex items-start gap-2.5 mt-1">
                    <Checkbox
                      id="privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(v) => setPrivacyAccepted(!!v)}
                      className="mt-0.5 border-muted-foreground data-[state=checked]:bg-[oklch(0.72_0.22_45)] data-[state=checked]:border-[oklch(0.72_0.22_45)]"
                    />
                    <label
                      htmlFor="privacy"
                      className="text-xs font-body text-muted-foreground leading-snug cursor-pointer"
                    >
                      I agree to the{" "}
                      <span className="neon-text-orange font-bold">
                        Privacy Policy
                      </span>{" "}
                      and{" "}
                      <span className="neon-text-orange font-bold">
                        Terms of Service
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={regLoading || !actor}
                    className="w-full h-11 font-display text-sm font-bold tracking-wider uppercase btn-glow mt-1"
                    style={{
                      background:
                        regLoading || !actor
                          ? "oklch(0.45 0.1 45)"
                          : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                      color: "oklch(0.08 0.01 240)",
                      border: "none",
                    }}
                  >
                    {regLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        CREATING ACCOUNT...
                      </span>
                    ) : !actor ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        CONNECTING...
                      </span>
                    ) : (
                      "🎮 CREATE ACCOUNT"
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ──────────────────────────────────────────────── */}
          {view === "forgot" && (
            <>
              <div
                className="px-5 py-4 flex items-center gap-2"
                style={{
                  borderBottom: "1px solid oklch(0.2 0.02 240)",
                  background: "oklch(0.72 0.22 45 / 0.06)",
                }}
              >
                <KeyRound
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.22 45)" }}
                />
                <span
                  className="font-display font-bold text-sm tracking-wider"
                  style={{ color: "oklch(0.72 0.22 45)" }}
                >
                  RESET PASSWORD
                </span>
              </div>
              <div className="p-5">
                <form
                  onSubmit={handleForgotPassword}
                  className="flex flex-col gap-3"
                >
                  <p className="text-xs font-body text-muted-foreground leading-relaxed">
                    Contact admin to get your reset code, then enter your Legend
                    ID and new password.
                  </p>

                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-display font-bold pointer-events-none"
                      style={{ color: "oklch(0.72 0.22 45)" }}
                    >
                      #
                    </span>
                    <Input
                      type="number"
                      placeholder="Legend ID (e.g. 1)"
                      value={fpLegendId}
                      onChange={(e) => setFpLegendId(e.target.value)}
                      className={`${inputFocusClass} pl-7`}
                      style={inputStyle}
                      min={1}
                    />
                  </div>

                  <Input
                    type="text"
                    placeholder="Reset Code (from admin)"
                    value={fpResetCode}
                    onChange={(e) => setFpResetCode(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                  />

                  <div className="relative">
                    <Input
                      type={showFpPwd ? "text" : "password"}
                      placeholder="New Password"
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      className={`${inputFocusClass} pr-10`}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFpPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showFpPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={fpConfirmPassword}
                    onChange={(e) => setFpConfirmPassword(e.target.value)}
                    className={inputFocusClass}
                    style={inputStyle}
                  />

                  <Button
                    type="submit"
                    disabled={fpLoading || !actor}
                    className="w-full h-11 font-display text-sm font-bold tracking-wider uppercase btn-glow mt-1"
                    style={{
                      background:
                        fpLoading || !actor
                          ? "oklch(0.45 0.1 45)"
                          : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                      color: "oklch(0.08 0.01 240)",
                      border: "none",
                    }}
                  >
                    {fpLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        RESETTING...
                      </span>
                    ) : (
                      "RESET PASSWORD"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setView("signin")}
                    className="text-xs font-body text-center neon-text-orange font-bold"
                  >
                    Back to Sign In
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground text-xs font-body text-center mt-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
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
