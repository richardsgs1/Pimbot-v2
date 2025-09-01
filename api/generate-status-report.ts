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

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isTaskOverdue = (task: Task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

export default async function handler(
  req: VercelRequest & { ai: GoogleGenAI },
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // NEW: Get the shared AI client from the request object
    const ai = req.ai;
    
    const { project } = req.body as { project: Project };

    if (!project) {
      return res.status(400).json({ error: 'Project data is required.' });
    }

    const systemInstruction = `You are an expert project management assistant. Your task is to generate a concise and professional status report in Markdown format based on the provided project data.

The report must include the following sections:
- **## Overall Summary:** A brief, high-level assessment of the project's health.
- **## Key Accomplishments:** A bulleted list of recently completed tasks.
- **## Upcoming Priorities:** A bulleted list of important upcoming tasks.
- **## Risks & Blockers:** A bulleted list identifying any overdue tasks or potential issues that require attention.

Your tone should be clear, professional, and objective.`;

    const completedTasks = project.tasks.filter(t => t.completed);
    const incompleteTasks = project.tasks.filter(t => !t.completed);

    const projectDataString = `
# Project Data for "${project.name}"

- **Current Status:** ${project.status}
- **Progress:** ${project.progress}%
- **Due Date:** ${formatDate(project.dueDate)}

## Completed Tasks (${completedTasks.length})
${completedTasks.length > 0 ? completedTasks.map(t => `- ${t.name}`).join('\n') : '- None'}

## Incomplete Tasks (${incompleteTasks.length})
${incompleteTasks.length > 0 ? incompleteTasks.map(t => `- ${t.name} (Priority: ${t.priority}, Due: ${formatDate(t.dueDate)}${isTaskOverdue(t) ? ', **OVERDUE**' : ''})`).join('\n') : '- None'}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a status report for the following project:\n${projectDataString}`,
      config: {
        systemInstruction,
      },
    });

    const report = safeExtractText(response).trim();

    if (!report) {
      throw new Error('The AI model returned an empty or blocked response. This may be due to content safety filters.');
    }

    return res.status(200).json({ report });

  } catch (error) {
    console.error('Error in generate-status-report handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate status report.';
    return res.status(500).json({ error: errorMessage });
  }
}