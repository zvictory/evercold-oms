const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = "https://api.telegram.org/bot";

interface NotificationPayload {
  type:
    | "ticket_created"
    | "ticket_assigned"
    | "ticket_escalated"
    | "ticket_completed";
  ticketNumber: string;
  ticketId: string;
  branchCode?: string;
  branchName?: string;
  technicianName?: string;
  priority?: string;
  description?: string;
  chatIds: string[]; // Telegram chat IDs to notify
}

export async function sendTelegramNotification(
  payload: NotificationPayload
) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not configured");
    return;
  }

  const message = buildMessage(payload);

  for (const chatId of payload.chatIds) {
    try {
      const response = await fetch(
        `${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(
          `Failed to send Telegram notification to ${chatId}:`,
          error
        );
      }
    } catch (error) {
      console.error(
        `Failed to send Telegram notification to ${chatId}:`,
        error
      );
    }
  }
}

function buildMessage(payload: NotificationPayload): string {
  const prefix = "🔧 <b>EverCold Service Ticket</b>\n\n";

  switch (payload.type) {
    case "ticket_created":
      return (
        prefix +
        `<b>New Ticket Created</b>\n` +
        `Ticket: <code>${payload.ticketNumber}</code>\n` +
        `Branch: ${payload.branchCode} - ${payload.branchName}\n` +
        `Priority: <b>${payload.priority}</b>\n` +
        `Issue: ${payload.description?.substring(0, 50)}...`
      );

    case "ticket_assigned":
      return (
        prefix +
        `<b>Ticket Assigned</b>\n` +
        `Ticket: <code>${payload.ticketNumber}</code>\n` +
        `Assigned to: <b>${payload.technicianName}</b>\n` +
        `Branch: ${payload.branchCode}\n` +
        `Priority: <b>${payload.priority}</b>`
      );

    case "ticket_escalated":
      return (
        prefix +
        `<b>⚠️ Ticket Escalated</b>\n` +
        `Ticket: <code>${payload.ticketNumber}</code>\n` +
        `Escalated to: <b>${payload.technicianName}</b>\n` +
        `Reason: Primary technician did not respond\n` +
        `Branch: ${payload.branchCode}`
      );

    case "ticket_completed":
      return (
        prefix +
        `<b>✅ Service Completed</b>\n` +
        `Ticket: <code>${payload.ticketNumber}</code>\n` +
        `Branch: ${payload.branchCode}\n` +
        `Technician: ${payload.technicianName}\n` +
        `Status: Awaiting manager approval`
      );

    default:
      return prefix + "Unknown event";
  }
}
