import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCategory,
  useCreateTournament,
  usePostScores,
  useAssignCallerUserRole,
  useAddCoins,
  useGetCategories,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { UserRole } from "../backend.d";
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
import { ArrowLeft, Plus, Shield, Swords, Users, Coins, Star } from "lucide-react";
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

export default function AdminPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: categories } = useGetCategories();

  const createCategoryMutation = useCreateCategory();
  const createTournamentMutation = useCreateTournament();
  const postScoresMutation = usePostScores();
  const assignRoleMutation = useAssignCallerUserRole();
  const addCoinsMutation = useAddCoins();

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

  // Post Scores
  const [sTournamentId, setSTournamentId] = useState("");
  const [sScores, setSScores] = useState("");

  // Assign Role
  const [rPrincipal, setRPrincipal] = useState("");
  const [rRole, setRRole] = useState<UserRole>(UserRole.user);

  // Add Coins
  const [cPrincipal, setCPrincipal] = useState("");
  const [cAmount, setCAmount] = useState("");

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
      });
      toast.success("Tournament created!");
      setTTitle(""); setTCategoryId(""); setTEntryFee(""); setTPrizePool("");
      setTTotalSlots(""); setTRules(""); setTPrizeDist("");
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
        {/* Create Category */}
        <SectionCard title="CREATE CATEGORY" icon={Plus}>
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
        <SectionCard title="ADD COINS TO USER" icon={Coins}>
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
