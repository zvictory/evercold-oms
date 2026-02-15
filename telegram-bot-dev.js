const { PrismaClient } = require('@prisma/client');
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8278817835:AAHAMW7BIYBmpPJagODSuwZovZjMgGb_EN8';
const bot = new Telegraf(BOT_TOKEN);
const prisma = new PrismaClient();

const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      step: 'idle',
      items: [],
    });
  }
  return sessions.get(chatId);
}

// Start command
bot.command('start', async (ctx) => {
  console.log(`🔔 ${ctx.from.first_name} started the bot`);
  await ctx.reply(
    '🧊 Добро пожаловать в EverCold Order Bot!\n\n' +
    'Команды:\n' +
    '/order - Создать новый заказ\n' +
    '/help - Справка'
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '📖 Доступные команды:\n' +
    '/order - Создать заказ\n' +
    '/start - Главное меню'
  );
});

bot.command('order', async (ctx) => {
  const session = getSession(ctx.chat.id);
  session.step = 'entering_phone';
  console.log(`📝 ${ctx.from.first_name} starting order creation`);
  
  // Use contact sharing button
  await ctx.reply(
    '📞 Пожалуйста, поделитесь номером телефона компании:',
    Markup.keyboard([
      Markup.button.contactRequest('📞 Поделиться номером')
    ]).oneTime().resize()
  );
});

// Handle contact
bot.on('contact', async (ctx) => {
  const session = getSession(ctx.chat.id);
  
  if (session.step === 'entering_phone') {
    const phoneNumber = ctx.message.contact.phone_number;
    session.phoneNumber = phoneNumber;
    session.step = 'entering_company_name';
    
    console.log(`📱 Phone received: ${phoneNumber}`);
    await ctx.reply(
      `✅ Номер сохранён: ${phoneNumber}\n\nВведите название компании:`,
      Markup.removeKeyboard()
    );
  }
});

// Handle text messages
bot.on('text', async (ctx) => {
  const session = getSession(ctx.chat.id);
  
  if (session.step === 'entering_company_name') {
    const companyName = ctx.message.text;
    session.companyName = companyName;
    console.log(`🏢 Company: ${companyName}`);
    
    try {
      const customer = await prisma.customer.findFirst({
        where: { name: { contains: companyName } },
        select: { id: true, name: true, customerCode: true, branches: { select: { id: true, branchName: true, branchCode: true } } }
      });
      
      if (customer) {
        session.customerId = customer.id;
        console.log(`✅ Found customer: ${customer.name}`);
        
        // Show branch selection if multiple branches
        if (customer.branches.length > 1) {
          session.step = 'selecting_branch';
          const branchButtons = customer.branches.map(b => 
            Markup.button.text(`${b.branchName} (${b.branchCode})`)
          );
          
          await ctx.reply(
            `✅ Найдена компания: ${customer.name}\n\nВыберите филиал:`,
            Markup.keyboard(branchButtons).oneTime().resize()
          );
        } else {
          session.branchId = customer.branches[0].id;
          session.step = 'idle';
          await ctx.reply(
            `✅ Заказ для компании: ${customer.name}\n✅ Филиал: ${customer.branches[0].branchName}\n\n✨ Заказ готов к созданию!`,
            Markup.removeKeyboard()
          );
        }
      } else {
        console.log(`❌ Customer not found: ${companyName}`);
        await ctx.reply(`❌ Компания "${companyName}" не найдена в системе.\n\nДоступные компании:\n• Korzinka\n• Green Store\n• Fresh Market\n\nПопробуйте ещё раз:`);
      }
    } catch (error) {
      console.error('Error:', error);
      await ctx.reply('❌ Ошибка при поиске компании');
    }
  } else if (session.step === 'selecting_branch') {
    console.log(`🏢 Branch selected: ${ctx.message.text}`);
    session.step = 'idle';
    await ctx.reply(
      `✅ Филиал выбран: ${ctx.message.text}\n\n✨ Заказ готов к созданию!`,
      Markup.removeKeyboard()
    );
  } else {
    await ctx.reply('Используйте /order для создания заказа');
  }
});

// Start bot
bot.launch({
  polling: {
    interval: 300,
    timeout: 30,
    allowedUpdates: ['message', 'edited_message', 'channel_post', 'edited_channel_post']
  }
});

console.log('✅ Telegram Bot started in polling mode (DEV)');
console.log('💬 Features:');
console.log('  • Contact sharing for phone numbers');
console.log('  • Company lookup from MySQL');
console.log('  • Branch selection');
console.log('💬 Send /start to begin');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

process.on('exit', () => {
  prisma.$disconnect();
});
