module.exports = {
  apps: [
    {
      name: 'nodejs-expressjs-mongodb-backend',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
