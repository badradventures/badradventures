-- Bot sessions table for the Telegram edge function.
-- Stores multi-step session state so it survives cold starts.
-- Each row is keyed by chat_id (text). Only one active session per chat.

CREATE TABLE IF NOT EXISTS bot_sessions (
  chat_id TEXT PRIMARY KEY,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow service_role to read/write (edge functions use service role)
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON bot_sessions TO service_role;
