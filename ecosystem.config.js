module.exports = {
  apps: [
    {
      name: "cdc-media",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: process.env.APP_DIR || "./",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        PORT: process.env.PORT || 3001,
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        UPLOADS_PATH: process.env.UPLOADS_PATH || "./uploads",
        JWT_SECRET: process.env.JWT_SECRET
      }
    }
  ]
};

