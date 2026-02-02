import 'dotenv/config';
import { createBot } from './src/lib/telegram/bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

console.log('🤖 Starting Telegram bot (minimal mode)...');

const bot = createBot(BOT_TOKEN);

// Graceful stop handlers
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start with minimal config
(async () => {
  try {
    await bot.launch({
      dropPendingUpdates: true,
    });
    console.log('✅ Bot is running! Send /order to @evercoldbot');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
