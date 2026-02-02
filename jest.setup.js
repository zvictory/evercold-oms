// jest.setup.js
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user@localhost:5432/evercold_crm_test'
process.env.TELEGRAM_BOT_TOKEN = 'test-token'
process.env.CRON_SECRET = 'test-secret'
process.env.TELEGRAM_DISPATCHER_CHAT_ID = 'test-dispatcher'
process.env.TELEGRAM_ADMIN_CHAT_ID = 'test-admin'
process.env.TELEGRAM_TECHNICIAN_CHAT_ID = 'test-technician'

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
