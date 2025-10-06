
import { GoogleGenAI } from "@google/genai";
import { API_KEY as LOCAL_API_KEY } from '../config.example';

// This logic ensures the app works in both production (Vercel) and local development.
// On Vercel, `process.env.API_KEY` will be set by the environment variables.
// Locally, `process.env.API_KEY` will be undefined, so we fall back to the key
// you've placed in `config.ts` (which is git-ignored for security).
const GEMINI_API_KEY = process.env.API_KEY || (LOCAL_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' ? LOCAL_API_KEY : '');


if (!GEMINI_API_KEY) {
    const errorContainer = document.getElementById('root');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fff3f3; border: 1px solid #ffcccc; border-radius: 8px; margin: 2rem;">
                <h1 style="color: #d9534f; font-size: 1.5rem;">API Key Not Found</h1>
                <p style="color: #333; font-size: 1rem;">
                    <strong>For local development:</strong> Please create a <code>config.ts</code> file in the root directory by copying <code>config.example.ts</code> and adding your Gemini API key.
                </p>
                <p style="color: #333; font-size: 1rem; margin-top: 1rem;">
                    <strong>For production (Vercel):</strong> Please ensure the <code>API_KEY</code> environment variable is set in your Vercel project settings.
                </p>
            </div>
        `;
    }
    throw new Error("API_KEY not found. Please follow the setup instructions.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
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
