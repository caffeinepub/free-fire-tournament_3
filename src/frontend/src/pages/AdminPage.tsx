import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useCreateCategory,
  useCreateTournament,
  usePostScores,
  useAssignCallerUserRole,
  useAddCoins,
  useGetCategories,
  useIsCallerAdmin,
  useGetPaymentNumbers,
  useSetPaymentNumbers,
  useGetPendingDepositRequests,
  useGetPendingWithdrawalRequests,
  useApproveDepositRequest,
  useRejectDepositRequest,
  useApproveWithdrawalRequest,
  useRejectWithdrawalRequest,
  useGetAllUsers,
  useGetResetCode,
  useSetResetCode,
  useAddCoinsByLegendId,
  useRemoveCoinsByLegendId,
  useGetUserByLegendId,
} from "../hooks/useQueries";
import { UserRole, Variant_easyPaisa_jazzCash } from "../backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Shield, Swords, Users, Star, CreditCard, ArrowDownLeft, ArrowUpRight, Clock, Mail, Phone, Gamepad2, Hash, KeyRound } from "lucide-react";
import { LCoinIcon } from "../components/game/LCoinIcon";

// Wrapper so LCoinIcon can be passed as a React component type to SectionCard
function LCoinSectionIcon({ className: _className }: { className?: string }) {
  return <LCoinIcon size={16} />;
}
import { toast } from "sonner";
import { Principal } from "@icp-sdk/core/principal";

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid oklch(0.25 0.02 240)" }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "oklch(0.14 0.02 240)", borderBottom: "1px solid oklch(0.2 0.02 240)" }}
      >
        <Icon className="w-4 h-4 neon-text-orange" />
        <span className="font-display font-bold text-sm tracking-wider">{title}</span>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function truncatePrincipal(principal: Principal): string {
  const str = principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-4)}`;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: categories } = useGetCategories();
  const { data: paymentNumbers } = useGetPaymentNumbers();
  const { data: pendingDeposits, isLoading: depositLoading } = useGetPendingDepositRequests();
  const { data: pendingWithdrawals, isLoading: withdrawalLoading } = useGetPendingWithdrawalRequests();
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsers();
  const { data: currentResetCode } = useGetResetCode();

  const createCategoryMutation = useCreateCategory();
  const createTournamentMutation = useCreateTournament();
  const postScoresMutation = usePostScores();
  const assignRoleMutation = useAssignCallerUserRole();
  const addCoinsMutation = useAddCoins();
  const setPaymentNumbersMutation = useSetPaymentNumbers();
  const setResetCodeMutation = useSetResetCode();
  const approveDepositMutation = useApproveDepositRequest();
  const rejectDepositMutation = useRejectDepositRequest();
  const approveWithdrawalMutation = useApproveWithdrawalRequest();
  const rejectWithdrawalMutation = useRejectWithdrawalRequest();
  const addCoinsByLegendIdMutation = useAddCoinsByLegendId();
  const removeCoinsByLegendIdMutation = useRemoveCoinsByLegendId();
  const getUserByLegendIdMutation = useGetUserByLegendId();

  // Payment Numbers
  const [pJazzCash, setPJazzCash] = useState("");

  // Reset Code
  const [newResetCode, setNewResetCode] = useState("");

  // Create Category
  const [catName, setCatName] = useState("");

  // Create Tournament
  const [tTitle, setTTitle] = useState("");
  const [tCategoryId, setTCategoryId] = useState("");
  const [tEntryFee, setTEntryFee] = useState("");
  const [tPrizePool, setTPrizePool] = useState("");
  const [tTotalSlots, setTTotalSlots] = useState("");
  const [tRules, setTRules] = useState("");
  const [tPrizeDist, setTPrizeDist] = useState("");
  const [tImageUrl, setTImageUrl] = useState("");

  // Post Scores
  const [sTournamentId, setSTournamentId] = useState("");
  const [sScores, setSScores] = useState("");

  // Assign Role
  const [rPrincipal, setRPrincipal] = useState("");
  const [rRole, setRRole] = useState<UserRole>(UserRole.user);

  // Add Coins (by Principal)
  const [cPrincipal, setCPrincipal] = useState("");
  const [cAmount, setCAmount] = useState("");

  // Manage by Legend ID
  const [legendIdInput, setLegendIdInput] = useState("");
  const [legendIdSearchResult, setLegendIdSearchResult] = useState<[import("@icp-sdk/core/principal").Principal, import("../backend.d").ExtendedUserProfile] | null>(null);
  const [legendIdNotFound, setLegendIdNotFound] = useState(false);
  const [legendIdCoinAmount, setLegendIdCoinAmount] = useState("");

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "oklch(0.72 0.22 45)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground font-body">Access denied</p>
        <Button type="button" onClick={() => navigate({ to: "/" })} className="font-display">
          Go Home
        </Button>
      </div>
    );
  }

  const handleCreateCategory = async () => {
    if (!catName.trim()) { toast.error("Enter a category name"); return; }
    try {
      await createCategoryMutation.mutateAsync(catName.trim());
      toast.success("Category created!");
      setCatName("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleQuickSetup = async () => {
    const defaultCategories = ["BR", "CS", "Lone Wolf"];
    const existingNames = (categories ?? []).map((c) => c.name.toLowerCase());
    const toCreate = defaultCategories.filter((name) => !existingNames.includes(name.toLowerCase()));
    if (toCreate.length === 0) {
      toast.info("BR, CS, and Lone Wolf already exist!");
      return;
    }
    try {
      for (const name of toCreate) {
        await createCategoryMutation.mutateAsync(name);
      }
      toast.success(`Added: ${toCreate.join(", ")}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    }
  };

  const handleCreateTournament = async () => {
    if (!tTitle || !tCategoryId || !tEntryFee || !tPrizePool || !tTotalSlots) {
      toast.error("Fill all required fields"); return;
    }
    try {
      const prizeDistArr = tPrizeDist
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => BigInt(s));

      await createTournamentMutation.mutateAsync({
        title: tTitle,
        categoryId: BigInt(tCategoryId),
        entryFee: BigInt(tEntryFee),
        prizePool: BigInt(tPrizePool),
        totalSlots: BigInt(tTotalSlots),
        rules: tRules,
        prizeDistribution: prizeDistArr,
        imageUrl: tImageUrl,
      });
      toast.success("Tournament created!");
      setTTitle(""); setTCategoryId(""); setTEntryFee(""); setTPrizePool("");
      setTTotalSlots(""); setTRules(""); setTPrizeDist(""); setTImageUrl("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handlePostScores = async () => {
    if (!sTournamentId || !sScores.trim()) { toast.error("Fill all fields"); return; }
    try {
      const lines = sScores.trim().split("\n").filter(Boolean);
      const scores: Array<[Principal, bigint]> = lines.map((line) => {
        const [p, s] = line.split(",").map((x) => x.trim());
        return [Principal.fromText(p), BigInt(s)];
      });
      await postScoresMutation.mutateAsync({ tournamentId: BigInt(sTournamentId), scores });
      toast.success("Scores posted!");
      setSTournamentId(""); setSScores("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed — check format: principal,score per line");
    }
  };

  const handleAssignRole = async () => {
    if (!rPrincipal.trim()) { toast.error("Enter a principal"); return; }
    try {
      await assignRoleMutation.mutateAsync({
        user: Principal.fromText(rPrincipal.trim()),
        role: rRole,
      });
      toast.success("Role assigned!");
      setRPrincipal("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleAddCoins = async () => {
    if (!cPrincipal.trim() || !cAmount) { toast.error("Fill all fields"); return; }
    try {
      await addCoinsMutation.mutateAsync({
        user: Principal.fromText(cPrincipal.trim()),
        amount: BigInt(cAmount),
      });
      toast.success(`Added ${cAmount} coins!`);
      setCPrincipal(""); setCAmount("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleLookupByLegendId = async () => {
    if (!legendIdInput.trim()) { toast.error("Enter a Legend ID"); return; }
    try {
      const result = await getUserByLegendIdMutation.mutateAsync(BigInt(legendIdInput.trim()));
      if (result) {
        setLegendIdSearchResult(result);
        setLegendIdNotFound(false);
      } else {
        setLegendIdSearchResult(null);
        setLegendIdNotFound(true);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lookup failed");
    }
  };

  const handleAddCoinsByLegendId = async () => {
    if (!legendIdInput.trim() || !legendIdCoinAmount) { toast.error("Enter Legend ID and amount"); return; }
    try {
      await addCoinsByLegendIdMutation.mutateAsync({
        legendId: BigInt(legendIdInput.trim()),
        amount: BigInt(legendIdCoinAmount),
      });
      toast.success(`Added ${legendIdCoinAmount} coins to #${legendIdInput.padStart(4, '0')}!`);
      setLegendIdCoinAmount("");
      // Refresh the lookup result
      const refreshed = await getUserByLegendIdMutation.mutateAsync(BigInt(legendIdInput.trim()));
      if (refreshed) setLegendIdSearchResult(refreshed);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add coins");
    }
  };

  const handleRemoveCoinsByLegendId = async () => {
    if (!legendIdInput.trim() || !legendIdCoinAmount) { toast.error("Enter Legend ID and amount"); return; }
    try {
      await removeCoinsByLegendIdMutation.mutateAsync({
        legendId: BigInt(legendIdInput.trim()),
        amount: BigInt(legendIdCoinAmount),
      });
      toast.success(`Removed ${legendIdCoinAmount} coins from #${legendIdInput.padStart(4, '0')}!`);
      setLegendIdCoinAmount("");
      // Refresh the lookup result
      const refreshed = await getUserByLegendIdMutation.mutateAsync(BigInt(legendIdInput.trim()));
      if (refreshed) setLegendIdSearchResult(refreshed);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove coins");
    }
  };

  const handleSetResetCode = async () => {
    if (!newResetCode.trim()) { toast.error("Enter a reset code"); return; }
    try {
      await setResetCodeMutation.mutateAsync(newResetCode.trim());
      toast.success("Reset code saved!");
      setNewResetCode("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleSetPaymentNumbers = async () => {
    if (!pJazzCash.trim()) { toast.error("Enter JazzCash number"); return; }
    try {
      await setPaymentNumbersMutation.mutateAsync({
        jazzCash: pJazzCash.trim(),
        easyPaisa: "",
      });
      toast.success("JazzCash number saved!");
      setPJazzCash("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleApproveDeposit = async (requestId: bigint) => {
    try {
      await approveDepositMutation.mutateAsync(requestId);
      toast.success("Deposit approved! Coins added to user wallet.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleRejectDeposit = async (requestId: bigint) => {
    try {
      await rejectDepositMutation.mutateAsync(requestId);
      toast.success("Deposit request rejected.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleApproveWithdrawal = async (requestId: bigint) => {
    try {
      await approveWithdrawalMutation.mutateAsync(requestId);
      toast.success("Withdrawal approved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleRejectWithdrawal = async (requestId: bigint) => {
    try {
      await rejectWithdrawalMutation.mutateAsync(requestId);
      toast.success("Withdrawal request rejected.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const inputStyle = {
    background: "oklch(0.16 0.02 240)",
    border: "1px solid oklch(0.28 0.02 240)",
    color: "oklch(0.95 0.005 80)",
  };

  return (
    <div className="flex flex-col animate-slide-up">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: "oklch(0.08 0.01 240)" }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.16 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl neon-text-gold tracking-wider">
            ADMIN PANEL
          </h1>
        </div>
        <Shield className="w-5 h-5" style={{ color: "oklch(0.82 0.18 85)" }} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-4">

        {/* Payment Numbers */}
        <SectionCard title="PAYMENT NUMBERS" icon={CreditCard}>
          {paymentNumbers?.jazzCash && (
            <div
              className="rounded-xl p-3 flex flex-col gap-1.5"
              style={{ background: "oklch(0.72 0.22 45 / 0.08)", border: "1px solid oklch(0.72 0.22 45 / 0.2)" }}
            >
              <p className="text-[10px] font-display font-bold text-muted-foreground tracking-wider">CURRENT NUMBER</p>
              <p className="text-xs font-mono-game" style={{ color: "oklch(0.9 0.01 240)" }}>
                <span style={{ color: "oklch(0.75 0.2 300)" }}>JazzCash:</span> {paymentNumbers.jazzCash}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">JAZZCASH NUMBER</Label>
            <Input
              placeholder={paymentNumbers?.jazzCash || "e.g. 03242646964"}
              value={pJazzCash}
              onChange={(e) => setPJazzCash(e.target.value)}
              style={inputStyle}
              className="h-10 font-mono-game text-sm"
            />
          </div>
          <Button
            type="button"
            onClick={handleSetPaymentNumbers}
            disabled={setPaymentNumbersMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {setPaymentNumbersMutation.isPending ? "Saving..." : "SAVE JAZZCASH NUMBER"}
          </Button>
        </SectionCard>

        {/* Reset Code */}
        <SectionCard title="RESET CODE" icon={KeyRound}>
          {currentResetCode && (
            <div
              className="rounded-xl p-3 flex flex-col gap-1.5"
              style={{ background: "oklch(0.72 0.22 45 / 0.08)", border: "1px solid oklch(0.72 0.22 45 / 0.2)" }}
            >
              <p className="text-[10px] font-display font-bold text-muted-foreground tracking-wider">CURRENT CODE</p>
              <p className="font-mono-game text-sm" style={{ color: "oklch(0.9 0.01 240)" }}>
                {currentResetCode}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="reset-code-input" className="text-xs font-display text-muted-foreground tracking-wider">NEW RESET CODE</label>
            <Input
              id="reset-code-input"
              placeholder="Enter a secret reset code..."
              value={newResetCode}
              onChange={(e) => setNewResetCode(e.target.value)}
              style={inputStyle}
              className="h-10 font-mono-game text-sm"
            />
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">
              Share this code with users who forgot their password.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSetResetCode}
            disabled={setResetCodeMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {setResetCodeMutation.isPending ? "Saving..." : "SAVE RESET CODE"}
          </Button>
        </SectionCard>

        {/* Manage by Legend ID */}
        <SectionCard title="MANAGE BY LEGEND ID" icon={Hash}>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">LEGEND ID</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g. 100001"
                value={legendIdInput}
                onChange={(e) => {
                  setLegendIdInput(e.target.value);
                  setLegendIdSearchResult(null);
                  setLegendIdNotFound(false);
                }}
                style={inputStyle}
                className="h-10 font-mono-game text-sm flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") handleLookupByLegendId(); }}
              />
              <Button
                type="button"
                onClick={handleLookupByLegendId}
                disabled={getUserByLegendIdMutation.isPending}
                className="h-10 px-4 font-display font-bold text-xs tracking-wider shrink-0"
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.22 220), oklch(0.6 0.2 220))",
                  color: "oklch(0.95 0.005 80)",
                  border: "none",
                }}
              >
                {getUserByLegendIdMutation.isPending ? "..." : "LOOKUP"}
              </Button>
            </div>
          </div>

          {legendIdNotFound && (
            <div
              className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: "oklch(0.65 0.25 25 / 0.08)", border: "1px solid oklch(0.65 0.25 25 / 0.25)" }}
            >
              <Hash className="w-4 h-4 shrink-0" style={{ color: "oklch(0.65 0.25 25)" }} />
              <span className="text-sm font-display font-bold" style={{ color: "oklch(0.65 0.25 25)" }}>
                Legend ID not found
              </span>
            </div>
          )}

          {legendIdSearchResult && (() => {
            const [, profile] = legendIdSearchResult;
            return (
              <div
                className="rounded-xl overflow-hidden flex flex-col"
                style={{ border: "1px solid oklch(0.72 0.22 220 / 0.35)" }}
              >
                {/* Legend ID badge header */}
                <div
                  className="px-3 py-2 flex items-center gap-2"
                  style={{ background: "oklch(0.72 0.22 220 / 0.1)", borderBottom: "1px solid oklch(0.72 0.22 220 / 0.2)" }}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.72 0.22 220)" }} />
                  <span
                    className="font-display font-bold text-base tracking-widest"
                    style={{ color: "oklch(0.82 0.22 55)", textShadow: "0 0 12px oklch(0.82 0.22 55 / 0.35)" }}
                  >
                    #{profile.legendId.toString().padStart(4, '0')}
                  </span>
                  <div
                    className="ml-auto shrink-0 text-[10px] font-display font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: "oklch(0.82 0.18 85 / 0.12)",
                      color: "oklch(0.82 0.18 85)",
                      border: "1px solid oklch(0.82 0.18 85 / 0.3)",
                    }}
                  >
                    <LCoinIcon size={11} />
                    {profile.balance.toString()}
                  </div>
                </div>

                {/* Profile details */}
                <div className="px-3 py-2.5 flex flex-col gap-1.5">
                  {profile.fullName && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display font-bold text-muted-foreground tracking-wider w-20 shrink-0">FULL NAME</span>
                      <span className="text-xs font-body" style={{ color: "oklch(0.85 0.01 240)" }}>{profile.fullName}</span>
                    </div>
                  )}
                  {profile.inGameName && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display font-bold text-muted-foreground tracking-wider w-20 shrink-0">IN-GAME</span>
                      <span className="text-xs font-display font-bold" style={{ color: "oklch(0.72 0.22 45)" }}>{profile.inGameName}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display font-bold text-muted-foreground tracking-wider w-20 shrink-0">EMAIL</span>
                      <span className="text-xs font-body truncate" style={{ color: "oklch(0.75 0.01 240)" }}>{profile.email}</span>
                    </div>
                  )}
                  {profile.mobileNo && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display font-bold text-muted-foreground tracking-wider w-20 shrink-0">MOBILE</span>
                      <span className="text-xs font-mono-game" style={{ color: "oklch(0.75 0.01 240)" }}>+92 {profile.mobileNo}</span>
                    </div>
                  )}
                  {profile.gameUID && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display font-bold text-muted-foreground tracking-wider w-20 shrink-0">GAME UID</span>
                      <span className="text-xs font-mono-game" style={{ color: "oklch(0.7 0.01 240)" }}>{profile.gameUID}</span>
                    </div>
                  )}
                </div>

                {/* Coin actions */}
                <div
                  className="px-3 py-3 flex flex-col gap-2"
                  style={{ borderTop: "1px solid oklch(0.72 0.22 220 / 0.2)", background: "oklch(0.11 0.015 240)" }}
                >
                  <Label className="text-xs font-display text-muted-foreground tracking-wider">COIN AMOUNT</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={legendIdCoinAmount}
                    onChange={(e) => setLegendIdCoinAmount(e.target.value)}
                    style={inputStyle}
                    className="h-10"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={handleAddCoinsByLegendId}
                      disabled={addCoinsByLegendIdMutation.isPending || removeCoinsByLegendIdMutation.isPending}
                      className="h-10 font-display font-bold text-xs tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
                        color: "oklch(0.08 0.01 240)",
                        border: "none",
                      }}
                    >
                      {addCoinsByLegendIdMutation.isPending ? "Adding..." : "+ ADD COINS"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRemoveCoinsByLegendId}
                      disabled={addCoinsByLegendIdMutation.isPending || removeCoinsByLegendIdMutation.isPending}
                      className="h-10 font-display font-bold text-xs tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
                        color: "oklch(0.95 0.005 80)",
                        border: "none",
                      }}
                    >
                      {removeCoinsByLegendIdMutation.isPending ? "Removing..." : "- REMOVE COINS"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </SectionCard>

        {/* Pending Deposit Requests */}
        <SectionCard title="DEPOSIT REQUESTS" icon={ArrowDownLeft}>
          {depositLoading ? (
            <div className="flex items-center justify-center py-6">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "oklch(0.72 0.22 145)", borderTopColor: "transparent" }}
              />
            </div>
          ) : !pendingDeposits || pendingDeposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <ArrowDownLeft className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm font-body text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingDeposits.map((req) => {
                const isJazz = req.paymentMethod === Variant_easyPaisa_jazzCash.jazzCash;
                return (
                  <div
                    key={req.id.toString()}
                    className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: "oklch(0.14 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-mono-game text-muted-foreground truncate">
                          {truncatePrincipal(req.user)}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm neon-text-gold flex items-center gap-1">
                            <LCoinIcon size={13} />
                            +{req.amount.toString()}
                          </span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold tracking-wider"
                            style={
                              isJazz
                                ? { background: "oklch(0.6 0.2 300 / 0.15)", color: "oklch(0.75 0.2 300)", border: "1px solid oklch(0.6 0.2 300 / 0.3)" }
                                : { background: "oklch(0.72 0.22 145 / 0.15)", color: "oklch(0.75 0.22 145)", border: "1px solid oklch(0.72 0.22 145 / 0.3)" }
                            }
                          >
                            {isJazz ? "JAZZCASH" : "EASYPAISA"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-game text-muted-foreground">
                          TID: {req.transactionReference}
                        </span>
                        <span className="text-[10px] font-mono-game text-muted-foreground">
                          {new Date(Number(req.timestamp / 1_000_000n)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={() => handleApproveDeposit(req.id)}
                        disabled={approveDepositMutation.isPending}
                        className="h-9 font-display font-bold text-xs tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
                          color: "oklch(0.08 0.01 240)",
                          border: "none",
                        }}
                      >
                        APPROVE
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRejectDeposit(req.id)}
                        disabled={rejectDepositMutation.isPending}
                        className="h-9 font-display font-bold text-xs tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
                          color: "oklch(0.95 0.005 80)",
                          border: "none",
                        }}
                      >
                        REJECT
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Pending Withdrawal Requests */}
        <SectionCard title="WITHDRAWAL REQUESTS" icon={ArrowUpRight}>
          {withdrawalLoading ? (
            <div className="flex items-center justify-center py-6">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "oklch(0.65 0.25 25)", borderTopColor: "transparent" }}
              />
            </div>
          ) : !pendingWithdrawals || pendingWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <ArrowUpRight className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm font-body text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingWithdrawals.map((req) => (
                <div
                  key={req.id.toString()}
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: "oklch(0.14 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono-game text-muted-foreground">
                      {truncatePrincipal(req.user)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm flex items-center gap-1" style={{ color: "oklch(0.72 0.25 25)" }}>
                        <LCoinIcon size={13} />
                        -{req.amount.toString()}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono-game text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(Number(req.timestamp / 1_000_000n)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => handleApproveWithdrawal(req.id)}
                      disabled={approveWithdrawalMutation.isPending}
                      className="h-9 font-display font-bold text-xs tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
                        color: "oklch(0.08 0.01 240)",
                        border: "none",
                      }}
                    >
                      APPROVE
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleRejectWithdrawal(req.id)}
                      disabled={rejectWithdrawalMutation.isPending}
                      className="h-9 font-display font-bold text-xs tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
                        color: "oklch(0.95 0.005 80)",
                        border: "none",
                      }}
                    >
                      REJECT
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Create Category */}
        <SectionCard title="CREATE CATEGORY" icon={Plus}>
          {/* Quick Setup */}
          <div
            className="rounded-xl p-3 flex flex-col gap-2"
            style={{ background: "oklch(0.72 0.22 145 / 0.06)", border: "1px solid oklch(0.72 0.22 145 / 0.2)" }}
          >
            <p className="text-xs font-display font-bold tracking-wider" style={{ color: "oklch(0.75 0.22 145)" }}>
              QUICK SETUP
            </p>
            <p className="text-[11px] font-body text-muted-foreground">
              Ek click mein BR, CS, aur Lone Wolf categories add karein
            </p>
            <div className="flex gap-2 flex-wrap">
              {["BR", "CS", "Lone Wolf"].map((name) => {
                const exists = (categories ?? []).some((c) => c.name.toLowerCase() === name.toLowerCase());
                return (
                  <span
                    key={name}
                    className="px-2 py-1 rounded text-[10px] font-display font-bold tracking-wider"
                    style={
                      exists
                        ? { background: "oklch(0.72 0.22 145 / 0.15)", color: "oklch(0.75 0.22 145)", border: "1px solid oklch(0.72 0.22 145 / 0.3)" }
                        : { background: "oklch(0.65 0.25 25 / 0.15)", color: "oklch(0.72 0.25 25)", border: "1px solid oklch(0.65 0.25 25 / 0.3)" }
                    }
                  >
                    {exists ? `✓ ${name}` : name}
                  </span>
                );
              })}
            </div>
            <Button
              type="button"
              onClick={handleQuickSetup}
              disabled={createCategoryMutation.isPending}
              className="h-9 font-display font-bold text-xs tracking-wider w-full"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
                color: "oklch(0.08 0.01 240)",
                border: "none",
              }}
            >
              {createCategoryMutation.isPending ? "Adding..." : "ADD BR + CS + LONE WOLF"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "oklch(0.25 0.02 240)" }} />
            <span className="text-[10px] font-display text-muted-foreground tracking-wider">OR ADD CUSTOM</span>
            <div className="flex-1 h-px" style={{ background: "oklch(0.25 0.02 240)" }} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              CATEGORY NAME
            </Label>
            <Input
              placeholder="e.g. Battle Royale"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              style={inputStyle}
              className="h-10"
            />
          </div>
          <Button
            type="button"
            onClick={handleCreateCategory}
            disabled={createCategoryMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {createCategoryMutation.isPending ? "Creating..." : "CREATE CATEGORY"}
          </Button>
        </SectionCard>

        {/* Create Tournament */}
        <SectionCard title="CREATE TOURNAMENT" icon={Swords}>
          {[
            { label: "TITLE", value: tTitle, set: setTTitle, placeholder: "Tournament name" },
            { label: "ENTRY FEE", value: tEntryFee, set: setTEntryFee, placeholder: "e.g. 50", type: "number" },
            { label: "PRIZE POOL", value: tPrizePool, set: setTPrizePool, placeholder: "e.g. 1000", type: "number" },
            { label: "TOTAL SLOTS", value: tTotalSlots, set: setTTotalSlots, placeholder: "e.g. 48", type: "number" },
          ].map(({ label, value, set, placeholder, type }) => (
            <div key={label} className="flex flex-col gap-1">
              <Label className="text-xs font-display text-muted-foreground tracking-wider">{label}</Label>
              <Input
                type={type ?? "text"}
                placeholder={placeholder}
                value={value}
                onChange={(e) => set(e.target.value)}
                style={inputStyle}
                className="h-10"
              />
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">CATEGORY</Label>
            <Select value={tCategoryId} onValueChange={setTCategoryId}>
              <SelectTrigger className="h-10" style={inputStyle}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent style={{ background: "oklch(0.16 0.02 240)" }}>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              RULES
            </Label>
            <Textarea
              placeholder="Tournament rules..."
              value={tRules}
              onChange={(e) => setTRules(e.target.value)}
              style={inputStyle}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              MATCH BANNER IMAGE URL (optional)
            </Label>
            <Input
              placeholder="https://example.com/banner.jpg"
              value={tImageUrl}
              onChange={(e) => setTImageUrl(e.target.value)}
              style={inputStyle}
              className="h-10"
            />
            <p className="text-[10px] text-muted-foreground font-body">Image shown on tournament card & detail page</p>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              PRIZE DISTRIBUTION (comma-separated)
            </Label>
            <Input
              placeholder="e.g. 500,300,200"
              value={tPrizeDist}
              onChange={(e) => setTPrizeDist(e.target.value)}
              style={inputStyle}
              className="h-10"
            />
            <p className="text-[10px] text-muted-foreground font-body">1st,2nd,3rd place prizes</p>
          </div>

          <Button
            type="button"
            onClick={handleCreateTournament}
            disabled={createTournamentMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {createTournamentMutation.isPending ? "Creating..." : "CREATE TOURNAMENT"}
          </Button>
        </SectionCard>

        {/* Post Scores */}
        <SectionCard title="POST SCORES" icon={Star}>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              TOURNAMENT ID
            </Label>
            <Input
              type="number"
              placeholder="Tournament ID"
              value={sTournamentId}
              onChange={(e) => setSTournamentId(e.target.value)}
              style={inputStyle}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              SCORES (one per line: principal,score)
            </Label>
            <Textarea
              placeholder={"aaaaa-bbbbb-...,150\nccccc-ddddd-...,120"}
              value={sScores}
              onChange={(e) => setSScores(e.target.value)}
              style={inputStyle}
              className="min-h-[80px] resize-none font-mono-game text-xs"
            />
          </div>
          <Button
            type="button"
            onClick={handlePostScores}
            disabled={postScoresMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {postScoresMutation.isPending ? "Posting..." : "POST SCORES"}
          </Button>
        </SectionCard>

        {/* Assign Role */}
        <SectionCard title="ASSIGN USER ROLE" icon={Users}>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              USER PRINCIPAL
            </Label>
            <Input
              placeholder="Principal ID..."
              value={rPrincipal}
              onChange={(e) => setRPrincipal(e.target.value)}
              style={inputStyle}
              className="h-10 font-mono-game text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">ROLE</Label>
            <Select value={rRole} onValueChange={(v) => setRRole(v as UserRole)}>
              <SelectTrigger className="h-10" style={inputStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: "oklch(0.16 0.02 240)" }}>
                {Object.values(UserRole).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={handleAssignRole}
            disabled={assignRoleMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {assignRoleMutation.isPending ? "Assigning..." : "ASSIGN ROLE"}
          </Button>
        </SectionCard>

        {/* Add Coins */}
        <SectionCard title="ADD COINS (BY PRINCIPAL)" icon={LCoinSectionIcon}>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              USER PRINCIPAL
            </Label>
            <Input
              placeholder="Principal ID..."
              value={cPrincipal}
              onChange={(e) => setCPrincipal(e.target.value)}
              style={inputStyle}
              className="h-10 font-mono-game text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-display text-muted-foreground tracking-wider">
              AMOUNT
            </Label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={cAmount}
              onChange={(e) => setCAmount(e.target.value)}
              style={inputStyle}
              className="h-10"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddCoins}
            disabled={addCoinsMutation.isPending}
            className="font-display font-bold tracking-wider h-10"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 45), oklch(0.65 0.25 35))",
              color: "oklch(0.08 0.01 240)",
              border: "none",
            }}
          >
            {addCoinsMutation.isPending ? "Adding..." : "ADD COINS"}
          </Button>
        </SectionCard>

        {/* All Users */}
        <SectionCard title="REGISTERED USERS" icon={Users}>
          {usersLoading ? (
            <div className="flex items-center justify-center py-6">
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "oklch(0.72 0.22 45)", borderTopColor: "transparent" }}
              />
            </div>
          ) : !allUsers || allUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Users className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm font-body text-muted-foreground">No registered users yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="text-[11px] font-display font-bold tracking-wider px-1"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                {allUsers.length} USER{allUsers.length !== 1 ? "S" : ""}
              </div>
              {allUsers.map(([principal, profile]) => (
                <div
                  key={principal.toString()}
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: "oklch(0.14 0.02 240)", border: "1px solid oklch(0.25 0.02 240)" }}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.72 0.22 45 / 0.2), oklch(0.65 0.25 35 / 0.2))",
                        border: "1px solid oklch(0.72 0.22 45 / 0.3)",
                        color: "oklch(0.72 0.22 45)",
                      }}
                    >
                      {(profile.fullName || profile.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-display font-bold text-foreground truncate">
                          {profile.fullName || profile.username || "Unknown"}
                        </span>
                        {profile.legendId > 0n && (
                          <span
                            className="text-[10px] font-display font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "oklch(0.72 0.22 220 / 0.12)",
                              color: "oklch(0.72 0.22 220)",
                              border: "1px solid oklch(0.72 0.22 220 / 0.35)",
                            }}
                          >
                            #{profile.legendId.toString().padStart(4, '0')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono-game text-muted-foreground truncate">
                        {truncatePrincipal(principal)}
                      </span>
                    </div>
                    <div
                      className="ml-auto shrink-0 text-[10px] font-display font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{
                        background: "oklch(0.82 0.18 85 / 0.12)",
                        color: "oklch(0.82 0.18 85)",
                        border: "1px solid oklch(0.82 0.18 85 / 0.3)",
                      }}
                    >
                      <LCoinIcon size={11} />
                      {profile.balance.toString()}
                    </div>
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-1 gap-1 pt-1" style={{ borderTop: "1px solid oklch(0.2 0.02 240)" }}>
                    {profile.inGameName && (
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-3 h-3 shrink-0" style={{ color: "oklch(0.72 0.22 45)" }} />
                        <span className="text-[11px] font-body" style={{ color: "oklch(0.75 0.01 240)" }}>
                          {profile.inGameName}
                        </span>
                        {profile.gameUID && (
                          <>
                            <Hash className="w-3 h-3 shrink-0 ml-2" style={{ color: "oklch(0.55 0.02 240)" }} />
                            <span className="text-[11px] font-mono-game" style={{ color: "oklch(0.6 0.01 240)" }}>
                              {profile.gameUID}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 shrink-0" style={{ color: "oklch(0.55 0.02 240)" }} />
                        <span className="text-[11px] font-body truncate" style={{ color: "oklch(0.65 0.01 240)" }}>
                          {profile.email}
                        </span>
                      </div>
                    )}
                    {profile.mobileNo && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 shrink-0" style={{ color: "oklch(0.55 0.02 240)" }} />
                        <span className="text-[11px] font-mono-game" style={{ color: "oklch(0.65 0.01 240)" }}>
                          +92 {profile.mobileNo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <p className="text-center text-xs text-muted-foreground font-body py-4">
        © 2026. Built with ❤️ using{" "}
        <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="neon-text-orange">
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
