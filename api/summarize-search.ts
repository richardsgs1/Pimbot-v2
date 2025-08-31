import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

interface ResultCounts {
  projects: number;
  tasks: number;
  journal: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { searchTerm, resultCounts } = req.body as { searchTerm: string; resultCounts: ResultCounts };

    if (!searchTerm || !resultCounts) {
      return res.status(400).json({ error: 'Search term and result counts are required.' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a helpful assistant. Your task is to summarize search results in a single, concise, and natural-sounding sentence.
- Mention the search term.
- Mention the total number of items found.
- If only one type of item is found (e.g., only tasks), be specific.
- Example: If the user searched for "API" and found 2 tasks and 1 journal entry, you could say: "Found 3 items related to 'API', primarily consisting of tasks and a journal entry."
- Example: If the user searched for "launch" and found only 1 project, you could say: "Found 1 project matching your search for 'launch'."
- Do not use markdown.`;

    const total = resultCounts.projects + resultCounts.tasks + resultCounts.journal;
    const prompt = `The user searched for "${searchTerm}". They found ${resultCounts.projects} projects, ${resultCounts.tasks} tasks, and ${resultCounts.journal} journal entries, for a total of ${total} items. Provide a summary.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const summary = response.text;

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Error calling Gemini API for search summary:', error);
    return res.status(500).json({ error: 'Failed to generate search summary.' });
  }
}