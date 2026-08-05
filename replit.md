# UniMix Pro ECU Tuner

## Overview
A React-based real-time OBD-II diagnostics and tuning-advisory app. Built with TypeScript, Vite, and React. Connects to an actual vehicle over a Bluetooth LE ELM327 OBD-II adapter and reads real live data — there is no simulated/fake telemetry generator.

## What's real vs. what isn't
- **Real**: live OBD-II Mode 01 PID reads (RPM, speed, coolant/intake temp, throttle, MAP-derived boost, fuel trims, timing advance, module voltage), Mode 03/04 DTC read & clear, a real 0-100km/h timer computed from actual speed transitions, AI analysis (Gemini) run on genuine logged telemetry, and local tune-profile save/load via localStorage.
- **Estimated, not a true sensor**: AFR is derived from the O2 sensor wide-range lambda PID (0x24) when the vehicle supports it — labeled "Est. AFR" in the UI, not "wideband AFR" from a real dedicated wideband controller.
- **Not available generically**: knock retard, injector duty cycle, oil pressure, and true wideband AFR have no standard OBD-II PID. These read `null` and show "N/A" — they are never fabricated.
- **Not implemented (by design)**: writing tune values back into the ECU. Generic OBD-II can't reflash a stock ECU (that requires make-specific security-access protocols behind paid tools like HP Tuners/EFILive), and standalone ECUs (Haltech/MoTeC/AEM/Link) lock map-write access behind their own licensed software. The Tune Editor produces *recommended* targets only — apply them through the vehicle's actual tuning tool.

## Tech Stack
- React 19.2.4
- TypeScript 5.8
- Vite 6.2
- Tailwind CSS (CDN)
- Recharts for data visualization
- Google GenAI integration (@google/genai)

## Project Structure
```
/
├── App.tsx              # Main application component with tabs
├── index.tsx            # React entry point
├── index.html           # HTML template
├── types.ts             # TypeScript type definitions
├── constants.ts         # App constants and configuration
├── vite.config.ts       # Vite configuration (port 5000)
├── components/
│   ├── Dashboard.tsx    # Main dashboard with gauges
│   ├── TuneEditor.tsx   # ECU tune parameter editor
│   ├── DataLogger.tsx   # Telemetry data logger
│   ├── MapViewer3D.tsx  # 3D map visualization
│   ├── Settings.tsx     # Application settings
│   ├── ECUReader.tsx    # ECU reading interface
│   ├── LiveTerminal.tsx # Live data terminal
│   ├── FileManager.tsx  # File management
│   └── Gauge.tsx        # Gauge component
└── services/
    ├── geminiService.ts  # Google AI integration
    ├── hardwareService.ts# Real ELM327 BLE connection (Web Bluetooth)
    ├── obd2.ts            # Standard OBD-II PID table, response/DTC parsers
    └── tuningService.ts  # Boost/AFR math and local recommendation heuristics
```

## Running the Application
- Development: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Preview: `npm run preview`

## Configuration
The Vite config is set up to:
- Run on port 5000 with host 0.0.0.0
- Allow all hosts for Replit proxy compatibility
- Load GEMINI_API_KEY from environment

## Environment Variables
- `GEMINI_API_KEY`: Optional Google AI API key for AI features

## Recent Changes
- 2026-07-19: Replaced the simulated telemetry engine with a real OBD-II implementation
  - New `services/obd2.ts`: standard Mode 01 PID table, response parser, Mode 03 DTC decoder (SAE J2012)
  - Rewrote `hardwareService.ts` for real Web Bluetooth ELM327 GATT connections (no simulated fallback)
  - `Telemetry` fields are now nullable; UI shows "N/A" instead of fabricating unsupported readings
  - Removed all fake data generators (random telemetry loop, fake CAN-bus noise, fake DTC/module scan text, fake "RAM write" ECU flashing)
  - Tune Editor reframed as a recommendation engine (real AI analysis of real logged data); it does not claim to write live values to the ECU
  - File Manager now saves/loads real tune profiles via localStorage instead of a hardcoded fake file list
- 2026-02-04: Initial Replit setup
  - Configured Vite to use port 5000
  - Added allowedHosts: true for proxy compatibility
  - Added script module entry point to index.html
  - Set up deployment configuration
