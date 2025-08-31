import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

interface SimpleTask {
    name: string;
    completed: boolean;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { projectDescription, tasks } = req.body as { projectDescription: string; tasks: SimpleTask[] };

    if (!projectDescription) {
      return res.status(400).json({ error: 'Project description is required.' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert project management assistant. Your goal is to suggest the next logical tasks for a project.
Analyze the project description and the list of existing tasks (including their completion status).
Based on this context, generate 3 short, actionable, and relevant tasks that the user should focus on next. Avoid repeating existing tasks.`;

    const existingTasksString = tasks.map(t => `- ${t.name} (${t.completed ? 'Completed' : 'To-Do'})`).join('\n');
    const userPrompt = `Project Description: "${projectDescription}"\n\nExisting Tasks:\n${existingTasksString || '(No tasks yet)'}\n\nSuggest the next 3 tasks.`;

    const suggestionSchema = {
      type: Type.OBJECT,
      properties: {
        suggestions: {
          type: Type.ARRAY,
          description: "A list of 3 suggested task names.",
          items: {
            type: Type.STRING,
            description: "A short, actionable task name."
          }
        }
      },
      required: ['suggestions']
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: suggestionSchema,
      },
    });

    const suggestions = JSON.parse(response.text);

    return res.status(200).json(suggestions);

  } catch (error) {
    console.error('Error calling Gemini API for task suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate task suggestions.' });
  }
}