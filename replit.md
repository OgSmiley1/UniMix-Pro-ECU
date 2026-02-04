# UniMix Pro ECU Tuner

## Overview
A React-based ECU tuning application for vehicle performance tuning. Built with TypeScript, Vite, and React.

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
    ├── hardwareService.ts# Hardware interface
    └── tuningService.ts  # Tuning logic
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
- 2026-02-04: Initial Replit setup
  - Configured Vite to use port 5000
  - Added allowedHosts: true for proxy compatibility
  - Added script module entry point to index.html
  - Set up deployment configuration
