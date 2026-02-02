# Telegram Bot Setup Guide

## 📱 Step 1: Create Your Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/start` to BotFather
3. Send `/newbot` to create a new bot
4. Choose a name for your bot (e.g., "EverCold Orders")
5. Choose a username (must end with 'bot', e.g., "evercold_orders_bot")
6. **Copy the bot token** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

## 🔧 Step 2: Configure the Bot

1. Open `.env` file in your project
2. Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
3. Save the file

## 🚀 Step 3: Run the Bot

```bash
npx tsx telegram-bot.ts
```

You should see:
```
🤖 Starting Telegram bot...
✅ Telegram bot is running!
📱 Send /start to your bot to begin
```

## 📝 Step 4: Test the Bot

1. In Telegram, search for your bot username
2. Start a chat with the bot
3. Send `/start` - you should get a welcome message
4. Send `/order` to create your first order!

## 🎯 How to Use

### Create an Order:

1. **Start**: `/order`
2. **Select Customer**: Choose from the list
3. **Select Branch**: Choose branch for delivery
4. **Add Products**:
   - Click on a product
   - Enter quantity (number)
   - Repeat for more products
5. **Finish**: Click "✅ Завершить добавление"
6. **Confirm**: Review and click "✅ Подтвердить"

### Commands:

- `/start` - Welcome message
- `/order` - Create new order
- `/cancel` - Cancel current order
- `/help` - Show help

## 🔄 Running in Production

For production, you should:

1. **Use webhook instead of polling**:
   - Set webhook URL: `https://yourdomain.com/api/telegram/webhook`
   - Use this command:
     ```bash
     curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
     ```

2. **Run bot as a service**:
   - Use PM2, systemd, or Docker
   - Example with PM2:
     ```bash
     pm2 start telegram-bot.ts --name telegram-bot
     pm2 save
     ```

## 🛠️ Troubleshooting

**Bot not responding?**
- Check if bot is running: `ps aux | grep telegram-bot`
- Check token is correct in `.env`
- Make sure no other instance is running

**Database errors?**
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Run `npm run db:push` to sync schema

**Products not showing?**
- Add products via web interface first
- Check products are active: `isActive: true`

## 📊 Features

✅ Interactive order creation
✅ Customer & branch selection
✅ Product catalog with prices
✅ Quantity input
✅ Order confirmation
✅ Automatic order numbering (TG prefix)
✅ VAT calculation (12%)
✅ Real-time price updates
✅ Multi-product orders
✅ Order summary before confirmation

## 🔜 Future Enhancements

- [ ] View order history
- [ ] Order status updates
- [ ] Edit existing orders
- [ ] Delivery tracking
- [ ] Daily/weekly reports
- [ ] Multi-language support
- [ ] Image upload for products
- [ ] Barcode scanning
