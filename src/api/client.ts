// API client for the Invest254 backend.
//
// The app now talks to the Invest254 REST API (apps/api, base path `/api/v1`):
//   POST /api/v1/auth/register  { phone, username, password, referral_code? }
//                               -> 201 { token, userId, role } | 409 PHONE_TAKEN
//   POST /api/v1/auth/login     { phone, password }
//                               -> 200 { token, userId, role }
//                                  401 INVALID_CREDENTIALS
//                                  403 ACCOUNT_SUSPENDED / ACCOUNT_BANNED
//   GET  /api/v1/wallet         (Bearer) -> 200 { real, bonus, currency }  // cents (KES)
//   GET  /api/v1/auth/me        (Bearer) -> 200 { userId, role, username, phone }
//
// BRIDGE NOTES — the mpesa-style UI is phone + 4-digit PIN, but Invest254 requires a
// username (3–20 chars) and a password (>=8 chars with a letter AND a digit). To keep the
// existing PIN UX working we DETERMINISTICALLY derive both from inputs the user already
// provides (see derivePassword / deriveUsername). This is a demo bridge, not a security
// design: the backend password is recoverable from the PIN. Replace with a real password
// flow before any production use.
//
// IMPORTANT FIX (see docs/AUDIT.md §1) is preserved: login branches on the status code and
// returns a typed outcome so the UI shows the truth and only strikes/locks on a genuine 401.

import Constants from "expo-constants";

export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE ??
  (Constants.expoConfig?.extra?.apiBase as string) ??
  "https://invest254-api.fly.dev";

/** All Invest254 REST routes live under this prefix. */
const API_PREFIX = "/api/v1";

export const PIN_LENGTH = 4;
export const MAX_PIN_ATTEMPTS = 3;
const TIMEOUT_MS = 15000;

// ---------------------------------------------------------------------------
// Auth token (Bearer) — set on login/register, read by the protected endpoints.
// ---------------------------------------------------------------------------
let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}
export function getAuthToken(): string | null {
  return authToken;
}

/** Normalize Kenyan MSISDNs to a single canonical form: 2547XXXXXXXX / 2541XXXXXXXX.
 *  Used for BOTH register and login so identity matching can never silently fail. */
export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "254" + p.slice(1);
  else if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  return p;
}

/** Derive a backend-valid password from the 4-digit PIN: >=8 chars, has a letter + a digit.
 *  Deterministic so the same PIN logs in again. (Demo bridge — see file header.) */
function derivePassword(pin: string): string {
  return `Mpesa${pin}`; // e.g. "1234" -> "Mpesa1234" (9 chars, letter + digit)
}

/** Derive a unique, charset-valid username (3–20 chars, alphanumeric) from the name + phone.
 *  The phone suffix keeps it unique; the sanitized name keeps it human-ish. */
function deriveUsername(name: string, phone: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  const suffix = digits.slice(-5) || "00000";
  let base = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  base = base.slice(0, Math.max(0, 20 - suffix.length)) || "user";
  return `${base}${suffix}`.slice(0, 20);
}

function authHeaders(token?: string | null): Record<string, string> {
  const t = token ?? authToken;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function postJson(path: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${API_PREFIX}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export type RegisterResult =
  | { kind: "ok"; token: string }
  | { kind: "already_exists" }
  | { kind: "error"; message: string }
  | { kind: "network_error"; message: string };

export async function register(rawPhone: string, pin: string, name: string): Promise<RegisterResult> {
  const phone = normalizePhone(rawPhone);
  let res: Response;
  try {
    res = await postJson("/auth/register", {
      phone,
      username: deriveUsername(name, phone),
      password: derivePassword(pin),
    });
  } catch (e: any) {
    return { kind: "network_error", message: networkMessage(e) };
  }
  if (res.ok) {
    const data = await safeJson(res);
    const token = data?.token ?? "";
    setAuthToken(token || null);
    return { kind: "ok", token };
  }
  if (res.status === 409) return { kind: "already_exists" }; // PHONE_TAKEN / USERNAME_TAKEN
  const body = await safeJson(res);
  return { kind: "error", message: friendlyError(body, "Registration failed") };
}

// ---------------------------------------------------------------------------
// Login / verify PIN
// ---------------------------------------------------------------------------
export type LoginOutcome =
  | { kind: "success"; token: string; user: { name: string; balance: number; fuliza: number } }
  | { kind: "wrong_pin" }
  | { kind: "pending_approval"; message: string }
  | { kind: "not_registered" }
  | { kind: "network_error"; message: string }
  | { kind: "server_error"; message: string };

export async function login(rawPhone: string, pin: string): Promise<LoginOutcome> {
  const phone = normalizePhone(rawPhone);
  let res: Response;
  try {
    res = await postJson("/auth/login", { phone, password: derivePassword(pin) });
  } catch (e: any) {
    return { kind: "network_error", message: networkMessage(e) };
  }

  if (res.ok) {
    const data = await safeJson(res);
    const token = data?.token ?? "";
    setAuthToken(token || null);
    // Populate the dashboard figures from the wallet; ignore wallet errors at login time.
    const bal = await getBalance(token);
    return {
      kind: "success",
      token,
      user: {
        name: "", // keep the locally-stored display name; the API has no full name field
        balance: bal.kind === "ok" ? bal.balance : 0,
        fuliza: bal.kind === "ok" ? bal.fuliza : 0,
      },
    };
  }

  if (res.status === 401) return { kind: "wrong_pin" }; // INVALID_CREDENTIALS — the real wrong-PIN case
  if (res.status === 403) {
    const body = await safeJson(res);
    return { kind: "pending_approval", message: friendlyError(body, "Your account isn't active yet. Please contact support.") };
  }
  if (res.status === 404) return { kind: "not_registered" };
  return { kind: "server_error", message: "Something went wrong. Please try again." };
}

// ---------------------------------------------------------------------------
// Balance (polled on the dashboard) — reads the Invest254 wallet (cents -> KES).
// `bonus` is surfaced through the existing "fuliza" slot in the UI.
// ---------------------------------------------------------------------------
export type BalanceResult =
  | { kind: "ok"; balance: number; fuliza: number; name: string }
  | { kind: "error"; message: string };

export async function getBalance(token?: string | null): Promise<BalanceResult> {
  try {
    const res = await fetch(`${API_BASE}${API_PREFIX}/wallet`, { headers: authHeaders(token) });
    if (!res.ok) return { kind: "error", message: `HTTP ${res.status}` };
    const data = await safeJson(res);
    return {
      kind: "ok",
      balance: Number(data?.real ?? 0) / 100,
      fuliza: Number(data?.bonus ?? 0) / 100,
      name: "",
    };
  } catch (e: any) {
    return { kind: "error", message: networkMessage(e) };
  }
}

/** Map an Invest254 error envelope `{ error: { code, message } }` to a friendly string. */
function friendlyError(body: any, fallback: string): string {
  const code: string = body?.error?.code ?? "";
  if (code.startsWith("PASSWORD_")) return "Your PIN can't be used here. Please contact support.";
  if (code.startsWith("USERNAME_")) return "That name is already taken. Try a different one.";
  if (code === "INVALID_PHONE") return "Please enter a valid phone number.";
  return body?.error?.message ?? body?.error ?? fallback;
}

function networkMessage(e: any): string {
  return e?.name === "AbortError"
    ? "Request timed out. Check your connection."
    : "Network error. Please try again.";
}
