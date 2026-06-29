// Local session state, persisted in the OS keystore via expo-secure-store.
// NOTE: the original app stored only a phone number + boolean flags and had NO
// server session token. That is a security weakness (see docs/AUDIT.md §4).
// This module keeps the same keys for compatibility but adds an optional token
// slot so a real session token can be introduced backend-side later.
import * as SecureStore from "expo-secure-store";

const KEYS = {
  registered: "mpesa_registered",
  phone: "mpesa_phone",
  name: "mpesa_name",
  token: "mpesa_token", // reserved for a future server-issued session token
  role: "mpesa_role",
} as const;

export type Session = {
  registered: boolean;
  phone: string | null;
  name: string | null;
  token: string | null;
  role: string | null;
};

export async function getSession(): Promise<Session> {
  const [registered, phone, name, token, role] = await Promise.all([
    SecureStore.getItemAsync(KEYS.registered),
    SecureStore.getItemAsync(KEYS.phone),
    SecureStore.getItemAsync(KEYS.name),
    SecureStore.getItemAsync(KEYS.token),
    SecureStore.getItemAsync(KEYS.role),
  ]);
  return { registered: registered === "true", phone, name, token, role };
}

export async function saveSession(s: {
  phone: string;
  name?: string | null;
  token?: string | null;
  role?: string | null;
}): Promise<void> {
  const ops = [
    SecureStore.setItemAsync(KEYS.registered, "true"),
    SecureStore.setItemAsync(KEYS.phone, s.phone),
  ];
  if (s.name != null) ops.push(SecureStore.setItemAsync(KEYS.name, s.name));
  if (s.token != null) ops.push(SecureStore.setItemAsync(KEYS.token, s.token));
  if (s.role != null) ops.push(SecureStore.setItemAsync(KEYS.role, s.role));
  await Promise.all(ops);
}

export async function clearSession(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
}
