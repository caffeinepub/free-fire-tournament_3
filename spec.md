# Free Fire Tournament App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Home screen with top category bar (BR, Clash Squad, Lone Wolf) -- admin can add more categories
- Match cards showing Entry Fee, Total Winning Prize, Available Slots
- Match Detail page with Join button, Rules section, Prize Distribution breakdown
- Slot Selection grid (players pick a specific slot number)
- Leaderboard tab/section showing ranked players per tournament
- User Sign-in / Sign-up system (authentication)
- User Profile page
- Wallet system: deposit, withdraw, transaction history
- Mobile-first responsive layout (PWA-ready so it works like an app on smartphones)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend:
   - Authorization (user accounts, roles: admin/player)
   - Tournament/Match data: id, title, category, entryFee, prizePool, totalSlots, filledSlots, rules, prizeDistribution[]
   - Category management: id, name (admin can add)
   - Slot selection: tournamentId + slotNumber -> userId mapping
   - Wallet: balance per user, deposit/withdraw transactions with history
   - Leaderboard: per-tournament ranking (wins, points)
   - Join tournament: deduct entry fee, assign slot

2. Frontend:
   - Layout: bottom nav bar (Home, Tournaments, Wallet, Profile)
   - Home: category tab bar at top, scrollable match cards grid
   - Match card: title, category badge, entry fee, prize pool, slots available
   - Match Detail page: join button, rules accordion, prize table, slot grid, leaderboard side tab
   - Auth pages: Sign In, Sign Up
   - Wallet page: balance display, deposit/withdraw buttons, transaction history list
   - Profile page: username, stats, edit profile
   - Mobile-first design, PWA manifest for "Add to Home Screen" (closest to APK on web)

## UX Notes
- Mobile-first, full-width card layouts for small screens
- Bright gaming aesthetic (dark background, neon accent colors matching Free Fire style)
- Category tabs should be horizontally scrollable
- Slot grid should show taken vs. available slots clearly (color-coded)
- Wallet balance prominently visible in the header/profile
- PWA support: manifest.json + service worker so users can install to home screen on Android (acts like APK)
