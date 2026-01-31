
import { Telemetry, TuneSettings, VehicleProfile } from "../types";

export const TuningLogic = {
  VOLTAGE_MIN: 0.5,
  VOLTAGE_MAX: 4.5,
  PSI_MAX: 30.0,

  voltageToPsi: (v: number) => (v - 0.5) * (30.0 / 4.0),
  psiToVoltage: (psi: number) => 0.5 + (psi * (4.0 / 30.0)),

  interceptMapSignal: (originalVoltage: number, boostTarget: number): number => {
    const originalPsi = TuningLogic.voltageToPsi(originalVoltage);
    if (originalPsi > boostTarget && boostTarget > 0) {
      return TuningLogic.psiToVoltage(boostTarget);
    }
    return originalVoltage;
  },

  calculateFuelTrim: (currentAfr: number, targetAfr: number): number => {
    const error = currentAfr - targetAfr;
    const pGain = 1.4; 
    const correction = (error / targetAfr) * 100 * pGain;
    return Math.max(Math.min(correction, 25), -15);
  },

  optimizeLocally: (logs: Telemetry[], current: TuneSettings, profile: VehicleProfile): Partial<TuneSettings> => {
    if (logs.length < 5) return {};

    const powerLogs = logs.filter(l => l.throttle > 50);
    const targetLogs = powerLogs.length > 0 ? powerLogs : logs;

    const avgAfr = targetLogs.reduce((acc, l) => acc + l.afr, 0) / targetLogs.length;
    const maxKnock = Math.max(...targetLogs.map(l => l.knock));
    const avgIAT = targetLogs.reduce((acc, l) => acc + l.iat, 0) / targetLogs.length;

    let suggestions: Partial<TuneSettings> = {};

    // Chip-Specific Performance Multipliers
    const chipMulti = current.chipType === 'Quantum-CAN X1' ? 1.2 : 1.0;

    // 1. PROFILE SPECIFIC CALIBRATION
    if (profile.id === 'toyota-2000gt-500') {
      // 2JZ Logic: High boost tolerance, requires specific AFR enrichment
      suggestions.afrTarget = 11.2;
      if (avgIAT < 40) suggestions.boostLimit = Math.min(current.boostLimit + 1.5 * chipMulti, 22);
    } else if (profile.id === 'acura-nsx-s') {
      // NSX Hybrid: Thermal constraints on twin-turbo, enrichment for battery cooling
      suggestions.afrTarget = 11.5;
      if (avgIAT > 50) suggestions.ignitionOffset = current.ignitionOffset - 2.0;
    } else if (profile.induction === 'Supercharged') {
      if (avgIAT > 52) {
         suggestions.afrTarget = Math.min(current.afrTarget, profile.safeAFR);
         suggestions.ignitionOffset = current.ignitionOffset - 1.5;
      }
    }

    // 2. KNOCK PROTECTION
    if (maxKnock > 0.8) {
      suggestions.ignitionOffset = (suggestions.ignitionOffset || current.ignitionOffset) - (3.0 / chipMulti);
    }

    // 3. FUEL TYPE ADAPTATION
    if (profile.fuelType === 'E85' && maxKnock < 0.2) {
       suggestions.ignitionOffset = (suggestions.ignitionOffset || current.ignitionOffset) + 1.0;
    }

    // 4. AFR ERROR CORRECTION
    const afrError = avgAfr - (suggestions.afrTarget || current.afrTarget);
    if (Math.abs(afrError) > 0.1) {
      suggestions.fuelCorrection = current.fuelCorrection + (afrError * 12);
    }

    return suggestions;
  }
};
