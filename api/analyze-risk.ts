import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import type { Project, Task } from '../types';

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

const isTaskOverdue = (task: Task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

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

    const { project } = req.body as { project: Project };

    if (!project) {
      return res.status(400).json({ error: 'Project data is required.' });
    }

    const systemInstruction = `You are an expert project risk analyst. Your task is to generate a concise and actionable risk analysis report in Markdown format based on the provided project data.

The report must include:
- **## Identified Risks:** A bulleted list of the top 2-3 risks based on the data (e.g., overdue tasks, task dependencies, high workload on one person).
- **## Mitigation Strategies:** For each identified risk, provide a corresponding, concrete, and actionable mitigation strategy in a bulleted list.

Your tone should be clear, professional, and solution-oriented.`;

    const projectDataString = `
# Project for Risk Analysis: "${project.name}"

- **Current Status:** ${project.status}
- **Progress:** ${project.progress}%
- **Due Date:** ${project.dueDate}

## Tasks
${project.tasks.map(t => `- ${t.name} (Status: ${t.completed ? 'Completed' : 'Incomplete'}, Priority: ${t.priority}, Due: ${t.dueDate || 'N/A'}${isTaskOverdue(t) ? ', **OVERDUE**' : ''})`).join('\n')}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a risk analysis and mitigation plan for the following project:\n${projectDataString}`,
      config: {
        systemInstruction,
      },
    });

    const analysis = safeExtractText(response).trim();

    if (!analysis) {
      throw new Error('The AI model returned an empty or blocked response.');
    }

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Error in analyze-risk handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate risk analysis.';
    return res.status(500).json({ error: errorMessage });
  }
}