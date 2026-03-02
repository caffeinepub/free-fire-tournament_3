import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Smartphone,
  Swords,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Variant_deposit_withdrawal_tournamentEntry as TxnType,
  Variant_easyPaisa_jazzCash,
  Variant_pending_approved_rejected,
} from "../backend.d";
import { LCoinIcon } from "../components/game/LCoinIcon";
import {
  useGetCallerDepositRequests,
  useGetCallerUserProfile,
  useGetCallerWithdrawalRequests,
  useGetPaymentNumbers,
  useGetTransactionHistory,
  useSubmitDepositRequest,
  useSubmitWithdrawalRequest,
} from "../hooks/useQueries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TxIcon({ type }: { type: TxnType }) {
  if (type === TxnType.deposit)
    return <ArrowDownLeft className="w-4 h-4 neon-text-green" />;
  if (type === TxnType.withdrawal)
    return <ArrowUpRight className="w-4 h-4 neon-text-red" />;
  return <Swords className="w-4 h-4 neon-text-orange" />;
}

function TxLabel({ type }: { type: TxnType }) {
  if (type === TxnType.deposit)
    return (
      <span className="neon-text-green font-display font-bold text-xs">
        DEPOSIT
      </span>
    );
  if (type === TxnType.withdrawal)
    return (
      <span className="neon-text-red font-display font-bold text-xs">
        WITHDRAW
      </span>
    );
  return (
    <span className="neon-text-orange font-display font-bold text-xs">
      TOURNAMENT
    </span>
  );
}

function AmountDisplay({ type, amount }: { type: TxnType; amount: bigint }) {
  const isCredit = type === TxnType.deposit;
  return (
    <span
      className={`font-display font-bold text-sm ${isCredit ? "neon-text-green" : "neon-text-red"}`}
    >
      {isCredit ? "+" : "-"}
      {amount.toString()}
    </span>
  );
}

function formatDate(timestamp: bigint) {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({
  status,
}: { status: Variant_pending_approved_rejected }) {
  if (status === Variant_pending_approved_rejected.pending) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-display font-bold text-[10px] tracking-wider"
        style={{
          background: "oklch(0.72 0.18 85 / 0.15)",
          color: "oklch(0.82 0.18 85)",
          border: "1px solid oklch(0.72 0.18 85 / 0.3)",
        }}
      >
        <Clock className="w-2.5 h-2.5" />
        PENDING
      </span>
    );
  }
  if (status === Variant_pending_approved_rejected.approved) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-display font-bold text-[10px] tracking-wider"
        style={{
          background: "oklch(0.72 0.22 145 / 0.15)",
          color: "oklch(0.75 0.22 145)",
          border: "1px solid oklch(0.72 0.22 145 / 0.3)",
        }}
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
        APPROVED
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-display font-bold text-[10px] tracking-wider"
      style={{
        background: "oklch(0.65 0.25 25 / 0.15)",
        color: "oklch(0.72 0.25 25)",
        border: "1px solid oklch(0.65 0.25 25 / 0.3)",
      }}
    >
      <XCircle className="w-2.5 h-2.5" />
      REJECTED
    </span>
  );
}

