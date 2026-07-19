import { Telemetry, VehicleProfile } from '../types';

/**
 * Deterministic, rule-based safety monitor. Runs on every real telemetry
 * poll — no AI/API-key dependency, no 15-second lag. Every threshold here
 * maps directly to a failure mode surfaced in tuningKnowledge.ts's
 * forum-researched common-mistakes list: this is that knowledge acting
 * on live data instead of sitting in a reference panel.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SafetyAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
}

const OVERBOOST_MARGIN_PSI = 1.5;
const LEAN_UNDER_BOOST_MARGIN_AFR = 1.2;
const BOOST_ACTIVE_PSI = 2;
const LOAD_THRESHOLD_PCT = 60;
const HIGH_COOLANT_C = 110;
const CRITICAL_COOLANT_C = 118;
const HIGH_IAT_C = 60;
const FUEL_TRIM_WARN_PCT = 15;
const FUEL_TRIM_CRITICAL_PCT = 25;
const LOW_RUNNING_VOLTAGE = 12.0;

export function evaluateSafety(t: Telemetry, profile: VehicleProfile): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];

  // Overboost — the wastegate/actuator-failure signature every forum
  // thread on boost control warns about.
  if (t.boost !== null && t.boost > profile.maxBoost + OVERBOOST_MARGIN_PSI) {
    alerts.push({
      id: 'overboost',
      severity: 'critical',
      message: `Overboost: ${t.boost.toFixed(1)}PSI exceeds ${profile.name}'s ${profile.maxBoost}PSI limit. Check for a wastegate/actuator fault and confirm a boost-cut failsafe exists before the next pull.`,
    });
  }

  // Lean under load/boost — the single most-cited cause of detonation
  // on forced-induction engines.
  const activeBoostLoad = t.throttle !== null && t.throttle > LOAD_THRESHOLD_PCT && t.boost !== null && t.boost > BOOST_ACTIVE_PSI;
  if (activeBoostLoad && t.afr !== null && t.afr > profile.safeAFR + LEAN_UNDER_BOOST_MARGIN_AFR) {
    alerts.push({
      id: 'lean-under-boost',
      severity: 'critical',
      message: `Lean under boost: AFR ${t.afr.toFixed(1)} vs. a safe target of ~${profile.safeAFR} for this platform. This is the classic detonation setup — back off throttle now.`,
    });
  }

  if (t.coolantTemp !== null && t.coolantTemp >= CRITICAL_COOLANT_C) {
    alerts.push({
      id: 'coolant-critical',
      severity: 'critical',
      message: `Coolant temp ${t.coolantTemp.toFixed(0)}°C — critical overheat range. Stop and let it cool before continuing.`,
    });
  } else if (t.coolantTemp !== null && t.coolantTemp >= HIGH_COOLANT_C) {
    alerts.push({
      id: 'coolant-high',
      severity: 'warning',
      message: `Coolant temp ${t.coolantTemp.toFixed(0)}°C is elevated — reduce load, especially before a wide-open-throttle pull.`,
    });
  }

  if (t.iat !== null && t.iat >= HIGH_IAT_C) {
    alerts.push({
      id: 'heat-soak',
      severity: 'info',
      message: `Intake air temp ${t.iat.toFixed(0)}°C — heat soak narrows your safe boost/timing margin. Let it cool or improve intercooling before pushing harder.`,
    });
  }

  // Large fuel trims mean an existing fault (vacuum leak, injector, MAF),
  // not something to tune around — flag it before AFR readings are trusted.
  const trimChecks: Array<{ id: string; label: string; value: number | null }> = [
    { id: 'stft', label: 'Short-term fuel trim', value: t.stft },
    { id: 'ltft', label: 'Long-term fuel trim', value: t.ltft },
  ];
  for (const check of trimChecks) {
    if (check.value === null) continue;
    const abs = Math.abs(check.value);
    if (abs >= FUEL_TRIM_CRITICAL_PCT) {
      alerts.push({
        id: `trim-critical-${check.id}`,
        severity: 'critical',
        message: `${check.label} ${check.value.toFixed(0)}% is far outside normal — there's likely an existing fault (vacuum leak, injector, MAF). Fix that before tuning on top of it.`,
      });
    } else if (abs >= FUEL_TRIM_WARN_PCT) {
      alerts.push({
        id: `trim-warn-${check.id}`,
        severity: 'warning',
        message: `${check.label} ${check.value.toFixed(0)}% is outside the normal ±10% range — investigate before trusting AFR for tuning decisions.`,
      });
    }
  }

  if (t.moduleVoltage !== null && t.rpm !== null && t.rpm > 800 && t.moduleVoltage < LOW_RUNNING_VOLTAGE) {
    alerts.push({
      id: 'low-voltage',
      severity: 'warning',
      message: `Charging voltage ${t.moduleVoltage.toFixed(1)}V while running is low — a weak battery/alternator can cause erratic ignition and sensor behavior under hard pulls.`,
    });
  }

  return alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function severityRank(s: AlertSeverity): number {
  return s === 'critical' ? 0 : s === 'warning' ? 1 : 2;
}
