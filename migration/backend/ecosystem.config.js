module.exports = {
  apps: [
    {
      name: 'smelitehajj-api',
      script: './server.js',
      cwd: '/var/www/smelitehajj/migration/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        DB_HOST: 'localhost',
        DB_PORT: 5440,
        DB_NAME: 'sm_elite_hajj',
        DB_USER: 'sm_elite_user',
        DB_PASSWORD: 'SmEliteHajj2026Pass',
        CORS_ORIGIN: 'https://soft.smelitehajj.com',
        FRONTEND_URL: 'https://soft.smelitehajj.com',
        BASE_URL: 'https://soft.smelitehajj.com/api',
        UPLOADS_DIR: '/var/www/smelitehajj/migration/backend/uploads',
      },
    },
  ],
};
