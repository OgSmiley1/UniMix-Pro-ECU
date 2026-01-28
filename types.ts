
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

export interface TuneSettings {
  afrTarget: number;
  boostLimit: number;
  ignitionOffset: number;
  fuelCorrection: number;
  timingRetardPerPsi: number;
  revLimit: number;
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
  turboSize: string;
}

export type AppTab = 'dashboard' | 'tune' | 'maps' | 'logs' | 'dtc' | 'settings';
