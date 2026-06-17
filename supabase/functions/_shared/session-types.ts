// Shared session types for Telegram bot.

export type HikeSessionFields =
  | { type: "hike-new"; draft?: unknown }
  | { type: "hike-new-check"; draft: Record<string, unknown>; pendingFields: string[]; currentFieldIndex: number }
  | { type: "hike-edit"; pick?: { id: string; title: string; date: string } }
  | { type: "hike-edit-field"; hikeId: string; field: string; partial: Record<string, unknown> }
  | { type: "hike-delete"; selected: string[] }
  | { type: "rent-new"; draft?: unknown }
  | { type: "rent-edit"; pick?: { id: string; name: string } }
  | { type: "rent-edit-field"; itemId: string; field: string; partial: Record<string, unknown> }
  | { type: "rent-delete"; selected: string[] };
