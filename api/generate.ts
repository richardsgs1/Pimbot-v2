import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { OnboardingData } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, userData } = req.body as { prompt: string; userData: OnboardingData };

  if (!prompt || !userData) {
    return res.status(400).json({ error: 'Prompt and userData are required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Construct a detailed system instruction
    const methodologies = userData.methodologies.length > 0 ? userData.methodologies.join(', ') : 'various methodologies';
    const tools = userData.tools.length > 0 ? userData.tools.join(', ') : 'various tools';
    const systemInstruction = `You are PiMbOt AI, an expert project management assistant.
Your user is a project manager with an experience level of "${userData.skillLevel}".
They are familiar with ${methodologies} and use tools like ${tools}.
Your tone should be supportive, clear, and professional. Tailor the complexity of your answers to their experience level. Provide actionable advice and clear explanations.`;

    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction
        }
    });

    res.status(200).json({ text: response.text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate content from the AI model.' });
  }
}
