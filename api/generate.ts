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
Your tone should be supportive, clear, and professional. Tailor the complexity of your answers to their experience level. Provide actionable advice, clear explanations, and use markdown formatting for clarity (e.g., lists, bolding, code blocks).`;
    
    // Map history to the format required by the Gemini API
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
        config: {
            systemInstruction
        }
    });

    const stream = await chat.sendMessageStream({ message: prompt });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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