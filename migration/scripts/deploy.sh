#!/bin/bash
# ============================================
# SM Elite Hajj Invoice - Secure Deploy Script
# LOCKED: port 3012, db port 5440, db sm_elite_hajj
# ============================================

set -e

PROJECT_DIR="/var/www/smelitehajj-invoice"
BACKEND_DIR="${PROJECT_DIR}/migration/backend"
PM2_APP_NAME="smelitehajj-api"
LOCKED_PORT=3012
LOCKED_DB_PORT=5440
LOCKED_DB_NAME="sm_elite_hajj"

ensure_env_value() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        printf '\n%s=%s\n' "$key" "$value" >> .env
    fi
}

echo "============================================"
echo "  SM Elite Hajj Invoice - Secure Deployment"
echo "============================================"

# 1. Verify port is not taken by another project
PORT_USER=$(lsof -ti:${LOCKED_PORT} 2>/dev/null || true)
if [ -n "$PORT_USER" ]; then
    PM2_NAME=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    apps = json.load(sys.stdin)
    for a in apps:
        if a.get('pid') == $PORT_USER:
            print(a.get('name',''))
            break
except: pass
" 2>/dev/null || true)
    if [ "$PM2_NAME" != "$PM2_APP_NAME" ] && [ -n "$PM2_NAME" ]; then
        echo "ERROR: Port ${LOCKED_PORT} is used by another project: ${PM2_NAME}"
        echo "This port is RESERVED for ${PM2_APP_NAME}."
        exit 1
    fi
fi

# 2. Pull latest code
cd "$PROJECT_DIR"
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main

# 3. Build frontend
echo "Building frontend..."
npm install --production=false
npm run build

# 4. Setup backend
echo "Setting up backend..."
cd "$BACKEND_DIR"
npm install --production

# 5. Verify .env has correct locked values + required secrets
if [ ! -f .env ]; then
    echo "ERROR: $BACKEND_DIR/.env is missing. Cannot deploy."
    exit 1
fi

CURRENT_PORT=$(grep -E "^PORT=" .env | cut -d= -f2)
CURRENT_DB_PORT=$(grep -E "^DB_PORT=" .env | cut -d= -f2)
CURRENT_DB_NAME=$(grep -E "^DB_NAME=" .env | cut -d= -f2)
CURRENT_JWT=$(grep -E "^JWT_SECRET=" .env | cut -d= -f2-)

if [ "$CURRENT_PORT" != "$LOCKED_PORT" ]; then
    echo "Fixing PORT in .env -> ${LOCKED_PORT}"
    ensure_env_value "PORT" "$LOCKED_PORT"
fi
if [ "$CURRENT_DB_PORT" != "$LOCKED_DB_PORT" ]; then
    echo "Fixing DB_PORT in .env -> ${LOCKED_DB_PORT}"
    ensure_env_value "DB_PORT" "$LOCKED_DB_PORT"
fi
if [ "$CURRENT_DB_NAME" != "$LOCKED_DB_NAME" ]; then
    echo "Fixing DB_NAME in .env -> ${LOCKED_DB_NAME}"
    ensure_env_value "DB_NAME" "$LOCKED_DB_NAME"
fi
if [ -z "$CURRENT_JWT" ] || [ "$CURRENT_JWT" = "generate-a-secure-random-string-here" ] || [ "${#CURRENT_JWT}" -lt 16 ]; then
    echo "ERROR: JWT_SECRET in .env is missing or too weak (>=16 chars required)."
    echo "       Generate with: openssl rand -hex 48"
    exit 1
fi

# 6. Restart API with FORCED env refresh (drops stale PM2-baked env from other projects)
echo "Restarting API (forced env refresh)..."
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
pm2 start "$BACKEND_DIR/ecosystem.config.js" --only "$PM2_APP_NAME" --update-env
pm2 save

# 7. Wait for readiness with polling (no blind sleep)
echo "Waiting for API readiness..."
READY=""
for i in $(seq 1 20); do
    R=$(curl -sf "http://localhost:${LOCKED_PORT}/api/ready" 2>/dev/null || true)
    if echo "$R" | grep -q '"status":"ready"'; then
        READY="$R"
        break
    fi
    sleep 1
done

if [ -z "$READY" ]; then
    echo "ERROR: API did not become ready."
    echo "Last log:"
    pm2 logs "$PM2_APP_NAME" --lines 30 --nostream --err || true
    exit 1
fi

echo ""
echo "============================================"
echo "  DEPLOYMENT SUCCESSFUL"
echo "  API:  http://localhost:${LOCKED_PORT}"
echo "  DB:   ${LOCKED_DB_NAME} on port ${LOCKED_DB_PORT}"
echo "  PM2:  ${PM2_APP_NAME}"
echo "  Site: https://soft.smelitehajj.com"
echo "============================================"
