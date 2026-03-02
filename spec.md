# Legend Arena - Free Fire Tournament App

## Current State

Full-stack Free Fire tournament app with:
- Internet Identity-based login, then email+password profile setup
- Legend ID auto-assigned (Nat, starts at 1, 4-digit padded display)
- Login via email+password stored in `accounts` map
- Admin identified by email `mrqlegendyt879@gmail.com` in frontend, plus `permanentOwner` principal in backend
- Registration form: Full Name, In-Game Name, Game UID, Mobile, Email, Password, Confirm Password, Refer Code, Privacy Policy

## Requested Changes (Diff)

### Add
- `loginByLegendId(legendId: Nat, passwordHash: Text)` backend function returning `{#ok: ExtendedUserProfile; #err: Text}`
- `getAccountByLegendId(legendId: Nat)` admin-only function to look up account by legend ID
- Admin's account is seeded at Legend ID = 1 (`#0001`) when first registered
- `nextLegendId` starts at 1 so first registered user gets Legend ID 1

### Modify
- `registerAccount`: legendId assignment stays sequential starting from 1 (no change needed to counter, already starts at 1)
- Legend ID 1 is the owner/admin -- frontend `useIsCallerAdmin` should check `legendId === 1n` instead of email
- `login` remains for backward compat but `loginByLegendId` is the primary login path
- Registration form: remove Email field, add "Legend ID" display-only field showing the auto-generated ID after registration; user registers with Full Name, In-Game Name, Game UID, Mobile, Password, Confirm Password, Refer Code
- Wait -- registration still needs an internal identifier. Email field stays on backend but is optional/auto-generated or user can provide it. Actually: keep email optional in registration (user may not enter one), the primary login credential is Legend ID + Password.
- Login screen: replace "Email Address" field with "Legend ID" field (numeric input, user enters their 4-digit number e.g. 0001)

### Remove
- Email-based admin check in `useIsCallerAdmin` -- replace with Legend ID 1 check
- Internet Identity requirement -- already removed in version 34+

## Implementation Plan

### Backend
1. Add `loginByLegendId(legendId: Nat, passwordHash: Text)` function that looks up account by legendId using `legendIdToEmail` map, then validates password
2. Keep `registerAccount` as-is (email still stored internally as unique key; if user doesn't provide email, generate a placeholder like `legendXXXX@arena.local`)
3. `nextLegendId` already starts at 1 -- first registrant gets Legend ID 1 (admin)
4. Add `isAdminByLegendId` check: if logged-in user's profile has `legendId == 1`, they are admin

### Frontend
1. **AuthPage**: 
   - Registration: keep all fields, make email optional (label "Email (Optional)"), show auto-generated Legend ID after signup
   - Login tab: replace email field with "Legend ID" field (user types 1, 2, 3... or full 0001 format), call `loginByLegendId`
2. **useLocalAuth**: store legendId in session, update login to use `loginByLegendId`
3. **useIsCallerAdmin**: check `currentUser.legendId === 1` (admin is always Legend ID #0001)
4. **ProfilePage**: Legend ID display stays same (already shows `#0001` format)
