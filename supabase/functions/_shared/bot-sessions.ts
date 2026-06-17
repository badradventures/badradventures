// Persistent bot session storage for Telegram edge functions.
// Replaces the in-memory Map so sessions survive cold starts.

import { supabaseAdmin } from "./supabase-client.ts";
import { HikeSessionFields } from "./session-types.ts";

export type Session = {
  kind: HikeSessionFields;
  draft?: unknown;
  lastMessageId?: number;
};

export async function loadSession(chatId: string): Promise<Session | null> {
  const { data, error } = await supabaseAdmin()
    .from("bot_sessions")
    .select("session_data")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) {
    console.error("[bot-sessions] load error:", error.message);
    return null;
  }
  if (!data) return null;
  const raw = (data as any).session_data;
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed as Session;
}

export async function saveSession(chatId: string, session: Session | null): Promise<void> {
  if (session === null) {
    const { error } = await supabaseAdmin()
      .from("bot_sessions")
      .delete()
      .eq("chat_id", chatId);
    if (error) console.error("[bot-sessions] delete error:", error.message);
    return;
  }
  const { error } = await supabaseAdmin()
    .from("bot_sessions")
    .upsert(
      { chat_id: chatId, session_data: JSON.stringify(session), updated_at: new Date().toISOString() },
      { onConflict: "chat_id" },
    );
  if (error) console.error("[bot-sessions] upsert error:", error.message);
}
