import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';

interface ResultCounts {
  projects: number;
  tasks: number;
  journal: number;
}

// A highly robust function to extract text from a Gemini response, handling multiple failure modes.
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key is not configured. Please set the API_KEY environment variable.' });
    }
    const ai = new GoogleGenAI({ apiKey });

    const { searchTerm, resultCounts } = req.body as { searchTerm: string; resultCounts: ResultCounts };

    if (!searchTerm || !resultCounts) {
      return res.status(400).json({ error: 'Search term and result counts are required.' });
    }

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

    const summary = safeExtractText(response).trim();

    if (!summary) {
      // It's not critical if the summary fails, so just return an empty one.
      return res.status(200).json({ summary: '' });
    }

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Error calling Gemini API for search summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate search summary.';
    return res.status(500).json({ error: errorMessage });
  }
}