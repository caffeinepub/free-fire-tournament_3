import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { UserRole } from "../backend.d";
import { useActor } from "./useActor";
import { useLocalAuth } from "./useLocalAuth";

const actorRetry = (failureCount: number, error: unknown) => {
  if (error instanceof Error && error.message === "Actor not available") {
    return failureCount < 3;
  }
  return false;
};

/** Returns true if an error is an auth/anonymous-caller error from the backend */
function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("anonymous") ||
    lower.includes("unauthorized") ||
    lower.includes("only users") ||
    lower.includes("access denied") ||
    lower.includes("not authorized")
  );
}

const actorRetryDelay = (attempt: number) => Math.min(500 * 2 ** attempt, 5000);

// ─── User Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const [timedOut, setTimedOut] = useState(false);

  // After 6 seconds, stop blocking the app on actor loading — always show content
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerUserProfile();
      } catch (err) {
        if (isAuthError(err)) {
          return null; // Gracefully return null rather than crashing the page
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      // Always retry actor-not-available errors
      if (error instanceof Error && error.message === "Actor not available") {
        return failureCount < 5;
      }
      // Don't retry auth errors — they won't resolve by retrying
      if (isAuthError(error)) return false;
      // Retry other errors too (backend may be initializing)
      return failureCount < 3;
    },
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // If timed out, pretend we're no longer loading so the app always shows content
  const isLoading = timedOut ? false : actorFetching || query.isLoading;
  // After timeout, also suppress error so profile page renders (just with empty data)
  const isError = timedOut ? false : query.isError;

  return {
    ...query,
    isLoading,
    isError,
    isFetched: timedOut ? true : !!actor && query.isFetched,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
  });
}

const ADMIN_LEGEND_ID = 1;

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { currentUser } = useLocalAuth();

  return useQuery({
    queryKey: ["isCallerAdmin", currentUser?.legendId ?? ""],
    queryFn: async () => {
      // Check if the logged-in user is the owner by legendId (#0001)
      if (currentUser?.legendId === ADMIN_LEGEND_ID) {
        return true;
      }

      // Try the backend call if actor is available
      if (actor) {
        try {
          return await actor.isCallerAdmin();
        } catch {
          return false;
        }
      }

      return false;
    },
    enabled: !actorFetching,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function useGetLeaderboard(tournamentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null)
        throw new Error("Actor not available");
      return actor.getLeaderboard(tournamentId);
    },
    enabled: !!actor && !actorFetching && tournamentId !== null,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useGetTakenSlots(tournamentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["takenSlots", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null)
        throw new Error("Actor not available");
      return actor.getTakenSlots(tournamentId);
    },
    enabled: !!actor && !actorFetching && tournamentId !== null,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
  });
}

// ─── Wallet / Transactions ────────────────────────────────────────────────────

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["transactionHistory"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getTransactionHistory();
      } catch (err) {
        if (isAuthError(err)) return null;
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return actorRetry(failureCount, error);
    },
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      balance,
      fullName = "",
      inGameName = "",
      gameUID = "",
      mobileNo = "",
      email = "",
      referCode = "",
      legendId = 0n,
    }: {
      username: string;
      balance: bigint;
      fullName?: string;
      inGameName?: string;
      gameUID?: string;
      mobileNo?: string;
      email?: string;
      referCode?: string;
      legendId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile({
        username,
        balance,
        fullName,
        inGameName,
        gameUID,
        mobileNo,
        email,
        referCode,
        legendId,
      });
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
    mutationFn: async ({
      tournamentId,
      slotNumber,
    }: { tournamentId: bigint; slotNumber: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.joinTournament(tournamentId, slotNumber);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({
        queryKey: ["tournament", vars.tournamentId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["takenSlots", vars.tournamentId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["transactionHistory"] });
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({
        queryKey: ["callerJoinedSlot", vars.tournamentId.toString()],
      });
    },
  });
}

export function useAddCoins() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      amount,
    }: { user: Principal; amount: bigint }) => {
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
      return actor.submitDepositRequest(
        amount,
        paymentMethod,
        transactionReference,
      );
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
  });
}

