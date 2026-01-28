
import { GoogleGenAI, Type } from "@google/genai";
import { Telemetry, TuneSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizeTune = async (
  telemetryLogs: Telemetry[],
  currentSettings: TuneSettings,
  fuelType: string
): Promise<Partial<TuneSettings>> => {
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are the UniMix AI Optimizer. Your goal is to analyze high-speed telemetry logs and adjust tuning parameters for maximum safe power.
    Algorithm Steps:
    1. Identify Knock Zones: Look for 'knock' > 2.0. If found, retard timing and enrich AFR.
    2. AFR Optimization: Target Lambda 0.80 (approx 11.8 AFR) during WOT (Wide Open Throttle).
    3. Boost Smoothing: Ensure boost doesn't oscillate.
    4. Safety Validation: Never exceed max boost for the profile.
  `;

  const prompt = `
    Analyze current engine state:
    Current Settings: ${JSON.stringify(currentSettings)}
    Fuel: ${fuelType}
    Logs (Historical Driving Data): ${JSON.stringify(telemetryLogs.slice(-20))}
    
    Output the optimized fuel map offsets and timing retard/advance in JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            afrTarget: { type: Type.NUMBER, description: "New optimized target AFR" },
            boostLimit: { type: Type.NUMBER, description: "New optimized safe boost limit" },
            ignitionOffset: { type: Type.NUMBER, description: "New timing advance/retard" },
            thinking: { type: Type.STRING, description: "Calibration reasoning" }
          },
          required: ["afrTarget", "boostLimit", "ignitionOffset"]
        },
        thinkingConfig: { thinkingBudget: 1000 }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini optimization failed", error);
    return currentSettings;
  }
};
