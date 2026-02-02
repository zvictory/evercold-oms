import 'dotenv/config';
import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('No token');
  process.exit(1);
}

console.log('Creating bot instance...');
const bot = new Telegraf(BOT_TOKEN);

console.log('Setting up handlers...');
bot.command('start', (ctx) => ctx.reply('Hello!'));

console.log('Launching bot (this should take 1-2 seconds)...');

// Add timeout to detect hang
const timeoutId = setTimeout(() => {
  console.error('TIMEOUT: Bot launch is taking too long!');
  process.exit(1);
}, 10000);

// Try alternative launch with manual polling
console.log('Starting polling...');
bot.launch({
  dropPendingUpdates: true,
  allowedUpdates: ['message', 'callback_query', 'contact'],
})
  .then(() => {
    clearTimeout(timeoutId);
    console.log('✅ Bot launched successfully!');

    // Stop after 2 seconds
    setTimeout(() => {
      console.log('Stopping bot...');
      bot.stop();
      process.exit(0);
    }, 2000);
  })
  .catch((error) => {
    clearTimeout(timeoutId);
    console.error('❌ Launch failed:', error);
    process.exit(1);
  });
