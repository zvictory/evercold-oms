import 'dotenv/config';
import { createBot } from './src/lib/telegram/bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

console.log('🤖 Starting Telegram bot...');

const bot = createBot(BOT_TOKEN);

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('\n⏹️  Stopping bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('\n⏹️  Stopping bot...');
  bot.stop('SIGTERM');
});

// Start bot in polling mode with timeout handling
const launchTimeout = setTimeout(() => {
  console.error('❌ Bot launch timeout - this may be a network issue');
  console.log('💡 Try using webhook mode instead or check your network connection');
  process.exit(1);
}, 30000);

bot.launch({
  dropPendingUpdates: true
})
  .then(() => {
    clearTimeout(launchTimeout);
    console.log('✅ Telegram bot is running!');
    console.log('📱 Send /start to your bot to begin');
  })
  .catch((error) => {
    clearTimeout(launchTimeout);
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });
