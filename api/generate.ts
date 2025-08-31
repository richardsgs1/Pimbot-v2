import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { OnboardingData } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured.');
    }
    const ai = new GoogleGenAI({ apiKey });

    const { prompt, userData, history } = req.body as { prompt: string; userData: OnboardingData; history: ChatMessage[] };

    if (!prompt || !userData) {
      return res.status(400).json({ error: 'Prompt and userData are required' });
    }
    
    const methodologies = userData.methodologies.length > 0 ? userData.methodologies.join(', ') : 'various methodologies';
    const tools = userData.tools.length > 0 ? userData.tools.join(', ') : 'various tools';
    const systemInstruction = `You are PiMbOt AI, an expert project management assistant.
Your user is a project manager with an experience level of "${userData.skillLevel}".
They are familiar with ${methodologies} and use tools like ${tools}.
Your tone should be supportive, clear, and professional. Tailor the complexity of your answers to their experience level. Provide actionable advice, clear explanations, and use markdown formatting for clarity (e.g., lists, bolding, code blocks).`;
    
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction
        }
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      try {
        // Proactively check for a block reason in each chunk to avoid errors.
        if (chunk.promptFeedback?.blockReason) {
          console.warn(`A streaming chunk was blocked: ${chunk.promptFeedback.blockReason}`);
          continue; // Skip this blocked chunk and continue with the stream.
        }
        
        const text = chunk.text;
        if (text) {
          res.write(text);
        }
      } catch (e) {
        // This catch is a fallback in case accessing chunk.text itself throws.
        console.warn('A chunk was likely blocked during streaming.', e);
      }
    }

    res.end();

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content from the AI model.';
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }
}