export function useSetPaymentNumbers() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jazzCash,
      easyPaisa,
    }: { jazzCash: string; easyPaisa: string }) => {
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
      try {
        return await actor.getCallerDepositRequests();
      } catch (err) {
        if (isAuthError(err)) return null;
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return actorRetry(failureCount, error);
    },
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useGetCallerWithdrawalRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["callerWithdrawalRequests"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerWithdrawalRequests();
      } catch (err) {
        if (isAuthError(err)) return null;
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return actorRetry(failureCount, error);
    },
    retryDelay: actorRetryDelay,
    refetchInterval: 15000,
    staleTime: 10000,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 30000,
    staleTime: 15000,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 30000,
    staleTime: 15000,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 30000,
    staleTime: 15000,
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
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 30000,
    staleTime: 15000,
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
      imageUrl?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createTournament(
        params.title,
        params.categoryId,
        params.entryFee,
        params.prizePool,
        params.totalSlots,
        params.rules,
        params.prizeDistribution,
        params.imageUrl ?? "",
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
    mutationFn: async ({
      tournamentId,
      scores,
    }: { tournamentId: bigint; scores: Array<[Principal, bigint]> }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.postScores(tournamentId, scores);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["leaderboard", vars.tournamentId.toString()],
      });
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

export function useRegisterUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fullName: string;
      inGameName: string;
      gameUID: string;
      mobileNo: string;
      email: string;
      referCode: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.registerUser(
        params.fullName,
        params.inGameName,
        params.gameUID,
        params.mobileNo,
        params.email,
        params.referCode,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useUpdateUserInfo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fullName: string;
      inGameName: string;
      gameUID: string;
      mobileNo: string;
      email: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateUserInfo(
        params.fullName,
        params.inGameName,
        params.gameUID,
        params.mobileNo,
        params.email,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Legend ID ───────────────────────────────────────────────────────────────

export function useAddCoinsByLegendId() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      legendId,
      amount,
    }: { legendId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addCoinsByLegendId(legendId, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useRemoveCoinsByLegendId() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      legendId,
      amount,
    }: { legendId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeCoinsByLegendId(legendId, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useGetUserByLegendId() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (legendId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.getUserByLegendId(legendId);
    },
  });
}

// ─── Reset Code (Admin) ───────────────────────────────────────────────────────

export function useGetResetCode() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["resetCode"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getResetCode();
    },
    enabled: !!actor && !actorFetching,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
  });
}

export function useSetResetCode() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setResetCode(code);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resetCode"] });
    },
  });
}

// ─── Tournament Room Details ──────────────────────────────────────────────────

export function useGetCallerJoinedSlot(tournamentId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useLocalAuth();
  return useQuery({
    queryKey: ["callerJoinedSlot", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null)
        throw new Error("Actor not available");
      return actor.getCallerJoinedSlot(tournamentId);
    },
    enabled:
      !!actor && !actorFetching && tournamentId !== null && isAuthenticated,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useGetTournamentRoomDetails(
  tournamentId: bigint | null,
  hasJoined: boolean,
) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated } = useLocalAuth();
  return useQuery({
    queryKey: ["tournamentRoomDetails", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null)
        throw new Error("Actor not available");
      return actor.getTournamentRoomDetails(tournamentId);
    },
    enabled:
      !!actor &&
      !actorFetching &&
      tournamentId !== null &&
      isAuthenticated &&
      hasJoined,
    retry: actorRetry,
    retryDelay: actorRetryDelay,
  });
}

export function useSetTournamentRoomDetails() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tournamentId,
      roomId,
      roomPassword,
    }: { tournamentId: bigint; roomId: string; roomPassword: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setTournamentRoomDetails(tournamentId, roomId, roomPassword);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["tournamentRoomDetails", vars.tournamentId.toString()],
      });
    },
  });
}

// ─── Legend ID Auth ───────────────────────────────────────────────────────────

export function useLoginByLegendId() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      legendId,
      passwordHash,
    }: { legendId: bigint; passwordHash: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.loginByLegendId(legendId, passwordHash);
    },
  });
}

export function useResetPasswordByLegendId() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      legendId,
      resetCode,
      newPasswordHash,
    }: { legendId: bigint; resetCode: string; newPasswordHash: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.resetPasswordByLegendId(
        legendId,
        resetCode,
        newPasswordHash,
      );
    },
  });
}
