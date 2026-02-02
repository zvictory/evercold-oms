import { NextRequest, NextResponse } from 'next/server';
import { createBot } from '@/lib/telegram/bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const bot = createBot(BOT_TOKEN);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process the update with Telegraf
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Telegram webhook endpoint is active'
  });
}
