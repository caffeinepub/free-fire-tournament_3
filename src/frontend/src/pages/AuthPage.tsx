import { useState, useEffect, useRef } from "react";
import { useLocalAuth } from "../hooks/useLocalAuth";
import { useActor } from "../hooks/useActor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Shield, Zap, Eye, EyeOff, Loader2, KeyRound, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Tab = "login" | "register" | "forgot";

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AuthPage() {
  const { login, register } = useLocalAuth();
  const { actor, isFetching: actorLoading } = useActor();
  const [tab, setTab] = useState<Tab>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [actorWaitSeconds, setActorWaitSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard against double-submission (race condition on slow connections)
  const submittingRef = useRef(false);

  // Track how long we've been waiting for actor
  useEffect(() => {
    if (!actor && !isLoading) {
      timerRef.current = setInterval(() => {
        setActorWaitSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setActorWaitSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [actor, isLoading]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register fields
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

  // Forgot Password fields
  const [fpEmail, setFpEmail] = useState("");
  const [fpResetCode, setFpResetCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showFpPwd, setShowFpPwd] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!loginEmail.trim()) { toast.error("Please enter your email"); return; }
    if (!loginPassword) { toast.error("Please enter your password"); return; }

    if (!actor) {
      toast.error("Server not connected yet. Please wait a moment and try again.", { duration: 4000 });
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    if (!inGameName.trim()) { toast.error("In-game name is required"); return; }
    if (!mobileNo.trim()) { toast.error("Mobile number is required"); return; }
    if (!regEmail.trim()) { toast.error("Email is required"); return; }
    if (!regPassword) { toast.error("Password is required"); return; }
    if (regPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (regPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (!privacyAccepted) { toast.error("Please accept the Privacy Policy"); return; }

    if (!actor) {
      toast.error("Server not connected yet. Please wait a moment and try again.", { duration: 4000 });
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    const emailUsed = regEmail.trim().toLowerCase();
    try {
      await register({
        email: emailUsed,
        fullName: fullName.trim(),
        inGameName: inGameName.trim(),
        gameUID: gameUID.trim(),
        mobileNo: mobileNo.trim(),
        referCode: referCode.trim(),
        password: regPassword,
      });
      // Success — switch to login tab with email pre-filled
      toast.success("Account created! Please sign in.");
      setLoginEmail(emailUsed);
      setTab("login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      const isAlreadyExists =
        msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exist");
      if (isAlreadyExists) {
        toast.error("This email is already registered. Please sign in instead.");
        setLoginEmail(emailUsed);
        setTab("login");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail.trim()) { toast.error("Please enter your email"); return; }
    if (!fpResetCode.trim()) { toast.error("Please enter the reset code"); return; }
    if (!fpNewPassword) { toast.error("Please enter a new password"); return; }
    if (fpNewPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (fpNewPassword !== fpConfirmPassword) { toast.error("Passwords do not match"); return; }

    if (!actor) {
      toast.error("Connecting to server, please try again in a moment.");
      return;
    }

    setIsLoading(true);
    try {
      const newPasswordHash = await hashPassword(fpNewPassword);
      const result = await actor.resetPassword(
        fpEmail.trim().toLowerCase(),
        fpResetCode.trim(),
        newPasswordHash
      );

      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }

      toast.success("Password reset successfully! Please sign in.");
      setFpEmail("");
      setFpResetCode("");
      setFpNewPassword("");
      setFpConfirmPassword("");
      setTab("login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    background: "oklch(0.09 0.01 240)",
    border: "1px solid oklch(0.22 0.02 240)",
    color: "oklch(0.95 0.005 80)",
  };

  const inputFocusClass =
    "h-11 font-body text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-[oklch(0.72_0.22_45/0.7)] focus-visible:ring-1 focus-visible:ring-[oklch(0.72_0.22_45/0.7)]";

  return (
    <div className="min-h-dvh gradient-bg flex flex-col items-center justify-between p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 diagonal-stripe opacity-40 pointer-events-none" />
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.22 45 / 0.08) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.58 0.25 25 / 0.08) 0%, transparent 70%)" }}
      />

      {/* Top spacer */}
      <div />

      {/* Main content */}
      <div className="flex flex-col items-center gap-6 animate-slide-up w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, oklch(0.15 0.03 45), oklch(0.12 0.015 240))",
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
              FF ARENA
            </h1>
            <p className="text-muted-foreground text-xs font-body mt-0.5 tracking-wider">
              TOURNAMENT PLATFORM
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            { icon: Flame, label: "Hot Tournaments", color: "neon-text-orange" },
            { icon: Shield, label: "Secure Platform", color: "neon-text-green" },
            { icon: Zap, label: "Instant Prizes", color: "neon-text-gold" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="card-glass rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] text-muted-foreground font-body leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Server connection banner */}
        {!actor && (
          <div
            className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: actorWaitSeconds > 5
                ? "oklch(0.58 0.25 25 / 0.15)"
                : "oklch(0.72 0.22 45 / 0.1)",
              border: `1px solid ${actorWaitSeconds > 5 ? "oklch(0.58 0.25 25 / 0.4)" : "oklch(0.72 0.22 45 / 0.3)"}`,
            }}
          >
            {actorLoading || actorWaitSeconds <= 5 ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "oklch(0.72 0.22 45)" }} />
            ) : (
              <WifiOff className="w-4 h-4 shrink-0" style={{ color: "oklch(0.58 0.25 25)" }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body" style={{ color: actorWaitSeconds > 5 ? "oklch(0.75 0.15 35)" : "oklch(0.85 0.05 80)" }}>
                {actorWaitSeconds > 5
                  ? "Server taking longer than usual..."
                  : "Connecting to server..."}
              </p>
              {actorWaitSeconds > 5 && (
                <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                  Please wait or reload the page
                </p>
              )}
            </div>
            {actorWaitSeconds > 8 && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 text-xs font-bold shrink-0 transition-opacity hover:opacity-80"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                <RefreshCw className="w-3 h-3" />
                RELOAD
              </button>
            )}
          </div>
        )}

        {/* Auth card */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, oklch(0.13 0.02 240), oklch(0.11 0.015 260))",
            border: "1px solid oklch(0.25 0.02 240)",
          }}
        >
          {/* Tab bar — only show login/register tabs; forgot is accessed via link */}
          {tab !== "forgot" && (
            <div
              className="grid grid-cols-2"
              style={{ borderBottom: "1px solid oklch(0.2 0.02 240)" }}
            >
              {(["login", "register"] as ("login" | "register")[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="py-3 font-display font-bold text-sm tracking-wider uppercase transition-all"
                  style={{
                    background: tab === t ? "oklch(0.72 0.22 45 / 0.12)" : "transparent",
                    color: tab === t ? "oklch(0.72 0.22 45)" : "oklch(0.55 0.02 240)",
                    borderBottom: tab === t ? "2px solid oklch(0.72 0.22 45)" : "2px solid transparent",
                  }}
                >
                  {t === "login" ? "SIGN IN" : "REGISTER"}
                </button>
              ))}
            </div>
          )}

          {/* Forgot Password header */}
          {tab === "forgot" && (
            <div
              className="px-5 py-4 flex items-center gap-2"
              style={{ borderBottom: "1px solid oklch(0.2 0.02 240)", background: "oklch(0.72 0.22 45 / 0.06)" }}
            >
              <KeyRound className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
              <span className="font-display font-bold text-sm tracking-wider" style={{ color: "oklch(0.72 0.22 45)" }}>
                RESET PASSWORD
              </span>
            </div>
          )}

          <div className="p-5">
            {tab === "login" ? (
              /* ─── LOGIN FORM ─── */
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputFocusClass}
                  style={inputStyle}
                  autoComplete="email"
                />
                <div className="relative">
                  <Input
                    type={showLoginPwd ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputFocusClass} pr-10`}
                    style={inputStyle}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !actor}
                  className="w-full h-11 font-display text-sm font-bold tracking-wider uppercase btn-glow mt-1"
                  style={{
                    background: (isLoading || !actor)
                      ? "oklch(0.45 0.1 45)"
                      : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                    color: "oklch(0.08 0.01 240)",
                    border: "none",
                  }}
                >
                  {isLoading ? (
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
                    "SIGN IN"
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-body">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("register")}
                      className="neon-text-orange font-bold"
                    >
                      Register
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("forgot")}
                    className="text-xs font-body font-bold transition-colors"
                    style={{ color: "oklch(0.6 0.1 240)" }}
                  >
                    Forgot?
                  </button>
                </div>
              </form>
            ) : tab === "register" ? (
              /* ─── REGISTER FORM ─── */
              <form onSubmit={handleRegister} className="flex flex-col gap-2.5">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputFocusClass}
                  style={inputStyle}
                  autoComplete="name"
                />
                <Input
                  type="text"
                  placeholder="In-Game Name"
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
                    placeholder="Mobile No."
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className={`${inputFocusClass} pl-11`}
                    style={inputStyle}
                    autoComplete="tel"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={inputFocusClass}
                  style={inputStyle}
                  autoComplete="email"
                />
                <div className="relative">
                  <Input
                    type={showRegPwd ? "text" : "password"}
                    placeholder="Password"
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
                    {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPwd ? "text" : "password"}
                    placeholder="Confirm Password"
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
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                {/* Privacy policy */}
                <div className="flex items-start gap-2.5 mt-1">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(v) => setPrivacyAccepted(!!v)}
                    className="mt-0.5 border-muted-foreground data-[state=checked]:bg-[oklch(0.72_0.22_45)] data-[state=checked]:border-[oklch(0.72_0.22_45)]"
                  />
                  <label htmlFor="privacy" className="text-xs font-body text-muted-foreground leading-snug cursor-pointer">
                    I agree to the{" "}
                    <span className="neon-text-orange font-bold">Privacy Policy</span>{" "}
                    and{" "}
                    <span className="neon-text-orange font-bold">Terms of Service</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !actor}
                  className="w-full h-11 font-display text-sm font-bold tracking-wider uppercase btn-glow mt-1"
                  style={{
                    background: (isLoading || !actor)
                      ? "oklch(0.45 0.1 45)"
                      : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                    color: "oklch(0.08 0.01 240)",
                    border: "none",
                  }}
                >
                  {isLoading ? (
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
                    "SIGN UP"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground font-body">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="neon-text-orange font-bold"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            ) : (
              /* ─── FORGOT PASSWORD FORM ─── */
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                <p className="text-xs font-body text-muted-foreground leading-relaxed">
                  Contact admin to get your reset code, then enter it below to set a new password.
                </p>

                <Input
                  type="email"
                  placeholder="Email Address"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  className={inputFocusClass}
                  style={inputStyle}
                  autoComplete="email"
                />

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
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFpPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showFpPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={fpConfirmPassword}
                  onChange={(e) => setFpConfirmPassword(e.target.value)}
                  className={inputFocusClass}
                  style={inputStyle}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 font-display text-sm font-bold tracking-wider uppercase btn-glow mt-1"
                  style={{
                    background: isLoading
                      ? "oklch(0.45 0.1 45)"
                      : "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                    color: "oklch(0.08 0.01 240)",
                    border: "none",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      RESETTING...
                    </span>
                  ) : (
                    "RESET PASSWORD"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground font-body">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="neon-text-orange font-bold"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground text-xs font-body text-center mt-4">
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
