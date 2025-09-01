
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Type, GenerateContentResponse, GoogleGenAI } from '@google/genai';
import type { Task } from '../types';

// A highly robust function to extract text from a Gemini response.
function safeExtractText(response: GenerateContentResponse): string {
    if (response.promptFeedback?.blockReason) {
        console.warn(`Response was blocked due to ${response.promptFeedback.blockReason}`);
        return '';
    }
    try {
        const text = response.text;
        if (text) return text;
    } catch (e) { console.error("Error accessing response.text.", e); }
    try {
        return response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (e) {
        console.error("Error accessing fallback response text.", e);
        return '';
    }
}

// A robust function to clean and parse JSON from the model's text response.
function cleanAndParseJson(rawText: string): any {
  if (!rawText) return {};
  let cleanedText = rawText.trim();
  const jsonRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const match = cleanedText.match(jsonRegex);
  if (match && match[1]) { cleanedText = match[1]; }
  if (!cleanedText) return {};
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse JSON after cleaning:", cleanedText);
    return {}; 
  }
}


export default async function handler(
  req: VercelRequest & { ai: GoogleGenAI },
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ai = req.ai;
    const { tasks, projectDueDate } = req.body as { tasks: Task[], projectDueDate: string };

    if (!tasks || !projectDueDate) {
      return res.status(400).json({ error: 'Tasks and projectDueDate are required.' });
    }

    const today = new Date().toISOString().split('T')[0];

    const systemInstruction = `You are an expert project scheduler. Your goal is to create a realistic project schedule based on a list of tasks.
- For each task, estimate a realistic duration in days (between 1 and 10).
- Assign a start date for each task in YYYY-MM-DD format. The earliest start date should be today.
- The schedule MUST respect all dependencies. A task's start date must be after its dependency's end date (start_date + duration).
- The end date of the very last task must be on or before the project's overall due date.
- Tasks can run in parallel if they do not have dependencies on each other.`;

    const tasksForPrompt = tasks.map(({ id, name, priority, dependsOn }) => ({ id, name, priority, dependsOn }));
    const prompt = `Today's date is ${today}.
Project Due Date: ${projectDueDate}
Tasks to schedule:
${JSON.stringify(tasksForPrompt, null, 2)}

Please generate the schedule.`;

    const scheduleSchema = {
      type: Type.OBJECT,
      properties: {
        scheduledTasks: {
          type: Type.ARRAY,
          description: "The list of tasks with their calculated schedule.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "The original ID of the task." },
              startDate: { type: Type.STRING, description: "The calculated start date in YYYY-MM-DD format." },
              duration: { type: Type.INTEGER, description: "The estimated duration of the task in days." }
            },
            required: ['id', 'startDate', 'duration'],
          },
        },
      },
      required: ['scheduledTasks'],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
      },
    });

    const rawText = safeExtractText(response);
    if (!rawText) {
      throw new Error('The AI model returned an empty or blocked response.');
    }
    
    const scheduleData = cleanAndParseJson(rawText);

    if (!scheduleData || !scheduleData.scheduledTasks) {
        throw new Error('The AI model returned a response in an unexpected format.');
    }

    return res.status(200).json(scheduleData);

  } catch (error) {
    console.error('Error in generate-schedule handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate schedule.';
    return res.status(500).json({ error: errorMessage });
  }
}