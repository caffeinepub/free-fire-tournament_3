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
export interface backendInterface {
    addCoins(user: Principal, amount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(name: string): Promise<void>;
    createTournament(title: string, categoryId: bigint, entryFee: bigint, prizePool: bigint, totalSlots: bigint, rules: string, prizeDistribution: Array<bigint>): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getLeaderboard(tournamentId: bigint): Promise<Array<LeaderboardEntry>>;
    getTakenSlots(tournamentId: bigint): Promise<Array<bigint>>;
    getTournament(id: bigint): Promise<Tournament | null>;
    getTournaments(): Promise<Array<Tournament>>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinTournament(tournamentId: bigint, slotNumber: bigint): Promise<void>;
    postScores(tournamentId: bigint, scores: Array<[Principal, bigint]>): Promise<void>;
    requestWithdrawal(amount: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setUsername(username: string): Promise<void>;
}
