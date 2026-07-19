/**
 * Standard SAE J1979 (OBD-II) Mode 01 PID definitions, request/response
 * parsing, and Mode 03 DTC decoding. Every PID here is part of the public
 * OBD-II standard supported by virtually all 1996+ US / 2001+ EU vehicles.
 *
 * Fields NOT included (knock retard, true wideband AFR, injector duty
 * cycle, etc.) have no generic standard PID — they are manufacturer- or
 * ECU-specific and are intentionally left out rather than faked.
 */

export interface PidDefinition {
  pid: string; // hex PID byte, e.g. '0C'
  name: string;
  bytes: number; // expected data byte count
  decode: (b: number[]) => number;
  unit: string;
}

export const PIDS = {
  RPM: { pid: '0C', name: 'Engine RPM', bytes: 2, decode: ([A, B]) => ((A * 256) + B) / 4, unit: 'rpm' },
  SPEED: { pid: '0D', name: 'Vehicle Speed', bytes: 1, decode: ([A]) => A, unit: 'km/h' },
  COOLANT_TEMP: { pid: '05', name: 'Coolant Temp', bytes: 1, decode: ([A]) => A - 40, unit: 'C' },
  IAT: { pid: '0F', name: 'Intake Air Temp', bytes: 1, decode: ([A]) => A - 40, unit: 'C' },
  THROTTLE: { pid: '11', name: 'Throttle Position', bytes: 1, decode: ([A]) => (A * 100) / 255, unit: '%' },
  MAP: { pid: '0B', name: 'Intake Manifold Pressure', bytes: 1, decode: ([A]) => A, unit: 'kPa' },
  MAF: { pid: '10', name: 'Mass Air Flow', bytes: 2, decode: ([A, B]) => ((A * 256) + B) / 100, unit: 'g/s' },
  ENGINE_LOAD: { pid: '04', name: 'Calculated Engine Load', bytes: 1, decode: ([A]) => (A * 100) / 255, unit: '%' },
  STFT_B1: { pid: '06', name: 'Short Term Fuel Trim B1', bytes: 1, decode: ([A]) => ((A - 128) * 100) / 128, unit: '%' },
  LTFT_B1: { pid: '07', name: 'Long Term Fuel Trim B1', bytes: 1, decode: ([A]) => ((A - 128) * 100) / 128, unit: '%' },
  FUEL_PRESSURE: { pid: '0A', name: 'Fuel Pressure', bytes: 1, decode: ([A]) => A * 3, unit: 'kPa' },
  TIMING_ADVANCE: { pid: '0E', name: 'Timing Advance', bytes: 1, decode: ([A]) => (A - 128) / 2, unit: 'deg' },
  BAROMETRIC: { pid: '33', name: 'Barometric Pressure', bytes: 1, decode: ([A]) => A, unit: 'kPa' },
  MODULE_VOLTAGE: { pid: '42', name: 'Control Module Voltage', bytes: 2, decode: ([A, B]) => ((A * 256) + B) / 1000, unit: 'V' },
  // O2 Sensor 1 Wide-Range Lambda: used to derive an estimated AFR.
  // Only supported on vehicles whose ECU exposes this PID (common on
  // newer gasoline vehicles with wide-range/linear O2 sensors).
  O2_S1_LAMBDA: { pid: '24', name: 'O2 Sensor 1 Lambda', bytes: 4, decode: ([A, B]) => ((A * 256) + B * 1) * 2 / 65536, unit: 'lambda' },
} as const satisfies Record<string, PidDefinition>;

export type PidKey = keyof typeof PIDS;

const STOICH_AFR_GASOLINE = 14.7;

export function estimateAfrFromLambda(lambda: number): number {
  return lambda * STOICH_AFR_GASOLINE;
}

/** Builds the raw ELM327 request string for a Mode 01 PID, e.g. "010C". */
export function buildPidRequest(key: PidKey): string {
  return '01' + PIDS[key].pid;
}

/**
 * Parses a raw ELM327 response for a given PID query.
 * Handles spaces/newlines, "NO DATA"/"UNABLE TO CONNECT"/"?" errors,
 * and locates the "41<PID>" echo before reading the data bytes.
 * Returns null if the vehicle doesn't support/respond to this PID.
 */
export function parsePidResponse(raw: string, key: PidKey): number | null {
  const def = PIDS[key];
  const clean = raw.replace(/[\r\n\s]/g, '').toUpperCase();

  if (!clean || clean.includes('NODATA') || clean.includes('UNABLETOCONNECT') ||
      clean.includes('ERROR') || clean === '?' || clean.includes('SEARCHING')) {
    return null;
  }

  const marker = '41' + def.pid;
  const idx = clean.indexOf(marker);
  if (idx === -1) return null;

  const dataHex = clean.slice(idx + marker.length, idx + marker.length + def.bytes * 2);
  if (dataHex.length < def.bytes * 2) return null;

  const bytes: number[] = [];
  for (let i = 0; i < dataHex.length; i += 2) {
    const b = parseInt(dataHex.slice(i, i + 2), 16);
    if (Number.isNaN(b)) return null;
    bytes.push(b);
  }

  try {
    return def.decode(bytes);
  } catch {
    return null;
  }
}

