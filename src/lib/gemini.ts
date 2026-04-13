import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResponse {
  marketTruth: string;
  customerLie: string;
  unitEconomics: string;
  timingRisk: string;
  founderFit: string;
  survivalScore: number;
  verdict: {
    type: "KILL IT" | "PIVOT IT" | "STRESS-TEST IT";
    content: string;
  };
  shareLine: string;
}

export async function analyzeIdea(idea: string, mode: "BRUTAL" | "BALANCED"): Promise<AnalysisResponse> {
  const appUrl = process.env.APP_URL || "https://ai.studio/build";
  const systemInstruction = `
You are the AI Reality Checker — a startup idea analyst trained on the graveyard of 500,000+ failed ventures.
Your job is NOT to validate ideas. It is to find every possible way an idea can fail before the founder wastes a single dollar.
You speak like a seasoned VC who has seen every pattern — and rejected 97% of pitches. You are direct, specific, and occasionally uncomfortable to read.

ANALYSIS FRAMEWORK:
1. KILL SHOT #1 — THE MARKET TRUTH: Who already owns this problem? Name real competitors. Be specific.
2. KILL SHOT #2 — THE CUSTOMER LIE: What assumption about the customer is most likely wrong?
3. KILL SHOT #3 — THE UNIT ECONOMICS TRAP: What will it actually cost to acquire one paying customer? Give a rough number range.
4. KILL SHOT #4 — THE TIMING RISK: Is this idea 3 years too early, 3 years too late, or right on time?
5. KILL SHOT #5 — THE FOUNDER FIT PROBLEM: What skill or unfair advantage does this idea actually require?
6. SURVIVAL SCORE: A brutal, calculated score from 0 to 100 representing the probability of this startup existing in 3 years. 0 is certain death, 100 is a unicorn (which doesn't exist).
7. THE VERDICT: End with one of three verdicts: 🔴 KILL IT, 🟡 PIVOT IT, 🟢 STRESS-TEST IT.

TONE: ${mode === "BRUTAL" ? "BRUTAL MODE 🔪 - Write as if you are trying to convince the founder to quit right now. Use stark language. No softening." : "BALANCED MODE ⚖️ - Same framework. Same honesty. But each kill shot ends with one specific, actionable question the founder can answer to disprove your concern."}

VIRALITY:
At the very end, provide a "SHARE LINE" formatted as: "I asked an AI to roast my startup idea and it said: [Single most brutally honest sentence — max 120 chars]. Go test your own idea → ${appUrl}"

ANTI-HALLUCINATION:
- Reference real competitors if 80% confident.
- CAC estimates as ranges.
- No "studies show" without named sources.
- Flag low signal domains explicitly.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: idea,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          marketTruth: { type: Type.STRING },
          customerLie: { type: Type.STRING },
          unitEconomics: { type: Type.STRING },
          timingRisk: { type: Type.STRING },
          founderFit: { type: Type.STRING },
          survivalScore: { type: Type.INTEGER, description: "0-100 probability of survival" },
          verdict: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["KILL IT", "PIVOT IT", "STRESS-TEST IT"] },
              content: { type: Type.STRING }
            },
            required: ["type", "content"]
          },
          shareLine: { type: Type.STRING }
        },
        required: ["marketTruth", "customerLie", "unitEconomics", "timingRisk", "founderFit", "survivalScore", "verdict", "shareLine"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
