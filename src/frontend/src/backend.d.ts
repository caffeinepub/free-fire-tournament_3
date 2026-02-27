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
export interface Category {
    id: bigint;
    name: string;
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
export interface UserProfile {
    username: string;
    balance: bigint;
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
    approveDepositRequest(requestId: bigint): Promise<void>;
    approveWithdrawalRequest(requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(name: string): Promise<void>;
    createTournament(title: string, categoryId: bigint, entryFee: bigint, prizePool: bigint, totalSlots: bigint, rules: string, prizeDistribution: Array<bigint>): Promise<void>;
    getAllDepositRequests(): Promise<Array<DepositRequest>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCallerDepositRequests(): Promise<Array<DepositRequest>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCallerWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCategories(): Promise<Array<Category>>;
    getGlobalLeaderboard(): Promise<Array<GlobalLeaderboardEntry>>;
    getLeaderboard(tournamentId: bigint): Promise<Array<LeaderboardEntry>>;
    getPaymentNumbers(): Promise<PaymentNumbers>;
    getPendingDepositRequests(): Promise<Array<DepositRequest>>;
    getPendingWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getTakenSlots(tournamentId: bigint): Promise<Array<bigint>>;
    getTournament(id: bigint): Promise<Tournament | null>;
    getTournaments(): Promise<Array<Tournament>>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinTournament(tournamentId: bigint, slotNumber: bigint): Promise<void>;
    postScores(tournamentId: bigint, scores: Array<[Principal, bigint]>): Promise<void>;
    rejectDepositRequest(requestId: bigint): Promise<void>;
    rejectWithdrawalRequest(requestId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPaymentNumbers(jazzCash: string, easyPaisa: string): Promise<void>;
    setUsername(username: string): Promise<void>;
    submitDepositRequest(amount: bigint, paymentMethod: Variant_easyPaisa_jazzCash, transactionReference: string): Promise<bigint>;
    submitWithdrawalRequest(amount: bigint): Promise<bigint>;
}
