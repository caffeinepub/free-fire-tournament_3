import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: bigint;
    user: Principal;
    txnType: Variant_deposit_withdrawal_tournamentEntry;
    timestamp: Time;
    amount: bigint;
}
export interface LeaderboardEntry {
    player: Principal;
    score: bigint;
    tournamentId: bigint;
}
export interface ExtendedUserProfile {
    inGameName: string;
    username: string;
    balance: bigint;
    legendId: bigint;
    referCode: string;
    mobileNo: string;
    fullName: string;
    email: string;
    gameUID: string;
}
export type Time = bigint;
export interface GlobalLeaderboardEntry {
    username: string;
    player: Principal;
    totalWinnings: bigint;
    totalScore: bigint;
}
export interface Tournament {
    id: bigint;
    categoryId: bigint;
    status: TournamentStatus;
    prizeDistribution: Array<bigint>;
    title: string;
    imageUrl: string;
    totalSlots: bigint;
    entryFee: bigint;
    slotsFilled: bigint;
    rules: string;
    prizePool: bigint;
}
export interface DepositRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    paymentMethod: Variant_easyPaisa_jazzCash;
    transactionReference: string;
    user: Principal;
    timestamp: Time;
    amount: bigint;
}
export interface WithdrawalRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    user: Principal;
    timestamp: Time;
    amount: bigint;
}
export interface PaymentNumbers {
    easyPaisa: string;
    jazzCash: string;
}
export interface Category {
    id: bigint;
    name: string;
}
export enum TournamentStatus {
    active = "active",
    upcoming = "upcoming",
    completed = "completed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_deposit_withdrawal_tournamentEntry {
    deposit = "deposit",
    withdrawal = "withdrawal",
    tournamentEntry = "tournamentEntry"
}
export enum Variant_easyPaisa_jazzCash {
    easyPaisa = "easyPaisa",
    jazzCash = "jazzCash"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addCoins(user: Principal, amount: bigint): Promise<void>;
    addCoinsByLegendId(legendId: bigint, amount: bigint): Promise<void>;
    approveDepositRequest(requestId: bigint): Promise<void>;
    approveWithdrawalRequest(requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(name: string): Promise<void>;
    createTournament(title: string, categoryId: bigint, entryFee: bigint, prizePool: bigint, totalSlots: bigint, rules: string, prizeDistribution: Array<bigint>, imageUrl: string): Promise<void>;
    getAllDepositRequests(): Promise<Array<DepositRequest>>;
    getAllUsers(): Promise<Array<[Principal, ExtendedUserProfile]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCallerDepositRequests(): Promise<Array<DepositRequest>>;
    getCallerJoinedSlot(tournamentId: bigint): Promise<bigint | null>;
    getCallerUserProfile(): Promise<ExtendedUserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCallerWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCategories(): Promise<Array<Category>>;
    getGlobalLeaderboard(): Promise<Array<GlobalLeaderboardEntry>>;
    getLeaderboard(tournamentId: bigint): Promise<Array<LeaderboardEntry>>;
    getPaymentNumbers(): Promise<PaymentNumbers>;
    getPendingDepositRequests(): Promise<Array<DepositRequest>>;
    getPendingWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getResetCode(): Promise<string>;
    getTakenSlots(tournamentId: bigint): Promise<Array<bigint>>;
    getTournament(id: bigint): Promise<Tournament | null>;
    getTournamentRoomDetails(tournamentId: bigint): Promise<{
        roomPassword: string;
        roomId: string;
    } | null>;
    getTournaments(): Promise<Array<Tournament>>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getUserByLegendId(legendId: bigint): Promise<[Principal, ExtendedUserProfile] | null>;
    getUserProfile(user: Principal): Promise<ExtendedUserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinTournament(tournamentId: bigint, slotNumber: bigint): Promise<void>;
    login(email: string, passwordHash: string): Promise<{
        __kind__: "ok";
        ok: ExtendedUserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    postScores(tournamentId: bigint, scores: Array<[Principal, bigint]>): Promise<void>;
    registerAccount(email: string, passwordHash: string, fullName: string, inGameName: string, gameUID: string, mobileNo: string, referCode: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerUser(fullName: string, inGameName: string, gameUID: string, mobileNo: string, email: string, referCode: string): Promise<void>;
    rejectDepositRequest(requestId: bigint): Promise<void>;
    rejectWithdrawalRequest(requestId: bigint): Promise<void>;
    removeCoinsByLegendId(legendId: bigint, amount: bigint): Promise<void>;
    resetPassword(email: string, resetCode: string, newPasswordHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: ExtendedUserProfile): Promise<void>;
    setPaymentNumbers(jazzCash: string, easyPaisa: string): Promise<void>;
    setResetCode(code: string): Promise<void>;
    setTournamentRoomDetails(tournamentId: bigint, roomId: string, roomPassword: string): Promise<void>;
    setUsername(username: string): Promise<void>;
    submitDepositRequest(amount: bigint, paymentMethod: Variant_easyPaisa_jazzCash, transactionReference: string): Promise<bigint>;
    submitWithdrawalRequest(amount: bigint): Promise<bigint>;
    updateUserInfo(fullName: string, inGameName: string, gameUID: string, mobileNo: string, email: string): Promise<void>;
}
