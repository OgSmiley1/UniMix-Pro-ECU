// Bridge used by UI components. Exposes the same optimizeTuneWithAI API
// previously expected by TuneEditor, but runs purely client-side using aiEngine.

import { VehicleProfile, TuneSettings, Telemetry } from "../types";
import { suggestTune } from "./aiEngine";

export interface TuningAISuggestion {
  afrTarget?: number;
  boostLimit?: number;
  ignitionOffset?: number;
  reasoning?: string;
  safeEnvelope?: {
    boost: [number, number];
    afr: [number, number];
    ignition: [number, number];
  };
}

/**
 * optimizeTuneWithAI: unified function used by the UI.
 * Currently runs the offline engine; later this bridge can call a server/LLM proxy.
 */
export async function optimizeTuneWithAI(
  profile: VehicleProfile,
  currentTune: TuneSettings,
  logs: Telemetry[]
): Promise<TuningAISuggestion | null> {
  try {
    const r = await suggestTune(profile, currentTune, logs);
    return {
      afrTarget: r.suggestion.afrTarget,
      boostLimit: r.suggestion.boostLimit,
      ignitionOffset: r.suggestion.ignitionOffset,
      reasoning: r.reasoning,
      safeEnvelope: r.safeEnvelope
    };
  } catch (err) {
    console.error("aiBridge.optimizeTuneWithAI error:", err);
    return null;
  }
}