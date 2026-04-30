# SM Elite Hajj Invoice — Login Stability Hardening (rollout)

This rollout fixes the repeated login failures **without touching the database**.

## What changed in the code

- `migration/backend/server.js`
  - Refuses to start if `JWT_SECRET`, `PORT`, `DB_PORT`, `DB_NAME`, etc. are missing or wrong (no more silent defaults).
  - Login is case-insensitive, returns clean `401 Invalid email or password`, and logs a category for every failure (`user_not_found`, `bad_password`, `no_password_hash`, `internal_error`).
  - New `/api/ready` readiness endpoint (verifies DB + required tables + JWT loaded).
  - Crash-safe: handles `unhandledRejection` / `uncaughtException`.
- `migration/backend/ecosystem.config.js`
  - Locks port 3003 and DB 5440.
  - `JWT_SECRET` is intentionally NOT hardcoded — must come from `.env`.
  - Doc comment forces use of `--update-env` so PM2 cannot reuse stale env (e.g. the `PORT=3013` that bled in from other VPS apps).
- `migration/scripts/deploy.sh`
  - Validates `.env` (incl. JWT_SECRET strength).
  - Restarts PM2 with `--update-env` (drops baked-in env from other projects).
  - Polls `/api/ready` instead of blind `sleep`.
- `src/lib/apiClient.ts`
  - 401 / 502 / 503 / 504 produce friendly messages instead of raw `Request failed`.

## One-time VPS setup

1. SSH into the VPS.
2. Make sure `/var/www/smelitehajjinvoice/migration/backend/.env` has a strong `JWT_SECRET`:
   ```bash
   cd /var/www/smelitehajjinvoice/migration/backend
   grep ^JWT_SECRET= .env || echo "JWT_SECRET=$(openssl rand -hex 48)" >> .env
   ```
   If it exists but is the placeholder `generate-a-secure-random-string-here`, replace it:
   ```bash
   sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" .env
   ```

   **Note:** changing `JWT_SECRET` invalidates existing browser sessions — users will need to log in again once. It does NOT change passwords or any DB data.

3. Deploy:
   ```bash
   bash /var/www/smelitehajjinvoice/migration/scripts/deploy.sh
   ```

4. Verify:
   ```bash
   curl -s http://localhost:3003/api/ready | jq
   curl -sI https://soft.smelitehajj.com/api/health | head -1
   ```

## Optional: move off shared PM2 to dedicated systemd

Recommended once the above is stable. A dedicated service is fully isolated from other VPS projects' PM2 env.

`/etc/systemd/system/smelitehajj-api.service`:
```ini
[Unit]
Description=SM Elite Hajj Invoice API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/smelitehajjinvoice/migration/backend
EnvironmentFile=/var/www/smelitehajjinvoice/migration/backend/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/smelitehajj-api.log
StandardError=append:/var/log/smelitehajj-api.err.log

[Install]
WantedBy=multi-user.target
```

Activate:
```bash
sudo pm2 delete smelitehajj-api 2>/dev/null || true
sudo systemctl daemon-reload
sudo systemctl enable --now smelitehajj-api
sudo systemctl status smelitehajj-api
curl -s http://localhost:3003/api/ready
```

Nginx already proxies `/api/` → `127.0.0.1:3003`, so no Nginx change is needed.

## Why this stops the recurring login issue

- Other PM2 apps on the VPS were holding stale `PORT=3013` in their saved env, which silently corrupted shared state. `--update-env` (and systemd) eliminates that.
- The backend now refuses to boot in a half-broken state, instead of accepting requests it cannot serve.
- Login uses normalized email and clear failure categories, so future "login broken" reports become diagnosable in one log line.
- The deploy script only reports success once `/api/ready` confirms DB + tables + JWT.

No database schema changes, no destructive operations, no risk to existing invoices/users.
