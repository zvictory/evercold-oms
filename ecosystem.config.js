module.exports = {
  apps: [
    {
      // Application name
      name: 'evercold-crm',

      // Script to run
      script: 'npm',
      args: 'start',

      // Working directory
      cwd: '/var/www/evercold',

      // Cluster mode configuration
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://evercold_user:2d075a53447d1d4ac4080f17d5a07f32@localhost:5432/evercold_production?schema=public'
      },

      // Logging
      error_file: '/var/log/pm2/evercold-error.log',
      out_file: '/var/log/pm2/evercold-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart settings
      autorestart: true,
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'backups',
        '.next',
        'public'
      ],

      // Memory limits
      max_memory_restart: '1G',

      // Startup settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // Health monitoring
      events: {
        restart: 'echo "Application restarted"',
        reload: 'echo "Application reloaded"',
        stop: 'echo "Application stopped"',
        exit: 'echo "Application exited"',
        'restart overlimit': 'echo "PM2 restart overlimit"'
      }
    }
  ]
};