function PaymentMethodBadge({
  method,
}: { method: Variant_easyPaisa_jazzCash }) {
  const isJazz = method === Variant_easyPaisa_jazzCash.jazzCash;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded font-display font-bold text-[10px] tracking-wider"
      style={{
        background: "oklch(0.6 0.2 300 / 0.15)",
        color: "oklch(0.75 0.2 300)",
        border: "1px solid oklch(0.6 0.2 300 / 0.3)",
      }}
    >
      {isJazz ? "JAZZCASH" : "JAZZCASH"}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display font-bold transition-all"
      style={{
        background: copied
          ? "oklch(0.72 0.22 145 / 0.2)"
          : "oklch(0.22 0.02 240)",
        color: copied ? "oklch(0.75 0.22 145)" : "oklch(0.7 0.02 240)",
        border: `1px solid ${copied ? "oklch(0.72 0.22 145 / 0.3)" : "oklch(0.28 0.02 240)"}`,
      }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WalletPage() {
  const {
    data: userProfile,
    isLoading: profileLoading,
    isError: profileError,
    // profileError is used to decide whether to show skeleton or skip straight to content
  } = useGetCallerUserProfile();
  const { data: transactions, isLoading: txLoading } =
    useGetTransactionHistory();
  const { data: paymentNumbers } = useGetPaymentNumbers();
  const { data: depositRequests, isLoading: depositReqLoading } =
    useGetCallerDepositRequests();
  const { data: withdrawalRequests, isLoading: withdrawalReqLoading } =
    useGetCallerWithdrawalRequests();

  const submitDepositMutation = useSubmitDepositRequest();
  const submitWithdrawalMutation = useSubmitWithdrawalRequest();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState("");
  const depositMethod = Variant_easyPaisa_jazzCash.jazzCash;
  const [transactionRef, setTransactionRef] = useState("");

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Collapsible section state
  const [showDepositReqs, setShowDepositReqs] = useState(false);
  const [showWithdrawalReqs, setShowWithdrawalReqs] = useState(false);

  const handleDeposit = async () => {
    const amount = Number.parseInt(depositAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!transactionRef.trim()) {
      toast.error("Enter your Transaction ID / TID");
      return;
    }
    try {
      await submitDepositMutation.mutateAsync({
        amount: BigInt(amount),
        paymentMethod: depositMethod,
        transactionReference: transactionRef.trim(),
      });
      toast.success(
        "Deposit request submitted! Admin will verify and add coins within 24 hours.",
      );
      setDepositOpen(false);
      setDepositAmount("");
      setTransactionRef("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Deposit request failed",
      );
    }
  };

  const handleWithdraw = async () => {
    const amount = Number.parseInt(withdrawAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const balance = userProfile?.balance ?? 0n;
    if (BigInt(amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      await submitWithdrawalMutation.mutateAsync(BigInt(amount));
      toast.success(
        "Withdrawal request submitted! Admin will process it soon.",
      );
      setWithdrawOpen(false);
      setWithdrawAmount("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Withdrawal request failed",
      );
    }
  };

  const inputStyle = {
    background: "oklch(0.16 0.02 240)",
    border: "1px solid oklch(0.3 0.02 240)",
    color: "oklch(0.95 0.005 80)",
  };

  // Show full-page skeleton only while initial actor is loading (not on auth errors)
  if (profileLoading && !profileError) {
    return (
      <div className="flex flex-col gap-4 p-4 animate-fade-in">
        <Skeleton className="h-40 w-full bg-muted/50 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full bg-muted/50 rounded-xl" />
          <Skeleton className="h-12 w-full bg-muted/50 rounded-xl" />
        </div>
        <Skeleton className="h-14 w-full bg-muted/50 rounded-xl" />
        <Skeleton className="h-14 w-full bg-muted/50 rounded-xl" />
        <Skeleton className="h-32 w-full bg-muted/50 rounded-xl" />
      </div>
    );
  }

  // On auth errors, fall through and render page with 0 balance (don't block UI)

  return (
    <div className="flex flex-col gap-4 p-4 animate-fade-in">
      {/* Balance Card */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-3 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.025 45), oklch(0.1 0.015 240), oklch(0.12 0.02 260))",
          border: "1px solid oklch(0.72 0.22 45 / 0.3)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none diagonal-stripe"
          style={{ opacity: 0.3 }}
        />
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 neon-text-orange" />
          <span className="font-display font-bold text-sm text-muted-foreground tracking-widest uppercase">
            Your Balance
          </span>
        </div>
        {profileLoading ? (
          <Skeleton className="h-12 w-32 bg-muted/50 rounded" />
        ) : (
          <div className="flex items-end gap-2">
            <LCoinIcon size={28} className="mb-1" />
            <span className="font-display font-bold text-5xl neon-text-gold">
              {(userProfile?.balance ?? 0n).toString()}
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground font-body">COINS</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => setDepositOpen(true)}
          className="h-12 font-display font-bold tracking-wider uppercase text-sm btn-glow"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
            color: "oklch(0.08 0.01 240)",
            border: "none",
          }}
        >
          <ArrowDownLeft className="w-4 h-4 mr-1.5" />
          DEPOSIT
        </Button>
        <Button
          type="button"
          onClick={() => setWithdrawOpen(true)}
          className="h-12 font-display font-bold tracking-wider uppercase text-sm"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
            color: "oklch(0.95 0.005 80)",
            border: "none",
          }}
        >
          <ArrowUpRight className="w-4 h-4 mr-1.5" />
          WITHDRAW
        </Button>
      </div>

      {/* My Deposit Requests */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid oklch(0.25 0.02 240)" }}
      >
        <button
          type="button"
          className="w-full px-4 py-3 flex items-center justify-between"
          style={{
            background: "oklch(0.14 0.02 240)",
            borderBottom: showDepositReqs
              ? "1px solid oklch(0.2 0.02 240)"
              : "none",
          }}
          onClick={() => setShowDepositReqs((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 neon-text-green" />
            <span className="font-display font-bold text-sm tracking-wider">
              MY DEPOSIT REQUESTS
            </span>
            {depositRequests && depositRequests.length > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-display font-bold"
                style={{
                  background: "oklch(0.72 0.22 145 / 0.2)",
                  color: "oklch(0.72 0.22 145)",
                }}
              >
                {depositRequests.length}
              </span>
            )}
          </div>
          {showDepositReqs ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showDepositReqs &&
          (depositReqLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-muted/50 rounded" />
              ))}
            </div>
          ) : !depositRequests || depositRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Smartphone className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm font-body">
                No deposit requests yet
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: "oklch(0.2 0.02 240)" }}
            >
              {[...depositRequests]
                .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
                .map((req) => (
                  <div
                    key={req.id.toString()}
                    className="px-4 py-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LCoinIcon size={14} />
                        <span className="font-display font-bold text-sm neon-text-gold">
                          +{req.amount.toString()}
                        </span>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <PaymentMethodBadge method={req.paymentMethod} />
                      <span className="text-[10px] font-mono-game text-muted-foreground">
                        TID: {req.transactionReference}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono-game text-muted-foreground">
                      {formatDate(req.timestamp)}
                    </p>
                  </div>
                ))}
            </div>
          ))}
      </div>

      {/* My Withdrawal Requests */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid oklch(0.25 0.02 240)" }}
      >
        <button
          type="button"
          className="w-full px-4 py-3 flex items-center justify-between"
          style={{
            background: "oklch(0.14 0.02 240)",
            borderBottom: showWithdrawalReqs
              ? "1px solid oklch(0.2 0.02 240)"
              : "none",
          }}
          onClick={() => setShowWithdrawalReqs((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 neon-text-red" />
            <span className="font-display font-bold text-sm tracking-wider">
              MY WITHDRAWAL REQUESTS
            </span>
            {withdrawalRequests && withdrawalRequests.length > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-display font-bold"
                style={{
                  background: "oklch(0.65 0.25 25 / 0.2)",
                  color: "oklch(0.65 0.25 25)",
                }}
              >
                {withdrawalRequests.length}
              </span>
            )}
          </div>
          {showWithdrawalReqs ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showWithdrawalReqs &&
          (withdrawalReqLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-muted/50 rounded" />
              ))}
            </div>
          ) : !withdrawalRequests || withdrawalRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <ArrowUpRight className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm font-body">
                No withdrawal requests yet
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: "oklch(0.2 0.02 240)" }}
            >
              {[...withdrawalRequests]
                .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
                .map((req) => (
                  <div
                    key={req.id.toString()}
                    className="px-4 py-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LCoinIcon size={14} />
                        <span
                          className="font-display font-bold text-sm"
                          style={{ color: "oklch(0.72 0.25 25)" }}
                        >
                          -{req.amount.toString()}
                        </span>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-[10px] font-mono-game text-muted-foreground">
                      {formatDate(req.timestamp)}
                    </p>
                  </div>
                ))}
            </div>
          ))}
      </div>

      {/* Transaction History */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid oklch(0.25 0.02 240)" }}
      >
        <div
          className="px-4 py-3"
          style={{
            background: "oklch(0.14 0.02 240)",
            borderBottom: "1px solid oklch(0.2 0.02 240)",
          }}
        >
          <span className="font-display font-bold text-sm tracking-wider">
            TRANSACTION HISTORY
          </span>
        </div>

        {txLoading ? (
          <div
            className="flex flex-col divide-y"
            style={{ borderColor: "oklch(0.2 0.02 240)" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-muted/50 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 bg-muted/50 rounded mb-1" />
                  <Skeleton className="h-2 w-16 bg-muted/50 rounded" />
                </div>
                <Skeleton className="h-4 w-12 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <LCoinIcon size={32} className="opacity-40" />
            <p className="text-muted-foreground text-sm font-body">
              No transactions yet
            </p>
          </div>
        ) : (
          <div
            className="flex flex-col divide-y"
            style={{ borderColor: "oklch(0.2 0.02 240)" }}
          >
            {[...transactions]
              .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
              .map((tx) => (
                <div
                  key={tx.id.toString()}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.16 0.02 240)" }}
                  >
                    <TxIcon type={tx.txnType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TxLabel type={tx.txnType} />
                    <p className="text-[10px] font-mono-game text-muted-foreground mt-0.5">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>
                  <AmountDisplay type={tx.txnType} amount={tx.amount} />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.12 0.015 240)",
            border: "1px solid oklch(0.72 0.22 145 / 0.3)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider text-foreground">
              DEPOSIT COINS
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Payment Numbers */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-display font-bold text-muted-foreground tracking-wider">
                SEND PAYMENT TO:
              </p>
              {/* JazzCash */}
              <div
                className="rounded-xl p-3 flex items-center justify-between gap-3"
                style={{
                  background: "oklch(0.6 0.2 300 / 0.08)",
                  border: "1px solid oklch(0.6 0.2 300 / 0.25)",
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[10px] font-display font-bold tracking-wider"
                    style={{ color: "oklch(0.75 0.2 300)" }}
                  >
                    JAZZCASH
                  </span>
                  <span
                    className="font-mono-game text-sm"
                    style={{ color: "oklch(0.9 0.01 240)" }}
                  >
                    {paymentNumbers?.jazzCash || "Contact admin for number"}
                  </span>
                </div>
                {paymentNumbers?.jazzCash && (
                  <CopyButton text={paymentNumbers.jazzCash} />
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-display font-bold text-muted-foreground tracking-wider">
                AMOUNT
              </p>
              <Input
                type="number"
                min={1}
                placeholder="Enter amount of coins..."
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="font-display text-base h-11"
                style={inputStyle}
              />
            </div>

            {/* Transaction Reference */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-display font-bold text-muted-foreground tracking-wider">
                TRANSACTION ID (TID)
              </p>
              <Input
                type="text"
                placeholder="Enter TID/Transaction ID from your payment"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="font-mono-game text-xs h-11"
                style={inputStyle}
              />
              <p className="text-[10px] font-body text-muted-foreground">
                Copy the transaction ID from your JazzCash app after sending.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDepositOpen(false);
                setDepositAmount("");
                setTransactionRef("");
              }}
              className="font-display"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeposit}
              disabled={submitDepositMutation.isPending}
              className="font-display font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
                color: "oklch(0.08 0.01 240)",
                border: "none",
              }}
            >
              {submitDepositMutation.isPending
                ? "Submitting..."
                : "SUBMIT REQUEST"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.12 0.015 240)",
            border: "1px solid oklch(0.65 0.25 25 / 0.3)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider text-foreground">
              WITHDRAW COINS
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm font-body text-muted-foreground flex items-center gap-1.5 flex-wrap">
              Available:{" "}
              <span className="neon-text-gold font-display font-bold flex items-center gap-1">
                <LCoinIcon size={14} />
                {(userProfile?.balance ?? 0n).toString()}
              </span>
            </p>
            <Input
              type="number"
              min={1}
              max={Number(userProfile?.balance ?? 0n)}
              placeholder="Enter amount..."
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="font-display text-lg h-12"
              style={inputStyle}
            />
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background: "oklch(0.72 0.18 85 / 0.08)",
                border: "1px solid oklch(0.72 0.18 85 / 0.2)",
              }}
            >
              <Clock
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
              <p
                className="text-xs font-body"
                style={{ color: "oklch(0.82 0.18 85)" }}
              >
                Your withdrawal request will be processed after admin approval.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setWithdrawOpen(false);
                setWithdrawAmount("");
              }}
              className="font-display"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleWithdraw}
              disabled={submitWithdrawalMutation.isPending}
              className="font-display font-bold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
                color: "oklch(0.95 0.005 80)",
                border: "none",
              }}
            >
              {submitWithdrawalMutation.isPending
                ? "Submitting..."
                : "SUBMIT REQUEST"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
