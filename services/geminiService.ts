import { GoogleGenAI } from "@google/genai";

// Custom error class for more specific API error handling
export class GeminiError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'GeminiError';
  }
}

// The API key must be set as an environment variable `API_KEY`.
// This is handled automatically by the hosting environment (e.g., Vercel) or local setup.
if (!process.env.API_KEY) {
    // This error will be caught during development or at build time if the key is missing.
    throw new Error("API_KEY environment variable not set. Please configure it in your deployment environment.");
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

        const responseText = response.text;
        if (!responseText) {
            const blockReason = response.candidates?.[0]?.finishReason;
            if (blockReason && blockReason !== 'STOP') {
                throw new GeminiError(`The response was blocked for safety reasons (${blockReason}). Please modify your input.`);
            }
            throw new GeminiError("The translation service returned an empty response. Please try again.");
        }

        return responseText.trim();
    } catch (error) {
        console.error("Error calling Gemini API:", error);

        if (error instanceof GeminiError) {
            throw error;
        }

        let userMessage = "Failed to get a response from the translation service.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                userMessage = "The provided API key is invalid. Please check your configuration.";
            } else if (error.message.toLowerCase().includes('fetch failed') || error.message.toLowerCase().includes('networkerror')) {
                userMessage = "A network error occurred. Please check your internet connection and try again.";
            }
        }
        
        throw new GeminiError(userMessage, error);
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
