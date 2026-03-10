# SM Elite Hajj Invoice System - VPS Deployment Guide

## Prerequisites

- Hostinger KVM VPS with Ubuntu 22.04+
- PostgreSQL 15+
- Node.js 18+
- Nginx (for reverse proxy)
- PM2 (for process management)

## Step 1: Install Dependencies on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (if not already installed)
sudo apt install -y nginx
```

## Step 2: Setup Database

```bash
cd migration/scripts
chmod +x setup_database.sh
export DB_PASSWORD=your_secure_password
./setup_database.sh
```

## Step 3: Export Data from Current Database

Go to your Lovable Cloud backend view and run these SQL queries to export data. Save each result as a SQL file:

```sql
-- Export all tables (run each SELECT and save results)
-- You can use the Cloud backend SQL runner to export data

-- For each table, construct INSERT statements from the data
-- Or use pg_dump if you have direct access
```

### Manual Data Export Steps:
1. Open your project in Lovable
2. Go to backend view  
3. Run SQL queries to get all data from each table
4. Format as INSERT statements and save to `migration/database/data.sql`
5. Import: `psql -d sm_elite_hajj -f data.sql`

## Step 4: Create Admin User

```bash
# Connect to database
sudo -u postgres psql sm_elite_hajj

# Create admin user (replace with your details)
INSERT INTO users (email, password_hash, raw_user_meta_data, email_confirmed_at)
VALUES (
  'admin@smelitehajj.com',
  -- Use bcrypt hash of your password. Generate with:
  -- node -e "console.log(require('bcryptjs').hashSync('yourpassword', 12))"
  '$2a$12$your_bcrypt_hash_here',
  '{"full_name": "Admin"}',
  now()
);

-- Get the user ID
SELECT id FROM users WHERE email = 'admin@smelitehajj.com';

-- Assign admin role (replace USER_ID)
INSERT INTO user_roles (user_id, role) VALUES ('USER_ID', 'admin');

-- Approve the admin profile
UPDATE profiles SET is_approved = true WHERE user_id = 'USER_ID';
```

## Step 5: Setup Backend API

```bash
cd migration/backend
cp .env.example .env
# Edit .env with your actual values
nano .env

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name sm-elite-api
pm2 save
pm2 startup
```

## Step 6: Build Frontend

```bash
cd /path/to/project
npm install
npm run build

# Copy dist folder to nginx serve directory
sudo cp -r dist /var/www/sm-elite-hajj
```

## Step 7: Configure Nginx

Create `/etc/nginx/sites-available/sm-elite-hajj`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/sm-elite-hajj;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sm-elite-hajj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 8: SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 9: Frontend Code Changes Required

After downloading the project, you need to replace all Supabase SDK calls with REST API calls. Key files to modify:

1. **Remove** `@supabase/supabase-js` dependency
2. **Replace** `src/integrations/supabase/client.ts` with a REST API client
3. **Update** all hooks (`useInvoices.ts`, `useCompanies.ts`, `useAdmin.ts`, `useTheme.ts`, `useBranding.ts`)
4. **Replace** `AuthContext.tsx` to use JWT-based auth
5. **Remove** `supabase/` folder entirely

See `MIGRATION_REPORT.md` for the complete list of files that reference Supabase.

## Port Conflict Prevention

Since another website runs on this VPS:
- Backend API runs on port **3001** (configurable in `.env`)
- Use Nginx reverse proxy to route by domain/path
- Each site gets its own Nginx server block

## Verification Checklist

- [ ] Database created and schema applied
- [ ] Data imported from old database
- [ ] Admin user created and working
- [ ] Backend API running on PM2
- [ ] Frontend built and served by Nginx
- [ ] SSL configured
- [ ] All pages load correctly
- [ ] Login/logout works
- [ ] Invoice CRUD works
- [ ] Company CRUD works
- [ ] Admin panel works
- [ ] PDF generation works
- [ ] Public invoice view works
