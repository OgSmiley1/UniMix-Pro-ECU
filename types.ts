
/**
 * Live telemetry sourced from real OBD-II Mode 01 PIDs. Fields with no
 * standard PID (knock, injector duty cycle, oil pressure, true wideband
 * AFR, fuel pressure) are typed nullable — they read `null` unless a
 * manufacturer-specific PID or an extra sensor is wired in. UI must
 * render "N/A", never fabricate a value.
 */
export interface Telemetry {
  rpm: number | null;
  boost: number | null; // derived: MAP kPa - barometric kPa, converted to PSI
  mapKpa: number | null; // raw PID 0B, standard
  afr: number | null; // estimated from O2 lambda PID (0x24); not true wideband
  coolantTemp: number | null;
  oilPressure: number | null; // no standard PID; requires manufacturer-specific PID
  speed: number | null;
  iat: number | null;
  throttle: number | null;
  knock: number | null; // no standard PID; requires standalone ECU or knock sensor tap
  stft: number | null;
  ltft: number | null;
  fuelPressure: number | null; // PID 0A when supported (relative fuel rail pressure)
  injDutyCycle: number | null; // no standard PID
  moduleVoltage: number | null;
  timingAdvance: number | null;
  engineLoad: number | null;
  gForce: number | null; // from phone accelerometer (DeviceMotion), if granted
  zeroToSixty: number | null; // real timer computed from actual speed PID transitions
  timestamp: number;
}

export type HardwareChip = 'Standard' | 'UniMix V2 Core' | 'Quantum-CAN X1';

export interface TuneSettings {
  afrTarget: number;
  boostLimit: number;
  ignitionOffset: number;
  fuelCorrection: number;
  timingRetardPerPsi: number;
  revLimit: number; // recommended rev limiter target (RPM)
  crackleIntensity: number; // 0-100 for popcorn backfire intensity
  chipType: HardwareChip;
  topSpeedLimit: number;
}

export interface VehicleProfile {
  id: string;
  name: string;
  engine: string;
  maxBoost: number;
  safeAFR: number;
  // US (R+M)/2) and RON-labeled Middle East pump grades, plus common track fuels.
  fuelType: '91' | '93' | '95' | '98' | 'E85' | 'Racing' | 'Diesel';
  vinPrefix: string;
  ecuType: string;
  displacement: number;
  induction: 'Turbo' | 'Supercharged' | 'N/A';
  turboSize: string;
  peakTorque: string;
  region?: string; // e.g. 'JDM', 'UAE/GCC', 'USDM'
  notes?: string; // platform-specific tuning context: known weak points, what forums agree to avoid
}

export type AppTab = 'dashboard' | 'tune' | 'maps' | 'logs' | 'dtc' | 'settings' | 'files';
