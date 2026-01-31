
import { GoogleGenAI, Type } from "@google/genai";
import { Telemetry, TuneSettings, VehicleProfile } from "../types";

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Defining a specific interface for the AI response to include reasoning
export interface TuningAISuggestion extends Partial<TuneSettings> {
  reasoning?: string;
}

/**
 * Uses Gemini AI to analyze vehicle telemetry and suggest tune optimizations.
 * Includes community-sourced knowledge and performance logic.
 */
export const optimizeTuneWithAI = async (
  profile: VehicleProfile, 
  currentTune: TuneSettings, 
  logs: Telemetry[]
): Promise<TuningAISuggestion | null> => {
  try {
    const logSummary = logs.slice(-20).map(l => 
      `RPM: ${l.rpm}, Boost: ${l.boost}, AFR: ${l.afr}, Knock: ${l.knock}`
    ).join('\n');

    const prompt = `
      Act as a world-class ECU calibrator for ${profile.name} using ${profile.ecuType}.
      The car has a ${profile.engine} with ${profile.induction} induction.
      
      Current Tune Settings:
      - AFR Target: ${currentTune.afrTarget}
      - Boost Limit: ${currentTune.boostLimit} PSI
      - Ignition Offset: ${currentTune.ignitionOffset} degrees
      
      Recent Telemetry Logs:
      ${logSummary}
      
      Analyze these logs against known community "best tunes" and professional track data found on the internet. 
      Suggest safer or more powerful increments for Boost, AFR, and Ignition.
      Return the results in JSON format.
    `;

    // Using gemini-3-pro-preview for complex reasoning and engineering tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            afrTarget: { type: Type.NUMBER, description: "Suggested AFR target for WOT" },
            boostLimit: { type: Type.NUMBER, description: "Suggested boost limit in PSI" },
            ignitionOffset: { type: Type.NUMBER, description: "Suggested ignition timing adjustment" },
            reasoning: { type: Type.STRING, description: "Explanation for the changes based on internet data" }
          }
        }
      }
    });

    // Accessing .text as a property as per the latest SDK guidelines
    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("AI Tuning Analysis Failed:", error);
    return null;
  }
};
