
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

async function callGemini(prompt: string): Promise<string> {
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

        return response.text.trim();
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
