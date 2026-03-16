# AttendEase — JWT + Auth Flow
## From Login to Token to Every Request to Logout

> **Document Type:** Architecture + Team Reference
> **Audience:** Engineering team, Security reviewer, Future contributors
> **Status:** PLANNING — Locked Decisions
> **Last Updated:** March 2026

---

## Table of Contents

1. [Why JWT — The Core Reasoning](#1-why-jwt)
2. [How JWT Works — The Anatomy](#2-how-jwt-works)
3. [The Two Token System — Access + Refresh](#3-the-two-token-system)
4. [The Three Token Types in AttendEase](#4-the-three-token-types)
5. [Token Storage Strategy — Web vs Mobile](#5-token-storage-strategy)
6. [The Login Flow — Step by Step](#6-the-login-flow)
7. [The Request Authentication Flow](#7-the-request-authentication-flow)
8. [The Token Refresh Flow](#8-the-token-refresh-flow)
9. [Refresh Token Rotation — Why and How](#9-refresh-token-rotation)
10. [Single Device Policy — Kicking Out Old Sessions](#10-single-device-policy)
11. [Mobile Offline Auth — The Queued Check-in Strategy](#11-mobile-offline-auth)
12. [Organisation Suspension Mid-Session](#12-organisation-suspension-mid-session)
13. [The Logout Flow](#13-the-logout-flow)
14. [Impersonation Token — Super Admin Support Flow](#14-impersonation-token)
15. [The orgGuard Middleware — Multi-Tenancy Enforcement](#15-the-orgguard-middleware)
16. [Security Decisions + Threat Model](#16-security-decisions--threat-model)
17. [Token Lifecycle Summary](#17-token-lifecycle-summary)
18. [Database Tables for Auth](#18-database-tables-for-auth)
19. [Glossary](#19-glossary)

---

## 1. Why JWT

Before designing the system, understand why JWT was chosen over the alternative — **server-side sessions.**

### Server-Side Sessions (The Alternative)

Traditional approach: when a user logs in, the server creates a session record in the database. A session ID is given to the client. On every request, the client sends the session ID, the server looks it up in the database, fetches the user data, then processes the request.

```
Client                    Server                  Database
  │                          │                        │
  │── POST /login ──────────►│                        │
  │                          │── INSERT session ─────►│
  │                          │◄── session_id ─────────│
  │◄── session_id ───────────│                        │
  │                          │                        │
  │── GET /employees ────────│                        │
  │   (sends session_id)     │── SELECT session ─────►│
  │                          │◄── user data ──────────│
  │                          │  (process request)     │
  │◄── response ─────────────│                        │
```

**Problem for AttendEase:** Every single API request requires a database lookup just to authenticate. With 10,000 employees doing 2 check-ins/day plus admin activity, this adds millions of unnecessary DB queries per month.

### JWT (The Chosen Approach)

JWT embeds the user's identity directly inside the token. The server verifies the token mathematically — no database lookup required.

```
Client                    Server                  Database
  │                          │                        │
  │── POST /login ──────────►│                        │
  │                          │── SELECT user ─────────►│
  │                          │◄── user found ──────────│
  │                          │  (sign JWT — no DB write)
  │◄── JWT token ────────────│                        │
  │                          │                        │
  │── GET /employees ────────│                        │
  │   (sends JWT)            │  (verify signature     │
  │                          │   mathematically —     │
  │                          │   ZERO DB calls)       │
  │◄── response ─────────────│                        │
```

**The trade-off accepted:** JWTs cannot be instantly revoked (explained in Section 16). For AttendEase, the 15-minute access token expiry makes this acceptable.

---

## 2. How JWT Works — The Anatomy

A JWT is a string of three Base64-encoded parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJ1c2VySWQiOiJ1dWlkIiwib3JnSWQiOiJ1dWlkIiwicm9sZSI6ImVtcGxveWVlIn0
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Part 1 — Header

Decoded:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

`alg: HS256` means HMAC-SHA256 — a signing algorithm that uses a secret key.

### Part 2 — Payload (The Claims)

Decoded:
```json
{
  "userId": "uuid",
  "orgId": "uuid",
  "role": "employee",
  "branchId": "uuid",
  "iat": 1709625420,
  "exp": 1709626320
}
```

This is what the server reads to know WHO is making the request, from which org, with what role — without touching the database.

`iat` = issued at (Unix timestamp)
`exp` = expires at (Unix timestamp — 15 minutes after `iat`)

### Part 3 — Signature

```
HMACSHA256(
  base64(header) + "." + base64(payload),
  SECRET_KEY
)
```

The signature is computed using your server's `JWT_SECRET` environment variable. Only your server knows this key. This means:

- **Tampering detection:** If anyone modifies the payload (e.g., changes `role: "employee"` to `role: "admin"`), the signature no longer matches — the server rejects it.
- **Forgery prevention:** Without the `JWT_SECRET`, nobody can create a valid token.

### What JWT Does NOT Do

JWT does **not** encrypt the payload. The payload is Base64-encoded, not encrypted — anyone can decode it and read the contents. **Never put sensitive data in a JWT payload** — no passwords, no face embeddings, no personal data beyond what's necessary for auth.

AttendEase JWT payload contains only: userId, orgId, role, branchId, timestamps. Nothing sensitive.

---

## 3. The Two Token System — Access + Refresh

AttendEase uses two tokens with different purposes and lifetimes.

### Access Token

```
Purpose:    Authenticate every API request
Expiry:     15 minutes
Storage:    In memory only (never persisted to disk)
Sent on:    Every request in Authorization header
DB record:  None — verified mathematically
```

Short expiry means if a token is stolen, the attacker's window is at most 15 minutes. After that, the token is worthless.

### Refresh Token

```
Purpose:    Obtain a new access token when current one expires
Expiry:     Until explicit logout (no time limit)
Storage:    Secure persistent storage (HttpOnly cookie / SecureStore)
Sent on:    Only to POST /auth/refresh endpoint
DB record:  YES — stored in refresh_tokens table
            (this is the only way to invalidate it)
```

The refresh token lives as long as the user stays logged in. It is the "remember me" mechanism — the user doesn't re-enter their password every 15 minutes because the refresh token silently fetches a new access token behind the scenes.

### Why Two Tokens Instead of One Long-Lived Token

```
One long-lived token (e.g., 30 days):
  Stolen token → attacker has 30 days of access
  No way to revoke without a database check on every request

Two tokens (15 min access + refresh until logout):
  Stolen access token → useless in 15 minutes
  Stolen refresh token → can be detected via rotation
                         (explained in Section 9)
  Revoke by deleting refresh token from DB → effective
  immediately on next refresh attempt
```

---

## 4. The Three Token Types in AttendEase

Three distinct user types exist. Each gets a different JWT payload.

### Type 1 — Employee Token

```json
{
  "userId": "emp-uuid",
  "orgId": "org-uuid",
  "role": "employee",
  "branchId": "branch-uuid",
  "shiftId": "shift-uuid",
  "iat": 1709625420,
  "exp": 1709626320
}
```

**Access:** Own profile, own attendance, own leaves, own notifications.
**Cannot access:** Other employees' data, admin routes, other orgs.

The `branchId` and `shiftId` are included because they are needed on nearly every check-in request — avoids a DB lookup per check-in just to find the employee's branch.

---

### Type 2 — Org Admin Token

```json
{
  "userId": "admin-uuid",
  "orgId": "org-uuid",
  "role": "admin",
  "iat": 1709625420,
  "exp": 1709626320
}
```

**Access:** All employees in their org, all attendance/leave/shift/branch data for their org.
**Cannot access:** Other orgs' data, Super Admin routes.

No `branchId` — admins manage all branches, not scoped to one.

---

### Type 3 — Super Admin Token

```json
{
  "userId": "superadmin-uuid",
  "orgId": null,
  "role": "superadmin",
  "iat": 1709625420,
  "exp": 1709626320
}
```

**Access:** All orgs, all data, all Super Admin routes.
**`orgId: null`** is the critical marker — the `orgGuard` middleware sees `null` and bypasses org scoping entirely.

Super Admin accounts live in a separate `superadmins` table — never in the `employees` table.

---

### Type 4 — Impersonation Token (Special Case)

```json
{
  "userId": "admin-uuid",
  "orgId": "org-uuid",
  "role": "admin",
  "isImpersonated": true,
  "impersonatedBy": "superadmin-uuid",
  "impersonationSessionId": "session-uuid",
  "iat": 1709625420,
  "exp": 1709627220
}
```

**Expiry:** 30 minutes (hard coded — no refresh allowed)
**`isImpersonated: true`** — every middleware sees this flag.
**Every DB write during impersonation** is tagged with `impersonated_by` in audit logs.
**Cannot be refreshed** — when 30 minutes expire, Super Admin must re-authenticate.

Covered in full detail in Section 14.

---

## 5. Token Storage Strategy — Web vs Mobile

Where you store tokens is a security decision, not a convenience decision.

### Web (Admin Dashboard + Super Admin Portal)

```
Access Token:
  Storage: JavaScript memory (a variable in Redux store)
  Why: Never touches disk. If the tab closes, token is gone.
       XSS attack can steal cookies but NOT memory variables
       if the script runs in a sandboxed context.
  Risk: Lost on page refresh → fixed by refresh token

Refresh Token:
  Storage: HttpOnly cookie
  Why: HttpOnly means JavaScript CANNOT read this cookie.
       Even if an XSS attack injects malicious JS into your
       page, it cannot steal the refresh token.
       Only the browser sends it automatically on requests
       to the /auth/refresh endpoint.
  Flag: Secure=true (HTTPS only), SameSite=Strict
```

### Mobile (React Native + Expo)

```
Access Token:
  Storage: Zustand store (in-memory)
  Why: Same reasoning as web — memory only, not persisted.
       Lost when app is killed → refresh token handles this.

Refresh Token:
  Storage: expo-secure-store
  Why: expo-secure-store uses:
       iOS    → Keychain (hardware-backed encryption)
       Android → Keystore (hardware-backed encryption)
  This is the most secure storage available on mobile.
  NOT AsyncStorage — that is plain text on disk, unacceptable
  for a token with no expiry date.
```

### What NOT to Use and Why

| Storage | Platform | Problem |
|---|---|---|
| `localStorage` | Web | Readable by any JS — XSS steals it trivially |
| `sessionStorage` | Web | Same XSS problem |
| `AsyncStorage` | Mobile | Plain text file on device — readable if device is rooted |
| Regular cookie | Web | Readable by JS unless HttpOnly — XSS risk |
| Hardcoded in code | Any | Visible in source — never do this |

---

## 6. The Login Flow — Step by Step

```
EMPLOYEE OPENS APP AND LOGS IN

Employee enters email + password + FCM token sent to:
POST /api/v1/auth/login

                    BACKEND
                       │
                       ▼
          ┌────────────────────────┐
          │  1. Validate request   │
          │  express-validator:    │
          │  email format, pwd     │
          │  min length            │
          └────────────┬───────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │  2. Find user in DB    │
          │  SELECT from employees │
          │  WHERE email = ?       │
          │  AND org_id scoped     │
          │  (for admin login,     │
          │   org resolved from    │
          │   subdomain/slug)      │
          └────────────┬───────────┘
                       │
              User not found?
                       │ Yes → AUTH_006
                       │ No  ↓
          ┌────────────────────────┐
          │  3. bcrypt.compare()   │
          │  Compare submitted pwd │
          │  against stored hash   │
          └────────────┬───────────┘
                       │
              Passwords don't match?
                       │ Yes → AUTH_006
                       │       (same error as not found
                       │        — never reveal which)
                       │ No  ↓
          ┌────────────────────────┐
          │  4. Check account      │
          │  status                │
          │                        │
          │  status = inactive?    │──► AUTH_007
          │  org suspended?        │──► AUTH_009
          │  too many failures?    │──► AUTH_008
          └────────────┬───────────┘
                       │ All clear ↓
          ┌────────────────────────┐
          │  5. Invalidate old     │
          │  device session        │
          │                        │
          │  Single device policy: │
          │  DELETE from           │
          │  refresh_tokens WHERE  │
          │  emp_id = ? AND        │
          │  device_id != current  │
          │                        │
          │  FCM: send "logged out │
          │  on another device"    │
          │  push to old device    │
          └────────────┬───────────┘
                       │
          ┌────────────────────────┐
          │  6. Generate tokens    │
          │                        │
          │  accessToken  = JWT    │
          │  signed with secret    │
          │  exp: now + 15 min     │
          │                        │
          │  refreshToken = JWT    │
          │  signed with separate  │
          │  refresh secret        │
          │  exp: none (unlimited) │
          └────────────┬───────────┘
                       │
          ┌────────────────────────┐
          │  7. Store refresh      │
          │  token in DB           │
          │                        │
          │  INSERT refresh_tokens │
          │  (token_hash, emp_id,  │
          │   device_id, org_id,   │
          │   created_at)          │
          │                        │
          │  Store hash not raw    │
          │  token — bcrypt hash   │
          └────────────┬───────────┘
                       │
          ┌────────────────────────┐
          │  8. Register FCM token │
          │                        │
          │  UPSERT device_tokens  │
          │  (emp_id, fcm_token,   │
          │   device_id)           │
          └────────────┬───────────┘
                       │
                       ▼
          Return 200 with:
          { accessToken, refreshToken,
            expiresIn: 900, user: {...} }
```

### Why We Hash the Refresh Token in DB

The refresh token stored in DB is a **bcrypt hash**, not the raw token.

If an attacker breaches your database, they get hashes — useless without the original token. The raw token only ever exists in the client's SecureStore and in transit over HTTPS.

This mirrors how passwords are stored — you never store the raw value, only a hash.

---

## 7. The Request Authentication Flow

Every protected API request goes through the `auth` middleware before reaching any controller.

```
REQUEST ARRIVES AT BACKEND

Authorization: Bearer eyJhbGci...

                    AUTH MIDDLEWARE
                          │
                          ▼
          ┌───────────────────────────────┐
          │  1. Extract token             │
          │  header.split(' ')[1]         │
          │  No header? → AUTH_001        │
          └───────────────┬───────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │  2. jwt.verify(token, secret) │
          │                               │
          │  Invalid signature? → AUTH_003│
          │  Token expired?    → AUTH_002 │
          │  Malformed?        → AUTH_003 │
          └───────────────┬───────────────┘
                          │ Valid ↓
          ┌───────────────────────────────┐
          │  3. Extract payload           │
          │                               │
          │  req.user = {                 │
          │    userId, orgId,             │
          │    role, branchId             │
          │  }                            │
          └───────────────┬───────────────┘
                          │
                          ▼
                    ORGUARD MIDDLEWARE
                          │
                          ▼
          ┌───────────────────────────────┐
          │  4. orgId check               │
          │                               │
          │  orgId = null AND             │
          │  role = superadmin?           │
          │  → bypass org scoping         │
          │                               │
          │  orgId present?               │
          │  → req.orgId = payload.orgId  │
          │  → ALL DB queries use this    │
          └───────────────┬───────────────┘
                          │
                          ▼
                    ROLE GUARD
          ┌───────────────────────────────┐
          │  5. Route requires ADMIN?     │
          │  role = employee? → AUTH_004  │
          │                               │
          │  Route requires SUPERADMIN?   │
          │  role = admin? → AUTH_004     │
          └───────────────┬───────────────┘
                          │ All checks pass ↓
                          ▼
                    CONTROLLER
                    (request processed)
```

### The Critical Security Property

Notice that `org_id` **never comes from the request body or query params.** It comes exclusively from the verified JWT payload, injected by `orgGuard`.

```
❌ WRONG (vulnerable):
   GET /employees?orgId=some-other-org-uuid
   → attacker can access any org's data

✅ CORRECT (AttendEase):
   GET /employees
   → orgId comes from JWT → always the authenticated org
   → attacker cannot change their own JWT without
     invalidating the signature
```

This is the architectural guarantee of multi-tenancy security.

---

## 8. The Token Refresh Flow

Access tokens expire every 15 minutes. The refresh flow happens **silently** — the user never sees a login screen.

### Web (Axios Interceptor)

Axios interceptors allow you to intercept a failed response before it reaches your application code.

```
API Request made
       │
       ▼
Response received
       │
  Status 401?  (AUTH_002 — token expired)
       │ No  → return response to app normally
       │ Yes ↓
       ▼
Axios interceptor catches 401
       │
       ▼
POST /auth/refresh
  { refreshToken: (from memory) }
       │
  Refresh failed? (token invalid/revoked)
       │ Yes → redirect to login screen
       │ No  ↓
       ▼
New accessToken received
       │
       ▼
Store new accessToken in Redux
       │
       ▼
Retry original failed request
with new accessToken
       │
       ▼
Return response to app
(app never knew the refresh happened)
```

The user experience: seamless. They're editing an employee record, the access token expires mid-session, the interceptor silently refreshes it, and the save request completes normally. No interruption.

### Mobile (Zustand + Axios Interceptor)

Same pattern as web. The difference:
- Refresh token read from `expo-secure-store` (not memory)
- New access token stored in Zustand (not Redux)
- If offline during refresh attempt → offline flow triggers (Section 11)

### What Happens When Refresh Itself Fails

```
Refresh token invalid   → AUTH_003 → Force logout, redirect to login
Refresh token revoked   → AUTH_003 → Force logout (security event logged)
Org suspended           → AUTH_009 → Show "account suspended" screen
Network unreachable     → Offline flow (Section 11)
```

---

## 9. Refresh Token Rotation — Why and How

### The Problem Rotation Solves

Without rotation, a single stolen refresh token gives an attacker permanent access (since our refresh tokens never expire until logout). They can silently keep generating new access tokens indefinitely.

With rotation, **every time a refresh token is used, it is replaced with a new one.** The old token is immediately invalidated.

### How It Works

```
State:  DB has refresh_token_A for Employee Rahul

Employee's phone calls POST /auth/refresh
with refresh_token_A
         │
         ▼
Backend:
  1. Verify refresh_token_A hash exists in DB
  2. Generate new access_token
  3. Generate new refresh_token_B
  4. DELETE refresh_token_A from DB
  5. INSERT refresh_token_B into DB
  6. Return { accessToken, refreshToken: token_B }

State:  DB now has refresh_token_B
        token_A is gone — permanently invalid
```

### The Reuse Detection — Catching Token Theft

Here is where rotation becomes a **theft detection mechanism.**

```
ATTACK SCENARIO:
  Attacker steals refresh_token_A from Rahul's phone

  Rahul's phone uses token_A → gets token_B
  (token_A is now deleted from DB)

  Later: Attacker tries to use stolen token_A
  Backend: token_A not found in DB → AUTH_003

  The attacker is blocked.
  But we don't know Rahul was compromised yet.
```

```
ADVANCED REUSE DETECTION:
  Instead of simply deleting old tokens,
  mark them as "used":

  refresh_tokens table:
    token_hash | status  | used_at
    hash_A     | used    | 2026-03-05T09:15:00
    hash_B     | active  | null

  If hash_A is presented again:
  Backend sees: status = 'used'
  This means someone is using a token that was
  already rotated → TOKEN THEFT DETECTED

  Response:
    1. Revoke ALL refresh tokens for this employee
       (force full re-login)
    2. Send security alert notification to employee
    3. Log security event in audit_logs
    4. Notify org admin
```

This is the difference between "blocking the attacker" and "detecting the attack and protecting the victim."

---

## 10. Single Device Policy — Kicking Out Old Sessions

**Decision:** One active session per employee at a time. New login on Device B invalidates the session on Device A.

### Why This Matters for AttendEase

Attendance is tied to identity. If the same account is active on two devices simultaneously, buddy punching becomes possible — one employee holds the phone, another operates the account on a second device.

Single device policy closes this vector.

### How It Works

```
DEVICE IDENTIFICATION:
  Each device gets a unique deviceId:
  Mobile: expo-device DeviceId (hardware UUID)
  Web:    generated UUID stored in localStorage

AT LOGIN:
  Employee logs in on Device B
         │
         ▼
  Backend:
    1. Check refresh_tokens for this emp_id
    2. Find existing session on Device A
    3. DELETE that refresh token (Device A session killed)
    4. Send FCM push to Device A:
       "You have been logged out because your account
        was accessed on another device."
    5. Create new session for Device B
    6. Return tokens to Device B
```

### The Push Notification to the Kicked Device

This is important for user experience AND security:

```
If Rahul's colleague takes his phone and logs in:
  → Rahul's phone receives: "Your account was accessed
    on a new device. If this wasn't you, contact HR."
  → Rahul knows immediately something is wrong
  → Security incident can be reported and investigated
```

### DB Implementation

```
refresh_tokens table:
  emp_id    | device_id         | token_hash | created_at
  rahul-id  | device-A-uuid     | hash_old   | 2026-03-01
                    ↓
  New login on Device B:
  DELETE WHERE emp_id = rahul-id AND device_id != device-B-uuid
  INSERT (rahul-id, device-B-uuid, hash_new, now)
                    ↓
  emp_id    | device_id         | token_hash | created_at
  rahul-id  | device-B-uuid     | hash_new   | 2026-03-05
```

---

## 11. Mobile Offline Auth — The Queued Check-in Strategy

**Decision:** Allow check-in but queue it, verify token on reconnect.

### The Problem

An employee works at a construction site or a warehouse with poor connectivity. Their access token expires (15 minutes) while they are offline. They need to check in.

Blocking them entirely means the product fails in real-world conditions where internet is not guaranteed. But accepting check-ins without any auth verification creates a security gap.

### The Solution — Offline Queue with Deferred Verification

```
EMPLOYEE IS OFFLINE, ACCESS TOKEN EXPIRED

Employee taps Check In
         │
         ▼
App detects: no internet (expo-network)
         │
         ▼
App checks: is refresh token in SecureStore?
         │ No  → Cannot authenticate → show login screen
         │ Yes ↓
         ▼
App performs LOCAL verification:
  ✓ Is refresh token present and not revoked locally?
  ✓ Face check (on-device ML Kit)
  ✓ GPS check (on-device, no backend needed)
         │ All pass ↓
         ▼
Check-in stored in LOCAL QUEUE:
{
  "type": "CHECK_IN",
  "empId": "uuid",
  "timestamp": "2026-03-05T09:27:00.000Z",
  "location": { lat, lng, accuracy },
  "faceScore": 0.91,
  "deviceId": "uuid",
  "refreshTokenHash": "hash of refresh token",
  "isOffline": true
}
Queue stored in expo-secure-store (encrypted)
         │
         ▼
Employee sees: "Check-in recorded offline.
               Will sync when connected."
```

### On Reconnect — The Sync and Verify Flow

```
Internet connection restored
         │
         ▼
App detects connectivity (expo-network listener)
         │
         ▼
App calls POST /auth/refresh
with stored refresh token
         │
  Refresh fails?
  (token revoked while offline — security event)
         │ Yes → Clear offline queue
         │       Force login
         │       Log security event
         │ No  ↓
         ▼
New access token obtained
         │
         ▼
App sends queued check-ins to:
POST /api/v1/attendance/sync
{
  "offlineRecords": [
    {
      "type": "CHECK_IN",
      "timestamp": "2026-03-05T09:27:00.000Z",
      "location": {...},
      "faceScore": 0.91,
      "isOffline": true,
      "refreshTokenHash": "..."
    }
  ]
}
         │
         ▼
Backend processes each record:
  1. Verify refreshTokenHash matches DB
     (confirms token was valid at time of check-in)
  2. Validate timestamp is within shift window
  3. Validate location against geo-fence
  4. Create attendance record with
     source = 'offline_sync'
  5. Flag record: location_verified_offline = true
         │
         ▼
Attendance created ✅
```

### What "Offline" Records Look Like in the DB

```
attendance table:
  source = 'offline_sync'        ← distinguishes from normal
  location_verified_offline = true
  face_verified_offline = true
  synced_at = "2026-03-05T10:15:00.000Z"  ← when sync happened
  check_in_time = "2026-03-05T09:27:00.000Z"  ← actual time
```

Admins can see which records were created offline — useful for dispute resolution and audit.

### Security Properties of This Approach

```
Attack scenario: Employee turns on airplane mode
                 to create fake offline check-ins

Defense 1: refreshTokenHash verified on sync
           If token was revoked (security event happened),
           offline records are rejected

Defense 2: Timestamp validation
           Offline timestamp is checked against shift window
           Can't check in at 11 PM and claim it was 9 AM

Defense 3: Face recognition still ran locally
           faceScore is included and validated

Defense 4: GPS still ran locally
           Location is validated against geo-fence on sync

The combination makes fraudulent offline check-ins
extremely difficult — all four checks must pass.
```

### Conflict Resolution — What If Auto-Absent Already Fired?

This is the most complex edge case in offline sync.

```
Timeline:
  09:00 → Employee checks in OFFLINE (queued locally)
  09:30 → No check-in seen by backend (still offline)
  10:30 → Bull Queue fires auto-absent job
           attendance record created: status = 'absent'
  11:00 → Employee reconnects, sync fires
           backend receives offline check-in for 09:00

CONFLICT:
  DB already has attendance record for today = absent
  Offline sync wants to create check-in for 09:00

RESOLUTION STRATEGY:
  1. Backend detects conflict:
     attendance record exists for this emp_id + date
  2. Check if existing record source = 'auto_absent'
  3. If yes AND offline check-in timestamp is within
     shift window:
     → Update existing record:
       status = 'present' (or 'late' based on time)
       check_in_time = offline timestamp
       source = 'offline_sync'
       auto_absent_overridden = true
  4. Notify admin: "Auto-absent overridden by offline
     check-in sync for [Employee Name]"
  5. Log in audit_logs
```

This prevents the double-record problem while being fair to employees with legitimate offline check-ins.

---

## 12. Organisation Suspension Mid-Session

What happens when a Super Admin suspends an organisation while its employees are actively working?

### The Challenge

Access tokens are verified mathematically — no DB lookup. If an org is suspended after tokens are issued, those tokens remain "valid" for up to 15 minutes. The server cannot instantly revoke them.

### The Strategy

```
Super Admin suspends Organisation X
         │
         ▼
Backend:
  1. UPDATE organisations SET status = 'suspended'
  2. DELETE ALL refresh_tokens WHERE org_id = org-X-id
     (kills all sessions — no new access tokens can be obtained)
  3. Send FCM push to ALL active devices in org:
     "Your organisation account has been suspended.
      Contact your administrator."
         │
         ▼
Employees' phones receive push notification
         │
         ▼
Existing access tokens:
  Still technically valid for up to 15 minutes
  But since refresh tokens are deleted:
  Next refresh attempt → AUTH_009
  Employee is fully locked out within 15 minutes maximum
```

### Why 15 Minutes Is Acceptable

The use case for org suspension is non-payment or policy violation — not a real-time security emergency. A 15-minute window for active tokens is acceptable in this context.

For genuine security emergencies (compromised admin account), the Super Admin can also:
- Force-revoke all tokens via a dedicated endpoint
- This triggers an org-wide `AUTH_009` check on the next request by adding the org to a Redis blocklist — this DOES require a Redis lookup per request, but only for suspended orgs

```
Redis key: suspended_orgs
Value:     Set of suspended org IDs

auth middleware (only for suspended orgs):
  if Redis.sismember('suspended_orgs', req.orgId)
  → AUTH_009 immediately
  (one Redis lookup — cheap, fast)
```

---

## 13. The Logout Flow

### Normal Logout (Employee Taps Logout)

```
POST /api/v1/auth/logout
{ refreshToken, fcmToken }
         │
         ▼
Backend:
  1. Verify refreshToken hash in DB
  2. DELETE from refresh_tokens WHERE token_hash = ?
  3. DELETE from device_tokens WHERE fcm_token = ?
     (stops push notifications to this device)
  4. Return 200

Client:
  1. Clear accessToken from Redux/Zustand
  2. Delete refreshToken from SecureStore/cookie
  3. Redirect to login screen
```

### Forced Logout (Session Kicked by New Login)

```
New login on Device B detected
         │
         ▼
Backend sends FCM to Device A:
  "Logged out — account accessed on new device"
         │
         ▼
Device A receives push notification
         │
         ▼
App handles notification:
  1. Clear accessToken from memory
  2. Delete refreshToken from SecureStore
  3. Show message: "You were logged out because
     your account was accessed on another device."
  4. Redirect to login screen
```

---

## 14. Impersonation Token — Super Admin Support Flow

### Why Impersonation Exists

When a client's admin reports a geo-fence issue or an attendance discrepancy, the Super Admin needs to see exactly what that admin sees — in their org's context, with their data. Without impersonation, the Super Admin would be debugging blind.

### The Design Principles

```
1. Time-limited:     30 minutes, no refresh
2. Fully audited:    Every action tagged in audit_logs
3. Visible:          The impersonated admin's UI shows
                     a banner: "Support session active"
4. Scoped:           Impersonation token has ADMIN role,
                     not SUPERADMIN — cannot access other orgs
5. Revocable:        Super Admin can end session early
6. Reported:         Org admin receives email notification
                     that a support session occurred
```

### The Flow

```
Super Admin opens Support panel
Selects org: "Acme Corp"
Selects admin: "vikram@acmecorp.com"
Enters reason: "Support ticket #4821 — geo-fence issue"
Clicks "Start Support Session"
         │
         ▼
POST /api/v1/superadmin/impersonate
         │
         ▼
Backend:
  1. Verify Super Admin JWT (role: superadmin)
  2. Fetch target admin from employees table
  3. Generate impersonation token:
     {
       userId: "vikram-uuid",
       orgId:  "acme-uuid",
       role:   "admin",
       isImpersonated: true,
       impersonatedBy: "superadmin-uuid",
       impersonationSessionId: "session-uuid",
       exp: now + 30 minutes
     }
  4. INSERT into impersonation_sessions:
     (sessionId, superAdminId, targetOrgId,
      targetAdminId, reason, startedAt)
  5. Send email to vikram@acmecorp.com:
     "A support session was initiated for your account
      by AttendEase support. Duration: 30 minutes."
  6. Return { impersonationToken, expiresIn: 1800 }
         │
         ▼
Super Admin's browser opens Admin Dashboard
with impersonation token in Authorization header
         │
         ▼
Admin Dashboard shows banner:
  "⚠️ Support Session Active — Acme Corp
   Ends in 28:43 | End Session"
         │
         ▼
Every request made during session:
  auth middleware detects isImpersonated: true
  All DB writes include: impersonated_by = superadmin-uuid
  All actions logged in audit_logs with:
    actor = vikram (the admin account)
    impersonated_by = superadmin-uuid
    action = "admin.employee.viewed" etc.
         │
         ▼
Session expires (30 min) or Super Admin
clicks "End Session":
  impersonation_sessions.ended_at = now
  Token expires naturally (no refresh possible)
  Super Admin browser closes admin tab
```

### What the Audit Log Looks Like

```
audit_logs:
  actor_id:         vikram-uuid
  actor_email:      vikram@acmecorp.com
  org_id:           acme-uuid
  action:           admin.attendance.viewed
  impersonated_by:  superadmin-uuid
  timestamp:        2026-03-05T14:23:00Z
  metadata:         { date: "2026-03-05", branch: "Mumbai HQ" }
```

Acme Corp's own audit log shows this action happened — with the `impersonated_by` field clearly visible. The org admin can see exactly what the support team accessed during the session.

---

## 15. The orgGuard Middleware — Multi-Tenancy Enforcement

This is the single most important piece of security middleware in AttendEase. It deserves its own section.

### What It Does

```
Incoming request with valid JWT
         │
         ▼
orgGuard reads decoded JWT from req.user
         │
         ▼
Is role = 'superadmin' AND orgId = null?
         │ Yes → req.orgId = null
         │       bypass all org scoping
         │       proceed (Super Admin sees everything)
         │ No  ↓
         ▼
Is orgId present in JWT?
         │ No  → 403 (malformed token)
         │ Yes ↓
         ▼
req.orgId = jwt.orgId
         │
         ▼
Every service layer function receives
req.orgId and uses it in every DB query:

  WHERE org_id = req.orgId
```

### The Non-Negotiable Rule

```
✅ EVERY Sequelize query in every service file
   must include: where: { org_id: req.orgId }

   or use the base service wrapper that
   automatically appends this condition.

❌ NEVER trust org_id from:
   - Request body
   - Query params
   - URL params
   - Any client-provided value

The org_id ONLY comes from the verified JWT.
The JWT ONLY comes from the auth middleware.
The auth middleware ONLY runs if the signature is valid.
```

This chain of trust is what makes multi-tenancy safe. Break any link and you have a data leak.

---

## 16. Security Decisions + Threat Model

### Threat 1 — Stolen Access Token

```
Risk:    Attacker intercepts access token (e.g., via XSS)
Impact:  15 minutes of unauthorized access
Mitigation:
  - 15-minute expiry limits window
  - HTTPS-only (token never transmitted in plain text)
  - Access token in memory (not localStorage — XSS can't steal it)
```

### Threat 2 — Stolen Refresh Token

```
Risk:    Attacker steals refresh token from SecureStore
         (requires physical device access or malware)
Impact:  Unlimited access until detected
Mitigation:
  - Rotation: next legitimate use rotates the token
  - Reuse detection: attacker's use of old token
    triggers security alert + full session revocation
  - Hardware-backed storage (Keychain/Keystore)
```

### Threat 3 — Brute Force Login

```
Risk:    Attacker tries thousands of passwords
Mitigation:
  - 5 attempts per 15 minutes per IP (rate limiting)
  - Account locked after 10 failures (AUTH_008)
  - bcrypt cost factor 12 (slow hash — ~300ms per attempt)
  - Same error message for wrong email vs wrong password
    (never reveal which field is wrong)
```

### Threat 4 — JWT Secret Compromise

```
Risk:    JWT_SECRET leaked → attacker can forge any token
Mitigation:
  - JWT_SECRET stored in AWS Secrets Manager (not .env in prod)
  - Secret rotation procedure documented
  - On rotation: all tokens immediately invalid,
    all users must re-login (acceptable — emergency procedure)
```

### Threat 5 — Replay Attack

```
Risk:    Attacker captures a valid token and reuses it
         after it should be expired
Mitigation:
  - exp claim checked on every verification
  - Server clock used, not client clock
  - HTTPS prevents interception
```

---

## 17. Token Lifecycle Summary

```
BIRTH ──────────────────────────────────────────► DEATH

Access Token:
  Created at:   POST /auth/login or POST /auth/refresh
  Lives in:     Memory (Redux / Zustand)
  Dies when:    15 minutes elapsed
                OR user logs out
                OR org suspended
  Never:        Stored to disk, sent in cookies,
                logged anywhere

Refresh Token:
  Created at:   POST /auth/login
  Lives in:     SecureStore (mobile) / HttpOnly cookie (web)
                + hashed copy in refresh_tokens DB table
  Rotates at:   Every POST /auth/refresh call
  Dies when:    User explicitly logs out (DELETE from DB)
                OR new login on same account (DELETE from DB)
                OR org suspended (DELETE from DB)
                OR reuse detected (DELETE ALL for this user)
  Never:        Expires by time (until explicit logout)

Impersonation Token:
  Created at:   POST /superadmin/impersonate
  Lives in:     Memory only (no DB refresh token created)
  Dies when:    30 minutes elapsed (hard exp)
                OR Super Admin ends session early
  Never:        Refreshed, extended, reused
```

---

## 18. Database Tables for Auth

### `refresh_tokens` Table

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id      UUID NOT NULL REFERENCES employees(id),
  org_id      UUID NOT NULL REFERENCES organisations(id),
  device_id   VARCHAR(255) NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,  -- bcrypt hash
  status      VARCHAR(10) DEFAULT 'active',  -- active | used | revoked
  used_at     TIMESTAMPTZ,                   -- for reuse detection
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ                    -- NULL = no expiry
);

CREATE INDEX idx_refresh_tokens_emp_id ON refresh_tokens(emp_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

### `impersonation_sessions` Table

```sql
CREATE TABLE impersonation_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id    UUID NOT NULL REFERENCES superadmins(id),
  target_org_id     UUID NOT NULL REFERENCES organisations(id),
  target_admin_id   UUID NOT NULL REFERENCES employees(id),
  reason            TEXT NOT NULL,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,              -- NULL = still active
  actions_count     INTEGER DEFAULT 0        -- how many actions taken
);
```

### `device_tokens` Table (Already in Schema — Reminder)

```sql
-- Already defined in DB schema
-- Relevant fields:
  emp_id      UUID
  fcm_token   TEXT
  device_id   VARCHAR(255)
  is_active   BOOLEAN
  UNIQUE(emp_id, fcm_token)
  Partial index on is_active = TRUE
```

---

## 19. Glossary

| Term | Definition |
|---|---|
| **JWT** | JSON Web Token — a signed, self-contained token carrying identity claims |
| **Access Token** | Short-lived JWT (15 min) used to authenticate every API request |
| **Refresh Token** | Long-lived token used only to obtain new access tokens |
| **Token Rotation** | Replacing a refresh token with a new one on every use |
| **Reuse Detection** | Detecting when an already-used refresh token is presented again — indicates theft |
| **Claims** | The data fields inside a JWT payload (userId, orgId, role, etc.) |
| **HS256** | HMAC-SHA256 — the signing algorithm used for JWTs |
| **bcrypt** | Password hashing algorithm — also used to hash refresh tokens in DB |
| **HttpOnly Cookie** | A cookie inaccessible to JavaScript — prevents XSS theft |
| **SecureStore** | Expo's hardware-backed encrypted storage (iOS Keychain / Android Keystore) |
| **orgGuard** | AttendEase middleware that enforces multi-tenant org_id scoping |
| **Impersonation** | Super Admin temporarily operating as an org admin for support purposes |
| **XSS** | Cross-Site Scripting — attack that injects malicious JS into a web page |
| **DPDP Act 2023** | India's data protection law — governs employee data handling |
| **Offline Queue** | Local storage of check-in events when internet is unavailable |
| **Conflict Resolution** | Logic that handles DB conflicts when offline records sync against existing records |
| **Session Kick** | Invalidating an existing session when a new login occurs (single device policy) |
| **Dead Reckoning** | Estimating current state from last known state + elapsed actions |
| **Redis Blocklist** | A Redis set storing suspended org IDs for fast middleware checks |
| **Axios Interceptor** | Code that runs automatically on every HTTP response before reaching app code |

---

*AttendEase JWT + Auth Flow — Internal Engineering Document*
*Previous: API Design | Next: LLD — Shift Engine + Bull Queue*
