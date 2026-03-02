# Free Fire Tournament - Legend Arena

## Current State
- Full tournament app with categories (BR/CS/Lone Wolf), match cards, slot selection, wallet (JazzCash deposit), admin panel
- Legend ID based auth (email+password, Legend ID auto-assigned #0001, #0002...)
- Single global leaderboard showing top 100 by total score
- Backend stores accounts with email, passwordHash, profile (with legendId, balance, registrationTime missing)
- `getGlobalLeaderboard` returns aggregated scores across all tournaments

## Requested Changes (Diff)

### Add
- `registrationTime: Time.Time` field in `AccountInfo` type -- set to `Time.now()` on `registerAccount`
- `getOldestMembers(limit: Nat)` query -- returns top N members sorted by oldest registrationTime, returning `OldestMemberEntry` type with `legendId`, `username`, `inGameName`, `registrationTime`, `totalScore`
- `OldestMemberEntry` type in backend
- Frontend LeaderboardPage: 3 tabs -- "PRIME LEVEL" (win points / global scores, existing), "OLDEST MEMBER" (by registration date, oldest first), "GLOBAL RANKINGS" (wins count)
- Each "Oldest Member" row shows: rank, username/inGameName, Legend ID badge, and "X days/months/years ago" account age badge
- Login auto-refresh: after successful login (setCurrentUser called), trigger a window.location.reload() or queryClient.invalidateQueries so the app state refreshes immediately

### Modify
- `registerAccount` backend function: add `registrationTime = Time.now()` to AccountInfo creation
- LeaderboardPage.tsx: replace single list with 3 tabs (Prime Level, Oldest Member, Global Rankings)
- AuthPage.tsx: after setCurrentUser succeeds on login, call window.location.reload() to force fresh load

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend with registrationTime in AccountInfo, getOldestMembers query, OldestMemberEntry type
2. Update backend.d.ts accordingly  
3. Update LeaderboardPage.tsx with 3 tabs
4. Update AuthPage.tsx with auto-refresh after login
5. Build and deploy
