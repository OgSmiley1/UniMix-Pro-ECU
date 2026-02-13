
import { GoogleGenAI, Type } from "@google/genai";
import { Telemetry, TuneSettings, VehicleProfile } from "../types";

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Defining a specific interface for the AI response to include reasoning and safety boundaries
export interface TuningAISuggestion extends Partial<TuneSettings> {
  reasoning?: string;
  safeEnvelope?: {
    boost: [number, number];
    afr: [number, number];
    ignition: [number, number];
  };
}

/**
 * Uses Gemini AI to analyze vehicle telemetry and suggest tune optimizations.
 * Also defines a "Safe Operating Envelope" for real-time monitoring.
 */
export const optimizeTuneWithAI = async (
  profile: VehicleProfile, 
  currentTune: TuneSettings, 
  logs: Telemetry[]
): Promise<TuningAISuggestion | null> => {
  try {
    const logSummary = logs.slice(-50).map(l => 
      `RPM: ${l.rpm.toFixed(0)}, Boost: ${l.boost.toFixed(1)}, AFR: ${l.afr.toFixed(2)}, Knock: ${l.knock.toFixed(2)}`
    ).join('\n');

    const prompt = `
      Act as a world-class ECU calibrator for ${profile.name} (${profile.ecuType}).
      Engine: ${profile.engine}, Induction: ${profile.induction}.
      
      Current Tune: AFR Target: ${currentTune.afrTarget}, Boost: ${currentTune.boostLimit}PSI, Timing: ${currentTune.ignitionOffset}deg.
      
      Recent Telemetry (Last 5 seconds):
      ${logSummary}
      
      Tasks:
      1. Suggest optimization for Power vs Safety.
      2. Define a "Safe Operating Envelope" (min/max) for Boost, AFR, and Ignition timing specifically for this engine's health.
      3. Provide a brief 1-sentence engineering insight.
      
      Return JSON format only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash for lower latency periodic updates
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            afrTarget: { type: Type.NUMBER },
            boostLimit: { type: Type.NUMBER },
            ignitionOffset: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            safeEnvelope: {
              type: Type.OBJECT,
              properties: {
                boost: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                afr: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                ignition: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              required: ["boost", "afr", "ignition"]
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Tuning Analysis Failed:", error);
    return null;
  }
};
