
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { OnboardingData } from '../types';

// Define the expected message format from the frontend
interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Adjusted to receive history from the frontend
  const { prompt, userData, history } = req.body as { prompt: string; userData: OnboardingData; history: ChatMessage[] };

  if (!prompt || !userData) {
    return res.status(400).json({ error: 'Prompt and userData are required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const methodologies = userData.methodologies.length > 0 ? userData.methodologies.join(', ') : 'various methodologies';
    const tools = userData.tools.length > 0 ? userData.tools.join(', ') : 'various tools';
    const systemInstruction = `You are PiMbOt AI, an expert project management assistant.
Your user is a project manager with an experience level of "${userData.skillLevel}".
They are familiar with ${methodologies} and use tools like ${tools}.
Your tone should be supportive, clear, and professional. Tailor the complexity of your answers to their experience level. Provide actionable advice and clear explanations.`;

    const model = 'gemini-2.5-flash';
    
    // Transform frontend chat history to the format Gemini API expects
    const contents = [
      ...(history || []).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
            systemInstruction
        }
    });

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    
    res.end();

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate content from the AI model.' });
    } else {
      res.end();
    }
  }
}