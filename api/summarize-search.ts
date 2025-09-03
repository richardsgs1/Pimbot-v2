import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { searchTerm, resultCounts } = req.body as { 
    searchTerm: string; 
    resultCounts: { projects: number; tasks: number; journal: number };
  };

  if (!searchTerm || !resultCounts) {
    return res.status(400).json({ error: 'Search term and result counts are required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Based on a search for "${searchTerm}", the following items were found:
- ${resultCounts.projects} projects
- ${resultCounts.tasks} tasks
- ${resultCounts.journal} journal entries

Provide a very brief, one-sentence summary of what these results likely represent. For example: "This search relates to the planning and execution phases of project X."`;

    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    res.status(200).json({ summary: response.text });

  } catch (error) {
    console.error('Error calling Gemini API for search summary:', error);
    res.status(500).json({ error: 'Failed to generate search summary.' });
  }
}
