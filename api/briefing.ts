import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import type { OnboardingData } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userData } = req.body as { userData: OnboardingData };

  if (!userData) {
    return res.status(400).json({ error: 'userData is required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const methodologies = userData.methodologies.length > 0 ? userData.methodologies.join(', ') : 'general project management';
    
    const prompt = `Generate a personalized daily project management briefing for ${userData.name}.
They are a project manager with an experience level of "${userData.skillLevel}".
They are familiar with ${methodologies}.
The briefing should include:
1. An inspiring or thought-provoking quote relevant to project management.
2. A brief summary (2-3 sentences) of a recent news article, blog post, or trend in the project management space, tailored to their interests.
3. One actionable tip or a "challenge of the day" they can apply to their work today.
Keep the tone encouraging and professional.`;

    const model = 'gemini-2.5-flash';
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            quote: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'The quote itself.' },
                    author: { type: Type.STRING, description: 'The author of the quote.' }
                },
            },
            summary: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'Title of the article or trend.' },
                    content: { type: Type.STRING, description: 'A short summary of the content.' },
                },
            },
            tip: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'A catchy title for the tip.' },
                    content: { type: Type.STRING, description: 'The actionable tip or challenge.' },
                },
            },
        },
    };
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.7,
        }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received an empty response from the AI model.");
    }

    const briefingData = JSON.parse(responseText);
    res.status(200).json(briefingData);

  } catch (error) {
    console.error('Error calling Gemini API for briefing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}