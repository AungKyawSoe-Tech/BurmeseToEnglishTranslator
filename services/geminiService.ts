import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.API_KEY;

// Lazily initialize the AI instance to prevent app crash on load if API key is missing.
// The error will be thrown when a translation is attempted, which can be handled by the UI.
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const model = 'gemini-2.5-flash';

async function callGemini(prompt: string): Promise<string> {
    if (!ai) {
        throw new Error("API_KEY not found. It must be provided as an environment variable.");
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.3,
                topP: 0.9,
                topK: 20,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a response from the translation service.");
    }
}

export async function translateBurmeseToEnglish(text: string): Promise<string> {
  const prompt = `Translate the following Burmese text to English. Provide only the direct English translation and nothing else. Do not add any introductory phrases, explanations, or labels like "English Translation:".

Burmese Text:
"${text}"

English Translation:
`;
  return callGemini(prompt);
}

export async function translateEnglishToBurmese(text: string): Promise<string> {
  const prompt = `Translate the following English text to Burmese. Provide only the direct Burmese translation in Unicode font and nothing else. Do not add any introductory phrases, explanations, or labels like "Burmese Translation:".

English Text:
"${text}"

Burmese Translation:
`;
  return callGemini(prompt);
}