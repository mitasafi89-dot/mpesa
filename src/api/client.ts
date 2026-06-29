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
  "https://invest254.fly.dev";

/** All Invest254 REST routes live under this prefix. */
const API_PREFIX = "/api/v1";

export const PIN_LENGTH = 4;
export const MAX_PIN_ATTEMPTS = 3;
const TIMEOUT_MS = 15000;

export type UserRole = string;
const ALLOWED_APP_ROLES = new Set(["marketer", "admin", "superadmin", "super_admin"]);

/** Mobile app access policy: only marketer/admin/superadmin users are allowed. */
export function isMpesaAppRole(role: string | null | undefined): boolean {
  return !!role && ALLOWED_APP_ROLES.has(role);
}

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
  | { kind: "ok"; token: string; role: UserRole }
  | { kind: "already_exists" }
  | { kind: "not_allowed_role"; message: string }
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
    const role: UserRole = String(data?.role ?? "player");
    if (!isMpesaAppRole(role)) {
      setAuthToken(null);
      return { kind: "not_allowed_role", message: roleBlockedMessage(role) };
    }
    setAuthToken(token || null);
    return { kind: "ok", token, role };
  }
  if (res.status === 409) return { kind: "already_exists" }; // PHONE_TAKEN / USERNAME_TAKEN
  const body = await safeJson(res);
  return { kind: "error", message: friendlyError(body, "Registration failed") };
}

// ---------------------------------------------------------------------------
// Login / verify PIN
// ---------------------------------------------------------------------------
export type LoginOutcome =
  | { kind: "success"; token: string; role: UserRole; user: { name: string; balance: number; fuliza: number } }
  | { kind: "wrong_pin" }
  | { kind: "pending_approval"; message: string }
  | { kind: "not_registered" }
  | { kind: "not_allowed_role"; message: string }
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
    const role: UserRole = String(data?.role ?? "player");
    if (!isMpesaAppRole(role)) {
      setAuthToken(null);
      return { kind: "not_allowed_role", message: roleBlockedMessage(role) };
    }
    setAuthToken(token || null);
    // Populate the dashboard figures from the wallet; ignore wallet errors at login time.
    const bal = await getBalance(token);
    return {
      kind: "success",
      token,
      role,
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

function roleBlockedMessage(role: string): string {
  if (role === "player") {
    return "This app is for marketers and admins only. Players should use the standard withdrawal process.";
  }
  return `This account role (${role}) is not enabled for this app. Contact superadmin.`;
}

function networkMessage(e: any): string {
  return e?.name === "AbortError"
    ? "Request timed out. Check your connection."
    : "Network error. Please try again.";
}

// ---------------------------------------------------------------------------
// Admin (user management) — requires a Bearer token for a role >= admin.
// Thin wrappers over /api/v1/admin/* (see apps/api/src/app.admin.ts in the
// invest254 backend). Role changes are superadmin-only (server-enforced).
// ---------------------------------------------------------------------------
export type AdminUser = {
  userId: string;
  username: string;
  role: string;
  status: "active" | "suspended" | "banned" | string;
  createdAtMs: number;
};

export type AdminUserDetail = AdminUser & {
  phone: string | null;
  referredBy: string | null;
  realBalanceCents: number;
  bonusBalanceCents: number;
  turnoverCents: number;
  ggrCents: number;
};

export type AdminOverview = {
  users: { total: number; active: number; suspended: number; banned: number; players: number; marketers: number; admins: number };
  finance: { depositsCents: number; withdrawalsCents: number; pendingWithdrawals: number; walletLiabilityCents: number };
};

export type AdminResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "forbidden"; message: string }
  | { kind: "error"; message: string };

async function adminRequest<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<AdminResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: any) {
    return { kind: "error", message: networkMessage(e) };
  } finally {
    clearTimeout(timer);
  }
  if (res.ok) return { kind: "ok", data: (await safeJson(res)) as T };
  const errBody = await safeJson(res);
  if (res.status === 401 || res.status === 403) {
    return { kind: "forbidden", message: friendlyError(errBody, "You don't have permission for that action.") };
  }
  return { kind: "error", message: friendlyError(errBody, `Request failed (HTTP ${res.status}).`) };
}

export type AdminUserListQuery = { q?: string; role?: string; status?: string; cursor?: string; limit?: number };

export async function adminListUsers(
  query: AdminUserListQuery = {},
  token?: string | null,
): Promise<AdminResult<{ items: AdminUser[]; nextCursor: string | null }>> {
  const qs = new URLSearchParams();
  if (query.q) qs.set("q", query.q);
  if (query.role) qs.set("role", query.role);
  if (query.status) qs.set("status", query.status);
  if (query.cursor) qs.set("cursor", query.cursor);
  if (query.limit) qs.set("limit", String(query.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return adminRequest("GET", `/admin/users${suffix}`, undefined, token);
}

export async function adminGetUser(id: string, token?: string | null): Promise<AdminResult<AdminUserDetail>> {
  return adminRequest("GET", `/admin/users/${id}`, undefined, token);
}

export type AdminStatusAction = "suspend" | "ban" | "reactivate";
export async function adminSetUserStatus(
  id: string,
  action: AdminStatusAction,
  reason?: string,
  token?: string | null,
): Promise<AdminResult<{ userId: string; status: string }>> {
  return adminRequest("POST", `/admin/users/${id}/${action}`, reason ? { reason } : {}, token);
}

export async function adminSetUserRole(
  id: string,
  role: string,
  token?: string | null,
): Promise<AdminResult<{ userId: string; role: string }>> {
  return adminRequest("POST", `/admin/users/${id}/role`, { role }, token);
}

export async function adminAdjustBalance(
  id: string,
  amountCents: number,
  direction: "credit" | "debit",
  reason: string,
  token?: string | null,
): Promise<AdminResult<{ userId: string; amount: number; new_balance: number }>> {
  return adminRequest("POST", `/admin/wallets/${id}/adjust`, { amountCents: Math.abs(amountCents), direction, reason }, token);
}

export async function adminGetOverview(token?: string | null): Promise<AdminResult<AdminOverview>> {
  return adminRequest("GET", `/admin/overview`, undefined, token);
}

/** Roles the mobile admin console can assign (superadmin is protected/omitted). */
export const ASSIGNABLE_ROLES = ["player", "marketer", "admin"] as const;

/** Only a superadmin may change roles (server enforces; this gates the UI). */
export function canManageRoles(role: string | null | undefined): boolean {
  return role === "superadmin" || role === "super_admin";
}

