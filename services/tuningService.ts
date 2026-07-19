
import { Telemetry, TuneSettings, VehicleProfile } from "../types";

const BAROMETRIC_FALLBACK_KPA = 101.3; // sea-level standard, used only if PID 0x33 isn't supported

export const TuningLogic = {
  kpaToPsi: (kpa: number) => kpa * 0.145038,

  /** Boost = MAP - ambient pressure, converted to PSI. Uses a measured barometric reading when available, else the sea-level standard as an approximation. */
  calculateBoostPsi: (mapKpa: number, baroKpa: number | null): number =>
    TuningLogic.kpaToPsi(mapKpa - (baroKpa ?? BAROMETRIC_FALLBACK_KPA)),

  calculateFuelTrim: (currentAfr: number, targetAfr: number): number => {
    const error = currentAfr - targetAfr;
    const pGain = 1.4;
    const correction = (error / targetAfr) * 100 * pGain;
    return Math.max(Math.min(correction, 25), -15);
  },

  /** Local (non-AI) heuristic recommendations from real logged telemetry. Entries with missing (null) readings are skipped rather than treated as zero. */
  optimizeLocally: (logs: Telemetry[], current: TuneSettings, profile: VehicleProfile): Partial<TuneSettings> => {
    const withAfr = logs.filter((l): l is Telemetry & { afr: number; throttle: number } => l.afr !== null && l.throttle !== null);
    const powerLogs = withAfr.filter(l => l.throttle > 50);
    const targetLogs = powerLogs.length > 0 ? powerLogs : withAfr;
    if (targetLogs.length < 5) return {};

    const avgAfr = targetLogs.reduce((acc, l) => acc + l.afr, 0) / targetLogs.length;
    const iatLogs = logs.filter((l): l is Telemetry & { iat: number } => l.iat !== null);
    const avgIAT = iatLogs.length > 0 ? iatLogs.reduce((acc, l) => acc + l.iat, 0) / iatLogs.length : null;

    let suggestions: Partial<TuneSettings> = {};

    // 1. PROFILE SPECIFIC CALIBRATION
    if (profile.id === 'toyota-2000gt-500') {
      suggestions.afrTarget = 11.2;
      if (avgIAT !== null && avgIAT < 40) suggestions.boostLimit = Math.min(current.boostLimit + 1.5, 22);
    } else if (profile.id === 'acura-nsx-s') {
      suggestions.afrTarget = 11.5;
      if (avgIAT !== null && avgIAT > 50) suggestions.ignitionOffset = current.ignitionOffset - 2.0;
    } else if (profile.induction === 'Supercharged') {
      if (avgIAT !== null && avgIAT > 52) {
        suggestions.afrTarget = Math.min(current.afrTarget, profile.safeAFR);
        suggestions.ignitionOffset = current.ignitionOffset - 1.5;
      }
    }

    // 2. FUEL TYPE ADAPTATION
    if (profile.fuelType === 'E85') {
      suggestions.ignitionOffset = (suggestions.ignitionOffset ?? current.ignitionOffset) + 1.0;
    }

    // 3. AFR ERROR CORRECTION
    const afrError = avgAfr - (suggestions.afrTarget ?? current.afrTarget);
    if (Math.abs(afrError) > 0.1) {
      suggestions.fuelCorrection = current.fuelCorrection + (afrError * 12);
    }

    return suggestions;
  }
};
