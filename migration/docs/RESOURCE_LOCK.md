# SM Elite Hajj Invoice - Resource Allocation

## LOCKED Resources (Do NOT reuse for other projects)

| Resource        | Value                                      | Status   |
|-----------------|-------------------------------------------|----------|
| **API Port**    | `3003`                                     | 🔒 LOCKED |
| **DB Port**     | `5440`                                     | 🔒 LOCKED |
| **DB Name**     | `sm_elite_hajj`                            | 🔒 LOCKED |
| **DB User**     | `sm_elite_user`                            | 🔒 LOCKED |
| **Domain**      | `soft.smelitehajj.com`                     | 🔒 LOCKED |
| **Frontend**    | `/var/www/smelitehajjinvoice/dist`                | 🔒 LOCKED |
| **Backend**     | `/var/www/smelitehajjinvoice/migration/backend`   | 🔒 LOCKED |
| **Uploads**     | `/var/www/smelitehajjinvoice/migration/backend/uploads` | 🔒 LOCKED |
| **PM2 Process** | `smelitehajj-api`                          | 🔒 LOCKED |
| **Nginx Config**| `/etc/nginx/sites-available/sm-elite-hajj` | 🔒 LOCKED |

## Available Ports for New Projects

| Port Range  | Status      |
|-------------|-------------|
| 3001        | ❓ Check     |
| 3002        | ❓ Check     |
| 3003        | 🔒 SM Elite  |
| 3004-3010   | ✅ Available |
| 5440        | 🔒 SM Elite DB |
| 5441-5449   | ✅ Available for new DBs |

## How to Add a New Project Safely

1. **Choose a unique port** from the available range (e.g., 3004)
2. **Create a separate database** with a unique name and user
3. **Use a separate Nginx server block** with its own domain
4. **Use a separate PM2 process** with a unique name
5. **Never modify** any file in `/var/www/smelitehajjinvoice/`

## Database Isolation

Each project should have its own PostgreSQL database and user:

```bash
sudo -u postgres psql -p 5440 -c "
CREATE USER new_project_user WITH PASSWORD 'secure_password';
CREATE DATABASE new_project_db OWNER new_project_user;
GRANT ALL PRIVILEGES ON DATABASE new_project_db TO new_project_user;
"
```

## Nginx Template for New Projects

```nginx
server {
    listen 80;
    server_name new-project.example.com;
    
    location / {
        root /var/www/new-project/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3004;  # Use unique port
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
