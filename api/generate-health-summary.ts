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

    const { project } = req.body as { project: Project };

    if (!project) {
      return res.status(400).json({ error: 'Project data is required.' });
    }

    const systemInstruction = `You are an expert project manager providing a health check summary.
Analyze the provided project JSON data.
Provide a concise, 2-3 sentence summary of the project's health.
- Start with an overall assessment (e.g., "On track," "Shows signs of risk," "Slightly behind schedule").
- Mention one key risk or area that needs attention, especially related to overdue tasks or high-priority incomplete tasks.
- Mention one positive point or recent accomplishment if applicable.
- Your tone should be neutral, professional, and actionable. Do not use markdown.`;

    const projectDataString = `
      Project Name: ${project.name}
      Status: ${project.status}
      Progress: ${project.progress}%
      Due Date: ${project.dueDate}
      Tasks:
      ${project.tasks.map(t => `- ${t.name} (Status: ${t.completed ? 'Completed' : 'Incomplete'}, Priority: ${t.priority}, Due: ${t.dueDate || 'N/A'})`).join('\n')}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this project data and provide a health summary:\n${projectDataString}`,
      config: {
        systemInstruction,
      },
    });

    const summary = safeGetText(response).trim();

    if (!summary) {
      throw new Error('The AI model returned an empty summary, which may be due to content safety filters.');
    }

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Error calling Gemini API for health summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate project health summary.';
    return res.status(500).json({ error: errorMessage });
  }
}