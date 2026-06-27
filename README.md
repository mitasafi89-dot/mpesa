# My OneApp — M-PESA clone (reconstructed)

A React Native + Expo (SDK 55, expo-router) mobile app: a Safaricom M-PESA–style
wallet front end with registration, PIN login, a balance dashboard, and
money-movement screens, talking to the backend at `https://mpesa.highpesa.com`.

> ## ⚠️ How this repository was produced
> The original project source was lost. This codebase was **reconstructed by
> decompiling the shipped APK's Hermes bytecode bundle** (`assets/index.android.bundle`)
> and rebuilding the logic, screens, API layer, theme and data model in clean,
> typed source. It is **behaviour-faithful, not byte-identical** to the lost
> original. JSX/styling is a faithful re-creation from the recovered layout,
> colours (`#4CAF50` brand green), keypad layout, strings and flows.
>
> While reconstructing it, a real production bug was found and **fixed** (see below),
> and several security/PII problems from the original were **removed**.

---

## 🐛 The PIN bug that prompted this rebuild — fixed

**Symptom:** "the app won't accept the PIN the user sets."

**Root cause (confirmed live against the backend):** new accounts are gated behind
manual approval. Registering returns `200 {success:true}`, but logging in with the
**correct** PIN returns `403 {"error":"Your account is pending approval…"}`. The
original login screen only checked `response.ok`, so it treated that 403 — and 404s
and network errors — as a **wrong PIN**, decremented the attempt counter, and
**locked the account after 3 tries**. The string "pending approval" wasn't even
present in the app, so it could never be shown.

**Fix (this repo):** `src/api/client.ts#login` returns a typed outcome and
`app/pin.tsx` branches on it:

| Server | Outcome | UI behaviour |
|---|---|---|
| `200` | success | go to `/home` |
| `401 Invalid PIN` | `wrong_pin` | count attempt, show "N attempts left", lock at 3 |
| `403 pending approval` | `pending_approval` | show the real message, **no strike, no lock** |
| `404 User not found` | `not_registered` | route to `/register` |
| network / `5xx` | `network_error` / `server_error` | friendly retry, **no strike** |

A standalone annotated reference of the fix is in [`docs/login.fixed.reference.ts`](docs/login.fixed.reference.ts).
Full diagnosis and the complete audit: [`docs/AUDIT.md`](docs/AUDIT.md).

---

## 🚀 Getting started

```bash
npm install            # or: npx expo install (recommended to resolve SDK 55 versions)
cp .env.example .env   # set EXPO_PUBLIC_API_BASE if different
npx expo start         # press a (Android) / i (iOS) / w (web)
```

Build native binaries with EAS or `npx expo run:android` (requires Android SDK).

## 🗂 Project structure

```
app/                       expo-router screens (file = route)
  _layout.tsx              root Stack
  index.tsx                auth gate → /pin or /register
  register.tsx             details → set PIN → confirm PIN → POST /api/register
  pin.tsx                  PIN unlock/login  ← contains the bug fix
  home.tsx                 dashboard (balance polled every 10s)
  send.tsx                 interactive Send Money (amount/consent validation)
  pay / withdraw / airtime / bundles / request / scan / statements / profile / settings
src/
  api/client.ts            login / register / getBalance + phone normalization
  auth/session.ts          SecureStore session (registered/phone/name/+token slot)
  data/mock.ts             sample recents + quick actions (sanitized, no PII/PIN)
  theme/colors.ts          light/dark palette + brand green
  components/PinPad.tsx     keypad + PIN dots
  components/ScreenScaffold.tsx  shared header / ComingSoon
docs/
  AUDIT.md                 full code audit, security, usability, business-logic plan
  ARCHITECTURE.md          data flow + backend contract
  COMPONENTS.md            inventory of every recovered screen/component/function
  REVERSE_ENGINEERING.md   exact vs reconstructed — fidelity statement
  login.fixed.reference.ts annotated standalone fix
original/                  ⬅ the EXACT originals extracted from the APK
  index.android.bundle             the shipped app logic (every byte)
  index.android.bundle.decompiled.js  full decompilation of the bundle
  AndroidManifest.xml · app.config.json · kotlin-tooling-metadata.json
  resources/strings.xml · resources/colors.xml
  res-images/                      all 253 raster assets, exact bytes
```

## 📦 Fidelity (read this)
- **`original/` is byte/pixel-exact** — copied verbatim from the APK (bundle,
  manifest, config, strings, colors, all raster images incl. the real launcher
  icon `res-images/sK.webp`).
- **`app/` + `src/` are a faithful reconstruction**, not the original source
  files. Release **Hermes bytecode is lossy/one-way**: it permanently discards
  original file boundaries, comments, formatting, types and (in release) variable
  names, so byte-exact *source* cannot be recovered from any RN/Expo APK. Behaviour,
  screens, strings, keypad, colors and the API contract are reproduced exactly.
  Full statement: [`docs/REVERSE_ENGINEERING.md`](docs/REVERSE_ENGINEERING.md).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data flow and backend contract.

## 🔐 Backend API (as observed)

- `POST /api/register` `{phone, pin, name}` → `200 {success}` | `409` exists
- `POST /api/login` `{phone, pin}` → `200 {user:{name,balance,fuliza}}` | `401` | `403` | `404`
- `GET  /api/balance?phone=…` → `200 {balance, fuliza, name}` — **currently unauthenticated (IDOR, see AUDIT §4.1)**

## 🔧 Changes vs. the original (intentional)

- **Bug fix:** status-aware PIN login (above).
- **Security:** removed hardcoded PII + default `pin:"1234"` from the bundle;
  dropped risky permissions (`SYSTEM_ALERT_WINDOW`, legacy storage); `allowBackup:false`;
  renamed package to `com.example.oneapp` (the original impersonated Safaricom).
- **Robustness:** canonical phone normalization shared by register/login/balance;
  request timeouts; typed outcomes.

These and the remaining backend hardening items (auth tokens, server-side rate
limiting, PIN hashing) are tracked in [`docs/AUDIT.md`](docs/AUDIT.md) §4–§6.

## ⚖️ Disclaimer

Educational reconstruction. "M-PESA" and "Safaricom" are trademarks of Safaricom PLC;
this project is not affiliated with or endorsed by them. Do not ship under their branding.
