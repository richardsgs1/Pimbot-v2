import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import type { Project } from '../types';

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const { projects } = req.body as { projects: Project[] };

    if (!projects) {
      return res.status(400).json({ error: 'Project data is required.' });
    }

    const systemInstruction = `You are PiMbOt AI, a proactive project management assistant.
Your task is to generate a "Daily Briefing" in Markdown format based on a summary of the user's project data.
The briefing should be concise, helpful, and prioritize what the user needs to focus on today.

Structure the report as follows:
- A brief, positive opening line.
- **Urgent Items:** A bulleted list of any tasks that are currently overdue. If none, state that.
- **Today's Priorities:** A bulleted list of high-priority tasks due today. If none, state that.
- **Projects Requiring Attention:** A bulleted list of any projects with a status of "At Risk" or "Off Track". If none, state that.
- **Recent Accomplishments:** A short sentence mentioning one or two recently completed tasks to build momentum.

Keep the tone professional yet encouraging. If a section has no items, explicitly state something positive like "No overdue tasks. Great job keeping up!". Do not make up information if a section is empty.`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    const relevantData = {
        today: todayStr,
        projects: projects.map(p => ({
            name: p.name,
            status: p.status,
            overdueTasks: p.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).map(t => t.name),
            dueTodayTasks: p.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate).toLocaleDateString('en-CA') === todayStr).map(t => ({name: t.name, priority: t.priority})),
        })),
        recentCompletions: projects.flatMap(p => p.tasks.filter(t => t.completed && t.dueDate && new Date(t.dueDate) > new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)).map(t => t.name)).slice(0, 3)
    };
    
    const prompt = `Generate a daily briefing based on this summarized project data:\n${JSON.stringify(relevantData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const briefing = safeExtractText(response).trim();
    if (!briefing) {
        throw new Error('The AI model returned an empty or blocked response. This may be due to content safety filters.');
    }

    return res.status(200).json({ briefing });

  } catch (error) {
    console.error('Error in generate-daily-briefing handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate the daily briefing.';
    return res.status(500).json({ error: errorMessage });
  }
}