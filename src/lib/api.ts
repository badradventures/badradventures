import { supabase } from "./supabase";

export type ApiError = Error & { status?: number; body?: unknown };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await supabase().auth.getSession();
  const accessToken = session.data.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init?.headers as Record<string, string> | undefined ?? {}),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers,
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    const err = new Error(message) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body as T;
}

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  is_admin?: boolean;
};

const STORAGE_KEY = "badr.user";

export function storedUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: (StoredUser & {}) | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearStoredUser() {
  setStoredUser(null);
}

export function formatGbp(pence: number | null | undefined): string {
  const value = typeof pence === "number" && Number.isFinite(pence) ? pence : null;
  if (value === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatDate(iso: string | number | Date, opts?: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...opts,
    });
  } catch {
    return String(iso);
  }
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function cnSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatShortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}