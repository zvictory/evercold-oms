import { Telegraf, Context, Markup } from 'telegraf';
import { prisma } from '@/lib/prisma';
import { Update } from 'telegraf/types';
import { formatPrice } from '@/lib/utils';

// Session data for managing conversation state
interface SessionData {
  step: 'idle' | 'entering_phone' | 'entering_company_name' | 'entering_address' | 'selecting_branch' | 'adding_products' | 'entering_quantity' | 'confirming';
  phoneNumber?: string;
  companyName?: string;
  customerId?: string;
  branchId?: string;
  items: Array<{
    productId: string;
    productName: string;
    sapCode?: string;
    quantity: number;
    unitPrice: number;
  }>;
  currentProductId?: string;
}

// Store sessions in memory (use Redis for production)
const sessions = new Map<number, SessionData>();

function getSession(chatId: number): SessionData {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      step: 'idle',
      items: [],
    });
  }
  return sessions.get(chatId)!;
}

function clearSession(chatId: number) {
  sessions.set(chatId, {
    step: 'idle',
    items: [],
  });
}

export function createBot(token: string) {
  const bot = new Telegraf(token);

  // Start command
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '🧊 Добро пожаловать в EverCold Order Bot!\n\n' +
      'Команды:\n' +
      '/order - Создать новый заказ\n' +
      '/cancel - Отменить текущий заказ\n' +
      '/help - Помощь'
    );
  });

  // Help command
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '📋 Как создать заказ:\n\n' +
      '1. Отправьте /order\n' +
      '2. Выберите клиента\n' +
      '3. Выберите филиал\n' +
      '4. Добавьте товары и количество\n' +
      '5. Подтвердите заказ\n\n' +
      'Используйте /cancel для отмены'
    );
  });

  // Cancel command
  bot.command('cancel', async (ctx) => {
    clearSession(ctx.chat.id);
    await ctx.reply('❌ Заказ отменен');
  });

  // Order command - start new order
  bot.command('order', async (ctx) => {
    clearSession(ctx.chat.id);
    const session = getSession(ctx.chat.id);
    session.step = 'entering_phone';

    // Request phone number using Telegram's contact button
    const keyboard = Markup.keyboard([
      Markup.button.contactRequest('📱 Отправить номер телефона'),
    ]).resize();

    await ctx.reply(
      '📱 Для создания заказа отправьте ваш номер телефона:\n\n' +
      '👇 Нажмите кнопку ниже для отправки вашего номера',
      keyboard
    );
  });

  // Handle phone number via contact
  bot.on('contact', async (ctx) => {
    const session = getSession(ctx.chat.id);

    if (session.step !== 'entering_phone') {
      return;
    }

    const phoneNumber = ctx.message.contact.phone_number;
    await handlePhoneNumber(ctx, session, phoneNumber);
  });

  // Manual phone number input disabled for security (use contact button only)

  // Process phone number and find/create customer
  async function handlePhoneNumber(ctx: any, session: SessionData, phoneNumber: string) {
    session.phoneNumber = phoneNumber;

    // Remove keyboard
    await ctx.reply('🔍 Проверяем номер...', Markup.removeKeyboard());

    // Find customer by phone
    let customer = await prisma.customer.findFirst({
      where: { phone: phoneNumber },
      select: { id: true, name: true },
    });

    if (customer) {
      // Existing customer
      session.customerId = customer.id;
      await ctx.reply(`✅ Добро пожаловать, ${customer.name}!`);
      await showBranches(ctx, session);
    } else {
      // New customer - ask for company name
      session.step = 'entering_company_name';
      await ctx.reply(
        '👤 Новый клиент!\n\n' +
        'Введите название вашей компании:'
      );
    }
  }

  // Show branches for customer
  async function showBranches(ctx: any, session: SessionData) {
    // Get branches for this customer
    const branches = await prisma.customerBranch.findMany({
      where: { customerId: session.customerId, isActive: true },
      select: { id: true, branchName: true, fullName: true },
      orderBy: { branchName: 'asc' },
    });

    if (branches.length === 0) {
      // No branches - ask for delivery address to create one
      session.step = 'entering_address';
      await ctx.reply(
        '📍 У вас еще нет адреса доставки.\n\n' +
        'Введите адрес для доставки заказа:\n' +
        '(например: г. Ташкент, ул. Амира Темура 12)'
      );
      return;
    }

    // If only one branch, auto-select it
    if (branches.length === 1) {
      session.branchId = branches[0].id;
      session.step = 'adding_products';

      await ctx.reply(
        `📍 Адрес доставки: ${branches[0].fullName || branches[0].branchName}\n\n` +
        'Теперь добавьте товары:'
      );

      await showProducts(ctx, session);
      return;
    }

    // Multiple branches - let user choose
    session.step = 'selecting_branch';

    const keyboard = Markup.inlineKeyboard(
      branches.map(b => [Markup.button.callback(b.fullName || b.branchName, `branch:${b.id}`)])
    );

    await ctx.reply('🏪 Выберите филиал для доставки:', keyboard);
  }

  // Handle branch selection
  bot.action(/^branch:(.+)$/, async (ctx) => {
    const branchId = ctx.match[1];
    if (!ctx.chat) {
      await ctx.answerCbQuery('Ошибка');
      return;
    }
    const session = getSession(ctx.chat.id);

    if (session.step !== 'selecting_branch') {
      await ctx.answerCbQuery('Неверный шаг');
      return;
    }

    session.branchId = branchId;
    session.step = 'adding_products';

    // Get branch name
    const branch = await prisma.customerBranch.findUnique({
      where: { id: branchId },
      select: { fullName: true, branchName: true },
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `✅ Филиал: ${branch?.fullName || branch?.branchName}\n\n` +
      '🛒 Добавление товаров...'
    );

    // Show products
    await showProducts(ctx, session);
  });

  // Show products for selection
  async function showProducts(ctx: any, session: SessionData) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        unitPrice: true,
        unit: true,
        customerPrices: {
          where: { customerId: session.customerId },
          select: { unitPrice: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    if (products.length === 0) {
      await ctx.reply('❌ Нет доступных товаров');
      clearSession(ctx.chat.id);
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      ...products.map(p => {
        // Use customer-specific price if available, otherwise default price
        const price = p.customerPrices[0]?.unitPrice || p.unitPrice;
        // Shorten product name if too long (max 35 chars)
        const shortName = p.name.length > 35 ? p.name.substring(0, 32) + '...' : p.name;
        return [
          Markup.button.callback(
            `${shortName} • ${formatPrice(price)} сўм`,
            `product:${p.id}`
          )
        ];
      }),
      [Markup.button.callback('✅ Завершить добавление', 'finish_adding')],
      [Markup.button.callback('❌ Отменить', 'cancel_order')],
    ]);

    let message = '📦 Выберите товар:\n\n';
    if (session.items.length > 0) {
      message += 'Добавлено:\n';
      session.items.forEach((item, idx) => {
        message += `${idx + 1}. ${item.productName} - ${item.quantity} шт\n`;
      });
      message += '\n';
    }

    await ctx.reply(message, keyboard);
  }

  // Handle product selection
  bot.action(/^product:(.+)$/, async (ctx) => {
    const productId = ctx.match[1];

    if (!ctx.chat) return;

    const session = getSession(ctx.chat.id);

    if (session.step !== 'adding_products') {
      await ctx.answerCbQuery('Неверный шаг');
      return;
    }

    session.currentProductId = productId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    await ctx.answerCbQuery();
    await ctx.reply(
      `📦 ${product?.name}\n\n` +
      'Введите количество (число):'
    );
  });

  // Handle text input (phone, company name, or quantity)
  bot.on('text', async (ctx) => {
    const session = getSession(ctx.chat.id);
    const text = ctx.message.text;

    // Handle phone number input - ONLY via contact button for security
    if (session.step === 'entering_phone') {
      await ctx.reply(
        '⚠️ Для безопасности используйте кнопку "📱 Отправить номер телефона"\n\n' +
        'Ввод номера вручную отключен.'
      );
      return;
    }

    // Handle company name input
    if (session.step === 'entering_company_name') {
      const companyName = text.trim();

      if (companyName.length < 2) {
        await ctx.reply('❌ Название слишком короткое. Введите название компании:');
        return;
      }

      session.companyName = companyName;
      session.step = 'entering_address';

      await ctx.reply(
        `✅ Компания: ${companyName}\n\n` +
        '📍 Теперь введите адрес доставки:\n' +
        '(например: г. Ташкент, ул. Амира Темура 12)'
      );
      return;
    }

    // Handle delivery address input
    if (session.step === 'entering_address') {
      const address = text.trim();

      if (address.length < 5) {
        await ctx.reply('❌ Адрес слишком короткий. Введите полный адрес доставки:');
        return;
      }

      try {
        // Check if this is a new customer or existing customer adding first branch
        if (session.customerId) {
          // Existing customer - just create branch
          const customer = await prisma.customer.findUnique({
            where: { id: session.customerId },
            select: { name: true, customerCode: true }
          });

          // Generate unique branchCode using customer code
          const branchCode = `${customer!.customerCode}_MAIN`;

          const branch = await prisma.customerBranch.create({
            data: {
              customerId: session.customerId,
              branchCode: branchCode,
              branchName: 'Главный офис',
              fullName: `${customer!.name} - Главный офис`,
              deliveryAddress: address,
              isActive: true,
            },
          });

          session.branchId = branch.id;
          session.step = 'adding_products';

          await ctx.reply(
            `✅ Адрес доставки добавлен!\n\n` +
            `📍 ${address}\n\n` +
            `Теперь добавьте товары для заказа:`
          );

          await showProducts(ctx, session);
        } else {
          // New customer - create customer and branch
          // Generate simple customer code (e.g., SP01, SP02)
          // Extract initials from company name
          const words = session.companyName!.trim().split(/\s+/);
          const initials = words.length > 1
            ? words.map(w => w[0]).join('').toUpperCase().slice(0, 2)
            : session.companyName!.substring(0, 2).toUpperCase();

          // Get next sequential number
          const customerCount = await prisma.customer.count();
          const sequentialNumber = (customerCount + 1).toString().padStart(2, '0');
          const customerCode = `${initials}${sequentialNumber}`;

          const customer = await prisma.customer.create({
            data: {
              name: session.companyName!,
              phone: session.phoneNumber!,
              customerCode: customerCode,
              isActive: true,
            },
          });

          // Generate unique branchCode using customer code
          const branchCode = `${customerCode}_MAIN`;

          const branch = await prisma.customerBranch.create({
            data: {
              customerId: customer.id,
              branchCode: branchCode,
              branchName: 'Главный офис',
              fullName: `${session.companyName} - Главный офис`,
              deliveryAddress: address,
              isActive: true,
            },
          });

          session.customerId = customer.id;
          session.branchId = branch.id;
          session.step = 'adding_products';

          await ctx.reply(
            `✅ Регистрация завершена!\n\n` +
            `🏢 ${session.companyName}\n` +
            `📍 ${address}\n\n` +
            `Теперь добавьте товары для заказа:`
          );

          await showProducts(ctx, session);
        }
      } catch (error: any) {
        await ctx.reply(`❌ Ошибка: ${error.message}\n\nПопробуйте позже или обратитесь к администратору.`);
        clearSession(ctx.chat.id);
      }
      return;
    }

    // Handle quantity input
    if (session.step === 'adding_products' && session.currentProductId) {
      const quantity = parseFloat(text);

      if (isNaN(quantity) || quantity <= 0) {
        await ctx.reply('❌ Неверное количество. Введите число больше 0:');
        return;
      }

      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: session.currentProductId },
        select: {
          id: true,
          name: true,
          sapCode: true,
          unitPrice: true,
          customerPrices: {
            where: { customerId: session.customerId },
          }
        },
      });

      if (!product) {
        await ctx.reply('❌ Товар не найден');
        return;
      }

      const unitPrice = product.customerPrices[0]?.unitPrice || product.unitPrice;

      // Add to items
      session.items.push({
        productId: product.id,
        productName: product.name,
        sapCode: product.sapCode || undefined,
        quantity,
        unitPrice,
      });

      session.currentProductId = undefined;

      await ctx.reply(`✅ Добавлено: ${product.name} - ${quantity} шт`);

      // Show products again
      await showProducts(ctx, session);
      return;
    }
  });

  // Handle finish adding
  bot.action('finish_adding', async (ctx) => {
    if (!ctx.chat) return;
    const session = getSession(ctx.chat.id);

    if (session.step !== 'adding_products') {
      await ctx.answerCbQuery('Неверный шаг');
      return;
    }

    if (session.items.length === 0) {
      await ctx.answerCbQuery('Добавьте хотя бы один товар');
      return;
    }

    session.step = 'confirming';

    // Calculate totals
    let subtotal = 0;
    let orderSummary = '📋 Подтверждение заказа:\n\n';

    // Get customer and branch names
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { name: true, hasVat: true, taxStatus: true },
    });
    const branch = await prisma.customerBranch.findUnique({
      where: { id: session.branchId },
      select: { fullName: true, branchName: true },
    });

    const isVatPayer = customer?.taxStatus === 'VAT_PAYER' || customer?.hasVat;

    orderSummary += `👥 Клиент: ${customer?.name}\n`;
    orderSummary += `🏪 Филиал: ${branch?.fullName || branch?.branchName}\n\n`;
    orderSummary += '📦 Товары:\n';

    session.items.forEach((item, idx) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      orderSummary += `${idx + 1}. ${item.productName}\n`;
      orderSummary += `   ${item.quantity} × ${formatPrice(item.unitPrice)} = ${formatPrice(itemTotal)} сўм\n`;
    });

    // Calculate VAT only if customer is VAT-registered
    const vatAmount = isVatPayer ? subtotal * 0.12 : 0;
    const totalAmount = subtotal + vatAmount;

    orderSummary += `\n💰 Итого:\n`;
    orderSummary += `   Сумма: ${formatPrice(subtotal)} сўм\n`;
    if (isVatPayer) {
      orderSummary += `   НДС (12%): ${formatPrice(vatAmount)} сўм\n`;
    }
    orderSummary += `   Всего: ${formatPrice(totalAmount)} сўм\n`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_order')],
      [Markup.button.callback('❌ Отменить', 'cancel_order')],
    ]);

    await ctx.answerCbQuery();
    await ctx.editMessageText(orderSummary, keyboard);
  });

  // Handle order confirmation
  bot.action('confirm_order', async (ctx) => {
    if (!ctx.chat) return;
    const session = getSession(ctx.chat.id);

    if (session.step !== 'confirming') {
      await ctx.answerCbQuery('Неверный шаг');
      return;
    }

    try {
      // Generate order number
      const lastOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace(/\D/g, '')) : 0;
      const orderNumber = `TG${String(lastNum + 1).padStart(8, '0')}`;

      // Get customer's VAT setting
      const customer = await prisma.customer.findUnique({
        where: { id: session.customerId },
        select: { hasVat: true, taxStatus: true },
      });

      const isVatPayer = customer?.taxStatus === 'VAT_PAYER' || customer?.hasVat;

      // Calculate totals
      let subtotal = 0;
      let vatAmount = 0;
      let totalAmount = 0;

      session.items.forEach(item => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemVat = isVatPayer ? itemSubtotal * 0.12 : 0;
        subtotal += itemSubtotal;
        vatAmount += itemVat;
        totalAmount += itemSubtotal + itemVat;
      });

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          orderDate: new Date(),
          customerId: session.customerId!,
          sourceType: 'DETAILED',
          subtotal,
          vatAmount,
          totalAmount,
          status: 'NEW',
        },
      });

      // Create order items
      for (const item of session.items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemVat = isVatPayer ? itemSubtotal * 0.12 : 0;
        const itemTotal = itemSubtotal + itemVat;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            branchId: session.branchId!,
            productId: item.productId,
            productName: item.productName,
            sapCode: item.sapCode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: itemSubtotal,
            vatRate: isVatPayer ? 12 : 0,
            vatAmount: itemVat,
            totalAmount: itemTotal,
          },
        });
      }

      await ctx.answerCbQuery('✅ Заказ создан!');
      await ctx.editMessageText(
        `✅ Заказ успешно создан!\n\n` +
        `📝 Номер заказа: ${orderNumber}\n` +
        `💰 Сумма: ${formatPrice(totalAmount)} сўм\n\n` +
        `Используйте /order для создания нового заказа`
      );

      clearSession(ctx.chat.id);
    } catch (error: any) {
      console.error('Error creating order:', error);
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `❌ Ошибка создания заказа:\n${error.message}\n\n` +
        `Используйте /order для повторной попытки`
      );
      clearSession(ctx.chat.id);
    }
  });

  // Handle cancel
  bot.action('cancel_order', async (ctx) => {
    if (!ctx.chat) return;
    clearSession(ctx.chat.id);
    await ctx.answerCbQuery('Отменено');
    await ctx.editMessageText('❌ Заказ отменен\n\nИспользуйте /order для создания нового заказа');
  });

  return bot;
}
