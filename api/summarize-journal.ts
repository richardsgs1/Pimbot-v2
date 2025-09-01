import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import type { JournalEntry } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// A highly robust function to extract text from a Gemini response.
function safeExtractText(response: GenerateContentResponse): string {
    if (response.promptFeedback?.blockReason) {
        console.warn(`Response was blocked due to ${response.promptFeedback.blockReason}`);
        return '';
    }
    try {
        const text = response.text;
        if (text) return text;
    } catch (e) {
        console.error("Error accessing response.text. The response might be blocked.", e);
    }
    try {
        return response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (e) {
        console.error("Error accessing fallback response text.", e);
        return '';
    }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { entries } = req.body as { entries: JournalEntry[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'A list of journal entries is required.' });
    }

    const systemInstruction = `You are an expert project management assistant. Your task is to synthesize a list of system-generated activity logs into a single, concise, human-readable paragraph.
- Combine related events into a single sentence where possible.
- Focus on the high-level story of what happened (e.g., progress, changes, additions).
- The tone should be a neutral, factual summary. Do not use markdown.`;

    const entriesString = entries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => `- ${e.content}`)
      .join('\n');

    const prompt = `Please summarize the following project activities into a narrative paragraph:\n\n${entriesString}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const summary = safeExtractText(response).trim();

    if (!summary) {
      throw new Error('The AI model returned an empty or blocked response.');
    }

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Error in summarize-journal handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate journal summary.';
    return res.status(500).json({ error: errorMessage });
  }
}