/** Common generic (SAE-defined) DTC descriptions. Not exhaustive — codes
 * outside this table are still returned, just without a description. */
const DTC_DESCRIPTIONS: Record<string, string> = {
  P0100: 'Mass Air Flow Circuit Malfunction',
  P0101: 'Mass Air Flow Circuit Range/Performance',
  P0110: 'Intake Air Temperature Circuit Malfunction',
  P0116: 'Engine Coolant Temperature Circuit Range/Performance',
  P0117: 'Engine Coolant Temperature Circuit Low Input',
  P0118: 'Engine Coolant Temperature Circuit High Input',
  P0120: 'Throttle Position Sensor Circuit Malfunction',
  P0125: 'Insufficient Coolant Temp for Closed Loop Fuel Control',
  P0128: 'Coolant Thermostat Below Regulating Temperature',
  P0130: 'O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)',
  P0171: 'System Too Lean (Bank 1)',
  P0172: 'System Too Rich (Bank 1)',
  P0174: 'System Too Lean (Bank 2)',
  P0175: 'System Too Rich (Bank 2)',
  P0192: 'Fuel Rail Pressure Sensor Circuit Low Input',
  P0201: 'Injector Circuit Malfunction - Cylinder 1',
  P0217: 'Engine Overtemp Condition',
  P0230: 'Fuel Pump Primary Circuit Malfunction',
  P0234: 'Turbocharger/Supercharger Overboost Condition',
  P0299: 'Turbocharger/Supercharger Underboost Condition',
  P0300: 'Random/Multiple Cylinder Misfire Detected',
  P0301: 'Cylinder 1 Misfire Detected',
  P0302: 'Cylinder 2 Misfire Detected',
  P0303: 'Cylinder 3 Misfire Detected',
  P0304: 'Cylinder 4 Misfire Detected',
  P0325: 'Knock Sensor 1 Circuit Malfunction',
  P0335: 'Crankshaft Position Sensor Circuit Malfunction',
  P0340: 'Camshaft Position Sensor Circuit Malfunction',
  P0401: 'Exhaust Gas Recirculation Flow Insufficient',
  P0410: 'Secondary Air Injection System Malfunction',
  P0420: 'Catalyst System Efficiency Below Threshold (Bank 1)',
  P0430: 'Catalyst System Efficiency Below Threshold (Bank 2)',
  P0440: 'Evaporative Emission Control System Malfunction',
  P0442: 'EVAP System Small Leak Detected',
  P0455: 'EVAP System Large Leak Detected',
  P0500: 'Vehicle Speed Sensor Malfunction',
  P0505: 'Idle Control System Malfunction',
  P0700: 'Transmission Control System Malfunction',
};

/** Decodes one 2-byte DTC pair into a code like "P0171" per SAE J2012. */
function decodeDtcBytes(b1: number, b2: number): string | null {
  if (b1 === 0 && b2 === 0) return null;
  const systemChar = ['P', 'C', 'B', 'U'][(b1 >> 6) & 0x03];
  const firstDigit = ((b1 >> 4) & 0x03).toString();
  const secondDigit = (b1 & 0x0f).toString(16).toUpperCase();
  const lastTwo = b2.toString(16).toUpperCase().padStart(2, '0');
  return `${systemChar}${firstDigit}${secondDigit}${lastTwo}`;
}

export interface DecodedDtc {
  code: string;
  description: string;
}

/** Parses a raw Mode 03 response into decoded DTCs. */
export function parseDtcResponse(raw: string): DecodedDtc[] {
  const clean = raw.replace(/[\r\n\s]/g, '').toUpperCase();
  if (!clean || clean.includes('NODATA') || clean === '?') return [];

  const marker = '43';
  const idx = clean.indexOf(marker);
  if (idx === -1) return [];

  const dataHex = clean.slice(idx + marker.length);
  const results: DecodedDtc[] = [];
  for (let i = 0; i + 4 <= dataHex.length; i += 4) {
    const b1 = parseInt(dataHex.slice(i, i + 2), 16);
    const b2 = parseInt(dataHex.slice(i + 2, i + 4), 16);
    if (Number.isNaN(b1) || Number.isNaN(b2)) continue;
    const code = decodeDtcBytes(b1, b2);
    if (code) {
      results.push({ code, description: DTC_DESCRIPTIONS[code] || 'Manufacturer/Generic Code — see external DTC database' });
    }
  }
  return results;
}

/** Interprets a Mode 04 (clear codes) response as success/failure. */
export function parseClearResponse(raw: string): boolean {
  const clean = raw.replace(/[\r\n\s]/g, '').toUpperCase();
  if (!clean) return false;
  if (clean.includes('NODATA') || clean.includes('7F04')) return false;
  return clean.includes('44') || clean.length > 0;
}
