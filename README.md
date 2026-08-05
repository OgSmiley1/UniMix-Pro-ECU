# UniMix Pro ECU Tuner

A real-time OBD-II diagnostics and tuning-advisory app. It connects to an
actual vehicle over a Bluetooth LE ELM327 adapter, reads live engine data,
watches it against platform-specific safety limits, and produces
grounded tuning recommendations. There is **no simulated telemetry** — every
gauge reads a real PID or shows `N/A`.

## What it does

- **Live OBD-II telemetry** — RPM, speed, coolant/intake temp, throttle,
  MAP-derived boost, fuel trims, timing advance, module voltage, and an
  O2-lambda-derived AFR estimate, polled directly from the ECU
  (`services/obd2.ts`, `services/hardwareService.ts`).
- **Real-time safety monitor** — a deterministic, no-dependency watcher
  (`services/safetyMonitor.ts`) that flags overboost, lean-under-boost,
  overheat, heat soak, abnormal fuel trims, and low charging voltage the
  instant they cross a known danger line, shown as a banner on the Dashboard.
- **Grounded tuning knowledge** — forum-researched explanations of
  crackle/popcorn tuning, boost control, water/methanol injection, and 2-step
  launch control, plus platform-specific notes for JDM legends and UAE/GCC
  icons (`services/tuningKnowledge.ts`, `constants.ts`).
- **AI tuning advisor** (optional) — Gemini analyzes real logged data against
  the vehicle's known failure modes and suggests target values with a safe
  operating envelope. Requires a `GEMINI_API_KEY`; degrades gracefully to
  the local heuristic advisor if absent.
- **Diagnostics** — real Mode 03 DTC read and Mode 04 clear.
- **Data logging** — record a session and export it to CSV.
- **Tune profiles** — save/load recommended tune targets locally.

## Scope and limits

- **Reading** live data is fully implemented over standard OBD-II.
- **Writing** tune values into an ECU is intentionally out of scope: stock
  ECUs require manufacturer-specific security-access protocols, and standalone
  ECUs (Haltech/MoTeC/AEM/Link) lock map writes behind their own licensed
  software. The Tune Editor therefore produces **recommended targets** you
  apply in the vehicle's own tuning tool, not live writes.
- Some values (knock retard, injector duty cycle, true wideband AFR, oil
  pressure) have no standard OBD-II PID and always read `N/A` on a stock ECU.

## Hardware requirements

- A **Bluetooth LE** ELM327 OBD-II adapter (BLE/4.0/5.0 — *not* a Classic
  Bluetooth SPP dongle; Web Bluetooth cannot see those).
- **Android** with **Chrome or Edge** (iOS browsers don't implement Web
  Bluetooth).
- The page must be served over **HTTPS** (or `localhost`) — a secure context
  is required for Web Bluetooth.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. (Optional, for the AI advisor) copy `.env.local.example` to `.env.local`
   and set your `GEMINI_API_KEY`.
3. Run the app: `npm run dev` (serves on port 5000)

## Scripts

- `npm run dev` — Vite dev server on port 5000
- `npm run build` — production bundle
- `npm run preview` — serve the production build
