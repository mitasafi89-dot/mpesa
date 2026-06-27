# Reverse-engineering method & fidelity

This repo was rebuilt from the shipped `mpesa.apk`. This document states exactly
**what is byte/pixel-identical to the original** and **what is a faithful
reconstruction**, so there is no ambiguity.

## How it was done
1. Unzipped the APK.
2. Detected the app is **React Native + Expo (SDK 55)**; all app logic ships as a
   **Hermes bytecode** bundle (`assets/index.android.bundle`), not Java/Kotlin.
3. Decompiled the Hermes bytecode to readable pseudo-JS (full dump in
   `original/index.android.bundle.decompiled.js`).
4. Traced the auth/data flow, recovered every screen, handler, string and the
   backend contract; confirmed behaviour live against `https://mpesa.highpesa.com`.
5. Extracted exact resources (icon, images, strings, colors, manifest, config).
6. Re-authored clean, typed `app/` + `src/` source matching the recovered logic,
   and **fixed** the PIN-login bug found along the way.

## ✅ Byte-/pixel-exact in this repo (the real originals)
Everything in `original/` is copied verbatim from the APK:
- `original/index.android.bundle` — the exact shipped app logic (every byte).
- `original/index.android.bundle.decompiled.js` — full decompilation of that bundle.
- `original/AndroidManifest.xml` — decoded manifest (package, perms, components).
- `original/app.config.json` — exact Expo config.
- `original/kotlin-tooling-metadata.json` — exact build metadata.
- `original/resources/strings.xml`, `colors.xml` — exact resource tables.
- `original/res-images/` — **all 253 raster assets, exact bytes** (icons, splash, illustrations; names are the APK's shrunk names, e.g. `sK.webp` = launcher icon).
- `assets/icon.png` — the real launcher icon (`sK.webp`, 192×192) re-encoded as PNG.

## 🔁 Faithful reconstruction (not byte-identical — and why it can't be)
The files under `app/` and `src/` are re-authored TypeScript. They reproduce the
original's **behaviour, screens, flows, strings, keypad, colors and API calls**,
but they are **not** the original source files, because:

- **Hermes release compilation is lossy and one-way.** It permanently discards:
  original file/module boundaries, comments, formatting, TypeScript types, and
  (in release mode) local variable and most parameter names. That information is
  **not present anywhere in the APK** — so no tool can reproduce the exact
  original `.tsx` text. The decompiled bundle is register-based pseudo-code, not
  your authored source.
- What *is* fully preserved and reproduced: control flow, function behaviour,
  recovered function names (`handleRegister`, `handlePinDigit`, `formatBalance`,
  `loadUser`, …), all string literals, the keypad layout, the route set, the
  theme colors, and the exact backend contract.

If you still have any original source fragments, paste them in and the
reconstruction can be aligned to them exactly.

## ✳️ Intentional differences from the original (improvements)
These were changed on purpose (see `AUDIT.md`):
- **Bug fix:** PIN login branches on HTTP status (the original mislabeled a
  correct PIN on a pending account as "Wrong PIN" and locked the account).
- **Security:** removed hardcoded PII + default `pin:"1234"`; dropped risky
  permissions; `allowBackup:false`; package renamed off the Safaricom id.
- These do **not** affect the preserved originals in `original/`.
