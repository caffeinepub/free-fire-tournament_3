import { useState } from "react";
import { useRegisterUser } from "../../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  User,
  Gamepad2,
  Hash,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Gift,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

// ─── Field wrapper with icon ──────────────────────────────────────────────────
function FieldRow({
  icon: Icon,
  label,
  optional,
  children,
}: {
  icon: React.ElementType;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Label className="text-[11px] font-display font-bold text-muted-foreground tracking-wider uppercase">
          {label}
        </Label>
        {optional && (
          <span
            className="text-[9px] font-display px-1.5 py-0.5 rounded-full tracking-wider"
            style={{
              background: "oklch(0.72 0.22 45 / 0.12)",
              color: "oklch(0.72 0.22 45 / 0.7)",
              border: "1px solid oklch(0.72 0.22 45 / 0.25)",
            }}
          >
            OPTIONAL
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Input with leading icon ──────────────────────────────────────────────────
function IconInput({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
  prefix,
  rightSlot,
  maxLength,
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
  rightSlot?: React.ReactNode;
  maxLength?: number;
}) {
  return (
    <div
      className="flex items-center rounded-xl h-12 overflow-hidden relative"
      style={{
        background: "oklch(0.13 0.02 240)",
        border: "1px solid oklch(0.28 0.025 240)",
      }}
    >
      <div
        className="flex items-center justify-center w-11 h-full shrink-0"
        style={{ borderRight: "1px solid oklch(0.22 0.02 240)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
      </div>
      {prefix && (
        <span
          className="pl-3 pr-1 text-sm font-display font-bold shrink-0"
          style={{ color: "oklch(0.72 0.22 45)" }}
        >
          {prefix}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="flex-1 h-full bg-transparent px-3 text-sm font-body outline-none placeholder:text-muted-foreground/50"
        style={{ color: "oklch(0.95 0.005 80)" }}
      />
      {rightSlot && (
        <div className="flex items-center justify-center w-11 h-full shrink-0">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ─── Main Registration Form ───────────────────────────────────────────────────
export default function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const registerMutation = useRegisterUser();
  const { clear } = useInternetIdentity();

  const [fullName, setFullName] = useState("");
  const [inGameName, setInGameName] = useState("");
  const [gameUID, setGameUID] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referCode, setReferCode] = useState("");
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    if (!inGameName.trim()) { toast.error("In-Game name is required"); return; }
    if (!mobileNo.trim()) { toast.error("Mobile number is required"); return; }
    if (!email.trim()) { toast.error("Email address is required"); return; }
    if (!password) { toast.error("Password is required"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (!privacyChecked) { toast.error("Please accept the privacy policy"); return; }

    try {
      await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        inGameName: inGameName.trim(),
        gameUID: gameUID.trim(),
        mobileNo: mobileNo.trim(),
        email: email.trim(),
        referCode: referCode.trim(),
      });
      toast.success("Welcome to FF Arena!");
      onComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const handleGoBack = async () => {
    await clear();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "oklch(0.07 0.015 240)" }}
    >
      {/* Atmospheric background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, oklch(0.72 0.22 45 / 0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative min-h-full flex flex-col items-center py-8 px-4">
        {/* Logo & Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <img
            src="/assets/generated/ff-logo-transparent.dim_200x200.png"
            alt="FF Arena"
            className="w-20 h-20 object-contain"
            style={{ filter: "drop-shadow(0 0 16px oklch(0.72 0.22 45 / 0.6))" }}
          />
          <div className="text-center">
            <h1
              className="font-display font-black text-2xl tracking-widest"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.22 55), oklch(0.72 0.25 35))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              REGISTER
            </h1>
            <p className="text-xs font-body text-muted-foreground mt-0.5">
              Please sign up to continue
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: "oklch(0.11 0.02 240)",
            border: "1px solid oklch(0.22 0.025 240)",
            boxShadow: "0 0 40px oklch(0 0 0 / 0.4)",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Full Name */}
            <FieldRow icon={User} label="Full Name">
              <IconInput
                icon={User}
                placeholder="Your full name"
                value={fullName}
                onChange={setFullName}
                maxLength={60}
              />
            </FieldRow>

            {/* In-Game Name */}
            <FieldRow icon={Gamepad2} label="In-Game Name">
              <IconInput
                icon={Gamepad2}
                placeholder="Your battle name"
                value={inGameName}
                onChange={setInGameName}
                maxLength={30}
              />
            </FieldRow>

            {/* Game UID */}
            <FieldRow icon={Hash} label="Game UID" optional>
              <IconInput
                icon={Hash}
                placeholder="Free Fire UID"
                value={gameUID}
                onChange={setGameUID}
                maxLength={20}
              />
            </FieldRow>

            {/* Mobile */}
            <FieldRow icon={Phone} label="Mobile No.">
              <IconInput
                icon={Phone}
                placeholder="3XXXXXXXXX"
                value={mobileNo}
                onChange={setMobileNo}
                type="tel"
                prefix="+92"
                maxLength={10}
              />
            </FieldRow>

            {/* Email */}
            <FieldRow icon={Mail} label="Email Address">
              <IconInput
                icon={Mail}
                placeholder="your@email.com"
                value={email}
                onChange={setEmail}
                type="email"
                maxLength={80}
              />
            </FieldRow>

            {/* Password */}
            <FieldRow icon={Eye} label="Password">
              <IconInput
                icon={Eye}
                placeholder="Create a password"
                value={password}
                onChange={setPassword}
                type={showPassword ? "text" : "password"}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </FieldRow>

            {/* Confirm Password */}
            <FieldRow icon={Eye} label="Confirm Password">
              <div>
                <IconInput
                  icon={Eye}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type={showConfirmPassword ? "text" : "password"}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                {passwordMismatch && (
                  <p
                    className="text-[10px] font-body mt-1.5 pl-1"
                    style={{ color: "oklch(0.68 0.25 25)" }}
                  >
                    Passwords do not match
                  </p>
                )}
              </div>
            </FieldRow>

            {/* Refer Code */}
            <FieldRow icon={Gift} label="Refer Code" optional>
              <IconInput
                icon={Gift}
                placeholder="Referral code"
                value={referCode}
                onChange={setReferCode}
                maxLength={20}
              />
            </FieldRow>

            {/* Privacy policy checkbox */}
            <div className="flex items-start gap-3 py-1">
              <Checkbox
                id="privacy"
                checked={privacyChecked}
                onCheckedChange={(v) => setPrivacyChecked(!!v)}
                className="mt-0.5 shrink-0"
                style={
                  privacyChecked
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
                        borderColor: "oklch(0.72 0.22 45)",
                      }
                    : {
                        borderColor: "oklch(0.35 0.025 240)",
                        background: "oklch(0.13 0.02 240)",
                      }
                }
              />
              <label
                htmlFor="privacy"
                className="text-[11px] font-body leading-relaxed cursor-pointer select-none"
                style={{ color: "oklch(0.65 0.02 240)" }}
              >
                I am agree with{" "}
                <span
                  className="font-bold"
                  style={{ color: "oklch(0.72 0.22 45)" }}
                >
                  privacy policies
                </span>
              </label>
            </div>

            {/* Sign Up button */}
            <Button
              type="submit"
              disabled={registerMutation.isPending || !privacyChecked}
              className="w-full h-12 font-display font-black text-base tracking-widest uppercase mt-1 rounded-xl"
              style={{
                background:
                  !privacyChecked
                    ? "oklch(0.25 0.02 240)"
                    : "linear-gradient(135deg, oklch(0.62 0.25 25), oklch(0.72 0.22 45))",
                color: !privacyChecked
                  ? "oklch(0.45 0.02 240)"
                  : "oklch(0.97 0.005 80)",
                border: "none",
                boxShadow: privacyChecked
                  ? "0 4px 20px oklch(0.65 0.25 25 / 0.35)"
                  : "none",
                transition: "all 0.2s ease",
              }}
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SIGNING UP...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.22 0.02 240)" }}
            />
            <span
              className="text-[10px] font-display font-bold tracking-widest"
              style={{ color: "oklch(0.4 0.02 240)" }}
            >
              OR
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.22 0.02 240)" }}
            />
          </div>

          {/* Already have account */}
          <button
            type="button"
            onClick={handleGoBack}
            className="text-center text-xs font-body w-full py-1 transition-colors"
            style={{ color: "oklch(0.55 0.02 240)" }}
          >
            Already have an Account?{" "}
            <span
              className="font-bold"
              style={{ color: "oklch(0.72 0.22 45)" }}
            >
              Sign In
            </span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground font-body mt-6">
          © 2026. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.72 0.22 45)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
