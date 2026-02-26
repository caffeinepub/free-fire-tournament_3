import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetTransactionHistory,
  useAddCoins,
  useRequestWithdrawal,
} from "../hooks/useQueries";
import { Variant_deposit_withdrawal_tournamentEntry as TxnType } from "../backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Coins, ArrowUpRight, ArrowDownLeft, Swords, Wallet } from "lucide-react";
import { toast } from "sonner";

function TxIcon({ type }: { type: TxnType }) {
  if (type === TxnType.deposit) {
    return <ArrowDownLeft className="w-4 h-4 neon-text-green" />;
  }
  if (type === TxnType.withdrawal) {
    return <ArrowUpRight className="w-4 h-4 neon-text-red" />;
  }
  return <Swords className="w-4 h-4 neon-text-orange" />;
}

function TxLabel({ type }: { type: TxnType }) {
  if (type === TxnType.deposit) return <span className="neon-text-green font-display font-bold text-xs">DEPOSIT</span>;
  if (type === TxnType.withdrawal) return <span className="neon-text-red font-display font-bold text-xs">WITHDRAW</span>;
  return <span className="neon-text-orange font-display font-bold text-xs">TOURNAMENT</span>;
}

function AmountDisplay({ type, amount }: { type: TxnType; amount: bigint }) {
  const isCredit = type === TxnType.deposit;
  const isDebit = type === TxnType.withdrawal || type === TxnType.tournamentEntry;
  return (
    <span
      className={`font-display font-bold text-sm ${
        isCredit ? "neon-text-green" : isDebit ? "neon-text-red" : "neon-text-orange"
      }`}
    >
      {isCredit ? "+" : "-"}{amount.toString()}
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

export default function WalletPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: transactions, isLoading: txLoading } = useGetTransactionHistory();
  const addCoinsMutation = useAddCoins();
  const withdrawMutation = useRequestWithdrawal();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!identity) {
      toast.error("Not logged in");
      return;
    }
    try {
      await addCoinsMutation.mutateAsync({
        user: identity.getPrincipal(),
        amount: BigInt(amount),
      });
      toast.success(`Added ${amount} coins to your wallet!`);
      setDepositOpen(false);
      setDepositAmount("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
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
      await withdrawMutation.mutateAsync(BigInt(amount));
      toast.success(`Withdrawal of ${amount} coins requested!`);
      setWithdrawOpen(false);
      setWithdrawAmount("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 animate-fade-in">
      {/* Balance Card */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.13 0.025 45), oklch(0.1 0.015 240), oklch(0.12 0.02 260))",
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
            <Coins className="w-6 h-6 neon-text-gold mb-1" />
            <span
              className="font-display font-bold text-5xl neon-text-gold"
            >
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
            background: "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
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
            background: "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
            color: "oklch(0.95 0.005 80)",
            border: "none",
          }}
        >
          <ArrowUpRight className="w-4 h-4 mr-1.5" />
          WITHDRAW
        </Button>
      </div>

      {/* Transaction history */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid oklch(0.25 0.02 240)" }}
      >
        <div
          className="px-4 py-3"
          style={{ background: "oklch(0.14 0.02 240)", borderBottom: "1px solid oklch(0.2 0.02 240)" }}
        >
          <span className="font-display font-bold text-sm tracking-wider">TRANSACTION HISTORY</span>
        </div>

        {txLoading ? (
          <div className="flex flex-col divide-y" style={{ borderColor: "oklch(0.2 0.02 240)" }}>
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
            <Coins className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm font-body">No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "oklch(0.2 0.02 240)" }}>
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
          style={{ background: "oklch(0.12 0.015 240)", border: "1px solid oklch(0.72 0.22 145 / 0.3)" }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider text-foreground">
              DEPOSIT COINS
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm font-body text-muted-foreground">
              Enter the amount of coins to add to your wallet.
            </p>
            <Input
              type="number"
              min={1}
              placeholder="Enter amount..."
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="font-display text-lg h-12"
              style={{
                background: "oklch(0.16 0.02 240)",
                border: "1px solid oklch(0.3 0.02 240)",
                color: "oklch(0.95 0.005 80)",
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDepositOpen(false); setDepositAmount(""); }}
              className="font-display"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeposit}
              disabled={addCoinsMutation.isPending}
              className="font-display font-bold"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.22 145), oklch(0.6 0.2 145))",
                color: "oklch(0.08 0.01 240)",
                border: "none",
              }}
            >
              {addCoinsMutation.isPending ? "Processing..." : "Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          style={{ background: "oklch(0.12 0.015 240)", border: "1px solid oklch(0.65 0.25 25 / 0.3)" }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider text-foreground">
              WITHDRAW COINS
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm font-body text-muted-foreground">
              Available:{" "}
              <span className="neon-text-gold font-display font-bold">
                {(userProfile?.balance ?? 0n).toString()} coins
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
              style={{
                background: "oklch(0.16 0.02 240)",
                border: "1px solid oklch(0.3 0.02 240)",
                color: "oklch(0.95 0.005 80)",
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setWithdrawOpen(false); setWithdrawAmount(""); }}
              className="font-display"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
              className="font-display font-bold"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.22 25))",
                color: "oklch(0.95 0.005 80)",
                border: "none",
              }}
            >
              {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
