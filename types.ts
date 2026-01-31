
export interface Telemetry {
  rpm: number;
  boost: number;
  afr: number;
  coolantTemp: number;
  oilPressure: number;
  speed: number;
  iat: number;
  throttle: number;
  knock: number;
  mapVoltage: number;
  stft: number;
  ltft: number;
  fuelPressure: number;
  injDutyCycle: number;
  gForce: number;
  zeroToSixty: number | null;
  timestamp: number;
}

export type HardwareChip = 'Standard' | 'UniMix V2 Core' | 'Quantum-CAN X1';

export interface TuneSettings {
  afrTarget: number;
  boostLimit: number;
  ignitionOffset: number;
  fuelCorrection: number;
  timingRetardPerPsi: number;
  revLimit: number;
  crackleIntensity: number; // 0-100 for popcorn backfire intensity
  chipType: HardwareChip;
  topSpeedLimit: number;
  globalOffset: number; // Overall scaling factor
}

export interface VehicleProfile {
  id: string;
  name: string;
  engine: string;
  maxBoost: number;
  safeAFR: number;
  fuelType: '91' | '93' | 'E85' | 'Racing';
  vinPrefix: string;
  ecuType: string;
  displacement: number;
  induction: 'Turbo' | 'Supercharged' | 'N/A';
  turboSize: string;
  peakTorque: string;
}

export type AppTab = 'dashboard' | 'tune' | 'maps' | 'logs' | 'dtc' | 'settings' | 'files';
