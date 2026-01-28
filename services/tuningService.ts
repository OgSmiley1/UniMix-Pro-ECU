
import { Telemetry, TuneSettings } from "../types";

/**
 * Ported from backend/tuning_engine.py
 * Logic for converting sensor voltages and modifying them for piggyback operations.
 */
export const TuningLogic = {
  VOLTAGE_MIN: 0.5,
  VOLTAGE_MAX: 4.5,
  PSI_MAX: 29.0,

  voltageToPsi: (v: number) => (v - 0.5) * (29.0 / 4.0),
  psiToVoltage: (psi: number) => 0.5 + (psi * (4.0 / 29.0)),

  /**
   * Modifies the MAP signal to fool the ECU (Piggyback Mode)
   */
  interceptMapSignal: (originalVoltage: number, boostTarget: number): number => {
    const originalPsi = TuningLogic.voltageToPsi(originalVoltage);
    if (originalPsi > boostTarget) {
      // Fool ECU into thinking boost is at the target limit
      return TuningLogic.psiToVoltage(boostTarget);
    }
    return originalVoltage;
  },

  /**
   * Ported from backend/optimizer.py
   * Calculates dynamic fuel correction based on AFR drift
   */
  calculateFuelTrim: (currentAfr: number, targetAfr: number): number => {
    if (currentAfr > targetAfr) {
      // Lean: Add fuel
      const correction = ((currentAfr - targetAfr) / targetAfr) * 100;
      return Math.min(correction, 30);
    } else if (currentAfr < targetAfr) {
      // Rich: Reduce fuel
      const correction = ((targetAfr - currentAfr) / targetAfr) * -100;
      return Math.max(correction, -20);
    }
    return 0;
  }
};
