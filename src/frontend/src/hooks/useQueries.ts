import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Principal } from "@icp-sdk/core/principal";
import type { UserRole } from "../backend.d";

// ─── User Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ─── Tournaments ─────────────────────────────────────────────────────────────

export function useGetTournaments() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getTournaments();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetTournament(id: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["tournament", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error("Actor not available");
      return actor.getTournament(id);
    },
    enabled: !!actor && !actorFetching && id !== null,
    retry: false,
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function useGetCategories() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCategories();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function useGetLeaderboard(tournamentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null) throw new Error("Actor not available");
      return actor.getLeaderboard(tournamentId);
    },
    enabled: !!actor && !actorFetching && tournamentId !== null,
    retry: false,
  });
}

export function useGetGlobalLeaderboard() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["globalLeaderboard"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getGlobalLeaderboard();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetTakenSlots(tournamentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["takenSlots", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null) throw new Error("Actor not available");
      return actor.getTakenSlots(tournamentId);
    },
    enabled: !!actor && !actorFetching && tournamentId !== null,
    retry: false,
  });
}

// ─── Wallet / Transactions ────────────────────────────────────────────────────

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["transactionHistory"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ─── User Profile Fetch by Principal ─────────────────────────────────────────

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) throw new Error("Actor not available");
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, balance }: { username: string; balance: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile({ username, balance });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSetUsername() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setUsername(username);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useJoinTournament() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, slotNumber }: { tournamentId: bigint; slotNumber: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.joinTournament(tournamentId, slotNumber);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournament", vars.tournamentId.toString()] });
      qc.invalidateQueries({ queryKey: ["takenSlots", vars.tournamentId.toString()] });
      qc.invalidateQueries({ queryKey: ["transactionHistory"] });
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useAddCoins() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, amount }: { user: Principal; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addCoins(user, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({ queryKey: ["transactionHistory"] });
    },
  });
}

export function useSubmitWithdrawalRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitWithdrawalRequest(amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({ queryKey: ["transactionHistory"] });
      qc.invalidateQueries({ queryKey: ["callerWithdrawalRequests"] });
    },
  });
}

export function useSubmitDepositRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      transactionReference,
    }: {
      amount: bigint;
      paymentMethod: import("../backend.d").Variant_easyPaisa_jazzCash;
      transactionReference: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitDepositRequest(amount, paymentMethod, transactionReference);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerDepositRequests"] });
    },
  });
}

export function useGetPaymentNumbers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["paymentNumbers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPaymentNumbers();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSetPaymentNumbers() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jazzCash, easyPaisa }: { jazzCash: string; easyPaisa: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setPaymentNumbers(jazzCash, easyPaisa);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paymentNumbers"] });
    },
  });
}

export function useGetCallerDepositRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["callerDepositRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerDepositRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetCallerWithdrawalRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["callerWithdrawalRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerWithdrawalRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetAllDepositRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["allDepositRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllDepositRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetAllWithdrawalRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["allWithdrawalRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllWithdrawalRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetPendingDepositRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["pendingDepositRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPendingDepositRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetPendingWithdrawalRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["pendingWithdrawalRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPendingWithdrawalRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useApproveDepositRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveDepositRequest(requestId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingDepositRequests"] });
      qc.invalidateQueries({ queryKey: ["allDepositRequests"] });
    },
  });
}

export function useRejectDepositRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectDepositRequest(requestId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingDepositRequests"] });
      qc.invalidateQueries({ queryKey: ["allDepositRequests"] });
    },
  });
}

export function useApproveWithdrawalRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveWithdrawalRequest(requestId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingWithdrawalRequests"] });
      qc.invalidateQueries({ queryKey: ["allWithdrawalRequests"] });
    },
  });
}

export function useRejectWithdrawalRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectWithdrawalRequest(requestId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingWithdrawalRequests"] });
      qc.invalidateQueries({ queryKey: ["allWithdrawalRequests"] });
    },
  });
}

export function useCreateTournament() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      categoryId: bigint;
      entryFee: bigint;
      prizePool: bigint;
      totalSlots: bigint;
      rules: string;
      prizeDistribution: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createTournament(
        params.title,
        params.categoryId,
        params.entryFee,
        params.prizePool,
        params.totalSlots,
        params.rules,
        params.prizeDistribution
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useCreateCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createCategory(name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function usePostScores() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tournamentId, scores }: { tournamentId: bigint; scores: Array<[Principal, bigint]> }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.postScores(tournamentId, scores);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leaderboard", vars.tournamentId.toString()] });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(user, role);
    },
  });
}
