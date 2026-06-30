// Telegram Bot API helpers for edge functions.
// Matches the helper pattern from backend-lib/telegram.ts
const TELEGRAM_API = "https://api.telegram.org/bot";
function botToken() {
    const t = Deno.env.get("TELEGRAM_BOT_TOKEN");
    return t && t.length > 0 ? t : null;
}
export function adminChatId() {
    const id = Deno.env.get("TELEGRAM_ADMIN_CHAT");
    return id && id.length > 0 ? id : null;
}
export async function sendTelegramMessage(text, opts) {
    const token = botToken();
    const chatId = opts?.chatId ?? adminChatId();
    if (!token || !chatId)
        return { ok: false, error: "Telegram not configured" };
    try {
        const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: opts?.parseMode ?? "HTML",
                disable_web_page_preview: true,
                reply_to_message_id: opts?.replyToMessageId,
            }),
        });
        const body = (await res.json().catch(() => ({})));
        if (!res.ok || !body.ok) {
            return { ok: false, error: body.description || `HTTP ${res.status}` };
        }
        return { ok: true, messageId: body.result?.message_id ?? 0 };
    }
    catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
export async function sendTelegramPhoto(photoUrl, caption, opts) {
    const token = botToken();
    const chatId = opts?.chatId ?? adminChatId();
    if (!token || !chatId)
        return { ok: false, error: "Telegram not configured" };
    try {
        const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photoUrl,
                caption: caption?.slice(0, 1024),
                parse_mode: "HTML",
                reply_to_message_id: opts?.replyToMessageId,
            }),
        });
        const body = (await res.json().catch(() => ({})));
        if (!res.ok || !body.ok) {
            return { ok: false, error: body.description || `HTTP ${res.status}` };
        }
        return { ok: true, messageId: body.result?.message_id ?? 0 };
    }
    catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
export async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
    const token = botToken();
    if (!token)
        return false;
    try {
        const res = await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
                showAlert,
            }),
        });
        return res.ok;
    }
    catch {
        return false;
    }
}
export async function editMessageText(messageId, text, opts) {
    const token = botToken();
    const chatId = opts?.chatId ?? adminChatId();
    if (!token || !chatId)
        return false;
    try {
        const res = await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: opts?.replyMarkup,
            }),
        });
        return res.ok;
    }
    catch {
        return false;
    }
}
