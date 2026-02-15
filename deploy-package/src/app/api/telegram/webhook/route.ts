import { NextRequest, NextResponse } from 'next/server';
import { createBot } from '@/lib/telegram/bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

let bot: ReturnType<typeof createBot> | null = null;

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    if (!bot) {
      bot = createBot(BOT_TOKEN);
    }

    const update = await request.json();

    // Process the update
    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
