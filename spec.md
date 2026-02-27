# Free Fire Tournament

## Current State
App uses Internet Identity for authentication. Users are identified by Principal ID. Profile page shows username, balance, tournaments, and a "COPY MY ID" button. No custom registration form exists.

## Requested Changes (Diff)

### Add
- Custom registration form with fields: Full Name, In-Game Name, Game UID (optional), Mobile No. (+92 prefix), Email Address, Password, Confirm Password, Refer Code (optional), Privacy Policy checkbox
- Login form with Email + Password
- User profile extended to store: fullName, inGameName, gameUID, mobileNo, email, referCode
- Backend: register user with email/password (hashed), login returns session token stored in profile
- Admin can view all registered users with their details (fullName, email, mobileNo, inGameName, gameUID)

### Modify
- Auth flow: replace Internet Identity login screen with custom Email/Password login + Register screen
- Keep Internet Identity as the underlying identity mechanism but show a custom UI form on top -- store registration data linked to Principal
- Profile page: show fullName, inGameName, gameUID, mobileNo, email fields (editable)
- Admin Panel: add "Users" section listing all registered users with their info

### Remove
- Nothing removed

## Implementation Plan
1. Extend UserProfile backend type to include fullName, inGameName, gameUID, mobileNo, email, referCode fields
2. Add registerUser function that saves extended profile
3. Add getUsersList for admin to view all users
4. Update AuthPage to show custom Register/Login forms (still uses Internet Identity under the hood for identity, but collects user info on first login)
5. Update ProfilePage to show and allow editing of extended profile fields
6. Update AdminPage to show Users tab with all registered users

## UX Notes
- Registration form style: dark background, orange accents (matching existing app theme)
- Mobile No. field has +92 prefix (Pakistan)
- Password field has show/hide toggle
- "Already have an Account" link at bottom
- On successful registration, user is taken to Home page
- Internet Identity login still happens silently in background (needed for ICP) -- custom form collects display info
