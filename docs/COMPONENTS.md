# Component & Function Inventory (recovered from the bytecode)

Every screen, component, handler and helper below was recovered by decompiling
`original/index.android.bundle`. Names marked **(exact)** were preserved in the
bytecode's function metadata (`// Original name: …`); the rest are inferred from
behaviour. The authoritative, complete logic dump is
`original/index.android.bundle.decompiled.js`.

## Screens (expo-router routes)
| Route | Reconstructed file | Recovered handlers / behaviour |
|---|---|---|
| `index` | `app/index.tsx` | auth gate; reads SecureStore, redirects |
| `register` | `app/register.tsx` | **handleDetailsNext** (exact), **handlePinDigit** (exact), **handleBackspace** (exact), **handleRegister** (exact) → `POST /api/register` |
| `pin` | `app/pin.tsx` | **handlePinDigit** (exact), **handleBackspace** (exact), login/verify via `POST /api/login`, **loadUser** (exact), 10s balance interval |
| `home` | `app/home.tsx` | **loadUser** (exact), **formatBalance** (exact), **handleCardScroll** (exact), **formatDateHeader** (exact), balance poll |
| `send` | `app/send.tsx` | amount validation (10..250,000), consent gate, confirmation |
| `pay` `withdraw` `airtime` `bundles` `request` `scan` `statements` | `app/*.tsx` | action screens (UI recovered; no backend txn endpoints exist) |
| `profile` `settings` | `app/profile.tsx` `app/settings.tsx` | session display, logout, "Stuck? Ask Zuri" |

## Shared components
| Component | File | Notes |
|---|---|---|
| PIN keypad + dots | `src/components/PinPad.tsx` | keys `1-9, ∅, 0, del` (exact layout); shake animation on error |
| Screen scaffold / ComingSoon | `src/components/ScreenScaffold.tsx` | shared header + placeholder |

## Recovered helpers (exact names)
- **formatBalance** — currency formatting for the balance card (`home`).
- **formatDateHeader** — groups the transaction list by date.
- **formatCellValue**, **formatArray**, **formatValue** — list/debug formatting helpers.
- **handleCardScroll** — horizontal balance/Fuliza card carousel.
- **handleModeChange** — light/dark theme switch (mirrored by `usePalette`).
- **loadUser** — fetches/falls back to user profile.

## Backend contract (exact, observed live)
- `POST /api/register {phone,pin,name}` → `200 {success:true}` | `409`
- `POST /api/login {phone,pin}` → `200 {user:{name,balance,fuliza}}` | `401 Invalid PIN` | `403 pending approval` | `404 User not found`
- `GET /api/balance?phone=` → `200 {balance,fuliza,name}`
- Base URL: `https://mpesa.highpesa.com`

## Strings & theme
- Every UI string is preserved exactly in `original/resources/strings.xml` and inside the decompiled bundle.
- App-specific runtime colors (brand green `#4CAF50`, dark surfaces `#121212/#1E1E1E/#2A2A2A`) live in the JS and are reproduced in `src/theme/colors.ts`. Native theme colors are in `original/resources/colors.xml`.
- The native app icon is `original/res-images/sK.webp` (192×192), reproduced as `assets/icon.png`.
