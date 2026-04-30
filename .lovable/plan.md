# Fix plan for the repeated login problem

## What is actually causing the repeat issue
This looks like an infrastructure drift problem more than a database problem.

From the code and deployment files:
- The frontend always sends login to `https://soft.smelitehajj.com/api`.
- Nginx is locked to proxy `/api/` to `127.0.0.1:3003`.
- The deployment docs and resource lock also reserve port `3003` for this app.
- Earlier VPS output showed other PM2 apps carrying stale `PORT=3013` values, which means the shared PM2 environment on that server is not reliably isolated.
- In the backend, login depends on exact email matching and permissive config fallbacks (`PORT`, `JWT_SECRET`), so bad environment state can silently create auth instability.

So there are really 2 failure modes:
1. Backend process problem: wrong env / wrong port / crashed API -> login fails with 502 or similar.
2. Auth path problem: reachable API but exact email mismatch or inconsistent user state -> login fails with invalid credentials / 401.

## Best advanced approach
The safest long-term fix is to make the invoice login stack isolated from the other VPS apps.

That means:
- keep the current database untouched,
- keep the current domain untouched,
- isolate the invoice API runtime so no other project can overwrite its port or env,
- harden the auth code so login is more tolerant and easier to diagnose.

## Implementation plan

### 1) Isolate the invoice API from shared PM2 state
Use a dedicated service for the invoice backend instead of relying on a shared PM2 runtime with reused env.

Preferred options:
- Best: dedicated `systemd` service with its own `EnvironmentFile`
- Also acceptable: dedicated PM2 app started only from the project ecosystem file with forced env refresh

Goal:
- the invoice API always starts with only its own env,
- port `3003` remains reserved for this app,
- no other project can accidentally poison `PORT`, `JWT_SECRET`, or DB settings.

### 2) Harden backend startup so bad config fails fast
Update the backend so it does not silently fall back to risky defaults.

I would change startup behavior to:
- require `JWT_SECRET` to exist,
- require the expected DB config,
- require the expected app port,
- log a clear startup error and refuse to boot if config is wrong.

This prevents “half-working” states where login randomly breaks later.

### 3) Harden the auth flow without changing the database design
Improve login reliability in the backend:
- trim and lowercase emails on signup and login,
- query users by normalized email,
- return clearer auth errors,
- add defensive checks around missing password hashes.

This avoids repeated false login failures caused by input formatting or inconsistent stored email casing.

### 4) Add a real readiness check
Keep `/api/health`, but add a stricter readiness check for deployment validation.

The readiness check should confirm:
- database connection works,
- expected tables exist,
- JWT secret is loaded,
- server is running on the expected config.

Then deployment should verify readiness before the service is considered healthy.

### 5) Strengthen deployment safety
Update the deploy flow so it cannot accidentally relaunch with stale env.

Changes:
- validate `.env` before restart,
- restart only the dedicated invoice API service,
- verify `http://localhost:3003/api/health` and login/profile endpoints after restart,
- fail deployment immediately if checks do not pass.

### 6) Improve observability for future incidents
Add precise logs around auth and startup, for example:
- startup config validation result,
- DB connection success/failure,
- login failure reason category (user not found / password mismatch / config issue),
- service name and bound port.

This makes the next failure obvious instead of guessing between frontend, API, PM2, and database.

## Files I would update in this project
- `migration/backend/server.js`
- `migration/backend/ecosystem.config.js`
- `migration/scripts/deploy.sh`
- `src/lib/apiClient.ts` only if error handling needs clearer messages
- `src/contexts/AuthContext.tsx` only if we want better login feedback
- deployment docs to document the safer runtime model

## Database impact
Phase 1 can be done with no risky database rewrite.

Optional later improvement only:
- enforce case-insensitive unique emails at the database level
- but only after verifying current user data has no duplicates by case

So the main fix is service/runtime isolation, not database surgery.

## Expected result
After this change:
- login should stop breaking because of other VPS projects,
- the database stays unchanged,
- the API either starts correctly or fails loudly,
- auth errors become real auth errors, not mixed infra issues.

## Technical details
```text
Browser login page
   -> /api/auth/login
   -> Nginx
   -> dedicated invoice API service only
   -> dedicated env only
   -> dedicated DB only
```

If you approve, I’ll prepare the repo-side hardening changes and give you the exact VPS-side rollout steps in the safest order, with minimal risk to login and existing data.