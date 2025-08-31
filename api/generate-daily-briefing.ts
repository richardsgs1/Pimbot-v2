import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { Project } from '../types';

// Helper function to safely get text from a Gemini response
function safeGetText(response: GenerateContentResponse): string {
    try {
        return response.text ?? '';
    } catch (e) {
        console.error("Error accessing response.text. The response might be blocked.", e);
        return ''; // Return empty string if accessor throws
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
      throw new Error('API key not configured.');
    }
    const ai = new GoogleGenAI({ apiKey });

    const { projects } = req.body as { projects: Project[] };

    if (!projects) {
      return res.status(400).json({ error: 'Project data is required.' });
    }

    const systemInstruction = `You are PiMbOt AI, a proactive project management assistant.
Your task is to generate a "Daily Briefing" in Markdown format based on all the user's project data.
The briefing should be concise, helpful, and prioritize what the user needs to focus on today.

Structure the report as follows:
- A brief, positive opening line.
- **Urgent Items:** A bulleted list of any tasks that are currently overdue. If none, state that.
- **Today's Priorities:** A bulleted list of high-priority tasks due today. If none, state that.
- **Projects Requiring Attention:** A bulleted list of any projects with a status of "At Risk" or "Off Track". If none, state that.
- **Recent Accomplishments:** A short sentence mentioning one or two recently completed tasks to build momentum.

Keep the tone professional yet encouraging. If a section has no items, explicitly state something positive like "No overdue tasks. Great job keeping up!". Do not make up information if a section is empty.`;

    const projectDataString = JSON.stringify(projects, null, 2);
    const prompt = `Here is the user's project data in JSON format. Generate their daily briefing based on it. Today's date is ${new Date().toLocaleDateString('en-CA')}.\n\n${projectDataString}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const briefing = safeGetText(response).trim();
    if (!briefing) {
        throw new Error('The AI model returned an empty briefing, which may be due to content safety filters.');
    }

    return res.status(200).json({ briefing });

  } catch (error) {
    console.error('Error in generate-daily-briefing handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate the daily briefing.';
    return res.status(500).json({ error: errorMessage });
  }
}