// Lightweight offline deterministic "AI" engine for ECU tuning suggestions.
// No network calls, no API keys. Conservative, safe-by-default heuristics.

import { Telemetry, TuneSettings, VehicleProfile } from "../types";

export type SafeEnvelope = {
  boost: [number, number];
  afr: [number, number];
  ignition: [number, number];
};

type Rules = {
  defaults: {
    safeEnvelope: SafeEnvelope;
    afrTarget: number;
    boostLimit: number;
    ignitionOffset: number;
  };
  heuristics: {
    boostMaxDelta: number;
    afrMaxDelta: number;
    ignitionMaxDelta: number;
    knockThreshold: number;
    boostSafetyMargin: number;
  };
};

const DEFAULTS: Rules = {
  defaults: {
    safeEnvelope: {
      boost: [0, 18],
      afr: [11.8, 14.7],
      ignition: [-6, 8],
    },
    afrTarget: 12.5,
    boostLimit: 8,
    ignitionOffset: 0,
  },
  heuristics: {
    boostMaxDelta: 0.5,
    afrMaxDelta: 0.2,
    ignitionMaxDelta: 0.5,
    knockThreshold: 0.5,
    boostSafetyMargin: 0.9,
  },
};

function summarizeLogs(logs: Telemetry[] | undefined) {
  if (!logs || logs.length === 0) return null;
  const recent = logs.slice(-100);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const boosts = recent.map(l => l.boost ?? 0);
  const afrs = recent.map(l => l.afr ?? 0);
  const knocks = recent.map(l => l.knock ?? 0);
  const rpms = recent.map(l => l.rpm ?? 0);
  return {
    avgBoost: avg(boosts),
    maxBoost: Math.max(...boosts),
    avgAfr: avg(afrs),
    minAfr: Math.min(...afrs),
    maxKnock: Math.max(...knocks),
    avgRpm: avg(rpms),
    peakRpm: Math.max(...rpms),
    count: recent.length
  };
}

/**
 * Suggest a deterministic tune based on safe defaults and telemetry.
 * Returns suggestion partial TuneSettings, conservative reasoning text, and safe envelope.
 */
export async function suggestTune(
  profile: VehicleProfile,
  currentTune: TuneSettings,
  logs: Telemetry[] = []
): Promise<{ suggestion: Partial<TuneSettings>; reasoning: string; safeEnvelope: SafeEnvelope }> {
  const rules = DEFAULTS;
  const defaults = rules.defaults;
  const heur = rules.heuristics;

  const stats = summarizeLogs(logs);
  const reasoningParts: string[] = [];
  const suggestion: Partial<TuneSettings> = { ...currentTune };

  // AFR: move small step toward default afrTarget if telemetry indicates deviation
  const targetAfr = defaults.afrTarget;
  if (stats) {
    const afrDelta = targetAfr - stats.avgAfr;
    const step = Math.sign(afrDelta) * Math.min(Math.abs(afrDelta), heur.afrMaxDelta);
    suggestion.afrTarget = Number((currentTune.afrTarget + step).toFixed(2));
    reasoningParts.push(`AFR nudged ${step.toFixed(2)} toward ${targetAfr}`);
  } else {
    suggestion.afrTarget = currentTune.afrTarget ?? targetAfr;
    reasoningParts.push(`No recent telemetry: using current/default AFR ${String(suggestion.afrTarget)}`);
  }

  // Boost: reduce on knock, else small safe nudge up limited by safety margin
  const safeBoost = defaults.safeEnvelope.boost;
  const maxAllowedBoost = safeBoost[1] * heur.boostSafetyMargin;
  if (stats) {
    if (stats.maxKnock > heur.knockThreshold) {
      const reduceBy = Math.min(heur.boostMaxDelta, Math.max(0.1, currentTune.boostLimit * 0.05));
      suggestion.boostLimit = Number(Math.max(safeBoost[0], currentTune.boostLimit - reduceBy).toFixed(2));
      reasoningParts.push(`Reduced boost ${reduceBy.toFixed(2)} due to knock ${stats.maxKnock.toFixed(2)}`);
    } else if (currentTune.boostLimit < maxAllowedBoost - 1e-6) {
      const increase = Math.min(heur.boostMaxDelta, maxAllowedBoost - currentTune.boostLimit);
      suggestion.boostLimit = Number(Math.min(maxAllowedBoost, currentTune.boostLimit + increase).toFixed(2));
      if (increase > 0) reasoningParts.push(`Increased boost ${increase.toFixed(2)} within safety margin`);
    } else {
      reasoningParts.push("Boost at or above safety margin; no increase");
    }
  } else {
    suggestion.boostLimit = Math.min(currentTune.boostLimit, maxAllowedBoost);
    reasoningParts.push("No telemetry: enforced conservative boost cap");
  }

  // Ignition: small adjustments if very low knock and RPM stable
  const safeIgn = defaults.safeEnvelope.ignition;
  if (stats) {
    if (stats.maxKnock < heur.knockThreshold && stats.avgRpm > 1500) {
      const adj = stats.avgRpm > 4000 ? 0.25 : 0.1;
      const sign = stats.maxKnock < 0.2 ? 1 : -1;
      const delta = sign * Math.min(heur.ignitionMaxDelta, adj);
      let newIgn = Number((currentTune.ignitionOffset + delta).toFixed(2));
      newIgn = Math.max(safeIgn[0], Math.min(safeIgn[1], newIgn));
      suggestion.ignitionOffset = newIgn;
      reasoningParts.push(`Adjusted ignition by ${delta.toFixed(2)} based on RPM/knock`);
    } else {
      reasoningParts.push("No ignition change due to knock/RPM profile");
    }
  } else {
    reasoningParts.push("No telemetry: no ignition change advised");
  }

  // Clip to safe envelope
  const safeEnvelope = defaults.safeEnvelope;
  if (suggestion.boostLimit !== undefined) {
    suggestion.boostLimit = Math.max(safeEnvelope.boost[0], Math.min(safeEnvelope.boost[1], suggestion.boostLimit));
  }
  if (suggestion.afrTarget !== undefined) {
    suggestion.afrTarget = Math.max(safeEnvelope.afr[0], Math.min(safeEnvelope.afr[1], suggestion.afrTarget));
  }
  if (suggestion.ignitionOffset !== undefined) {
    suggestion.ignitionOffset = Math.max(safeEnvelope.ignition[0], Math.min(safeEnvelope.ignition[1], suggestion.ignitionOffset));
  }

  return { suggestion, reasoning: reasoningParts.join("; "), safeEnvelope };
}