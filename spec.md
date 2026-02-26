# Free Fire Tournament

## Current State
- Bottom nav has 3 items: Home, Wallet, Profile
- Leaderboard exists only per-tournament (inside MatchDetailPage as a side tab)
- No global leaderboard page/route
- Backend has `getLeaderboard(tournamentId)` (per-tournament scores) but no global ranking

## Requested Changes (Diff)

### Add
- New `/leaderboard` route and `LeaderboardPage` component showing Top 100 players globally
- Backend `getGlobalLeaderboard` query that aggregates all leaderboard entries per player (total score across all tournaments) and returns top 100 sorted by total score descending, with username included
- New `useGetGlobalLeaderboard` query hook
- Leaderboard nav item (Trophy icon) in BottomNav, placed **between** Wallet and Profile

### Modify
- `BottomNav.tsx`: Insert Leaderboard nav item between Wallet and Profile (4 items total: Home, Wallet, Leaderboard, Profile)
- `App.tsx`: Add `/leaderboard` route pointing to LeaderboardPage
- `useQueries.ts`: Add `useGetGlobalLeaderboard` hook

### Remove
- Nothing removed

## Implementation Plan
1. Add `getGlobalLeaderboard` to backend — returns array of `{ player: Principal, username: Text, totalScore: Nat, totalWinnings: Nat }` sorted by totalScore desc, capped at 100
2. Regenerate backend bindings
3. Add `useGetGlobalLeaderboard` hook to `useQueries.ts`
4. Create `src/frontend/src/pages/LeaderboardPage.tsx` — ranked list with rank badge, username, total score/winnings
5. Update `BottomNav.tsx` — add Trophy icon between Wallet and Profile
6. Update `App.tsx` — add leaderboardRoute

## UX Notes
- Leaderboard icon: Trophy (lucide-react)
- Top 3 players get gold/silver/bronze rank badges
- Show rank number, username, total winnings (coins), total score
- Loading skeleton while fetching
- Empty state if no scores posted yet
