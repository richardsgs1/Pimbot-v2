
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

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

    const { prompt } = req.body as { prompt: string };

    if (!prompt) {
      return res.status(400).json({ error: 'A project description prompt is required.' });
    }

    const systemInstruction = `You are a project management assistant. Based on the user's prompt, create a structured project plan.
- The project name should be a concise title.
- The description should be a one or two-sentence summary.
- The due date should be inferred from the prompt or set to a reasonable future date if not specified. Format it as YYYY-MM-DD.
- Generate a list of 3-5 high-level tasks to get the user started. Task names should be clear and actionable.`;

    const projectSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'The concise name of the project.' },
        description: { type: Type.STRING, description: 'A brief summary of the project.' },
        dueDate: { type: Type.STRING, description: 'The project due date in YYYY-MM-DD format.' },
        tasks: {
          type: Type.ARRAY,
          description: 'A list of initial tasks for the project.',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'The name of the task.' },
            },
            required: ['name'],
          },
        },
      },
      required: ['name', 'description', 'dueDate', 'tasks'],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: projectSchema,
      },
    });
    
    // FIX: Added .trim() to handle potential whitespace in the AI's JSON response.
    const projectData = JSON.parse(response.text.trim());

    return res.status(200).json(projectData);

  } catch (error) {
    console.error('Error in generate-project handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate project from the AI model.';
    return res.status(500).json({ error: errorMessage });
  }
}