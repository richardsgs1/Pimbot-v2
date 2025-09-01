import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
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

    const { tasks, memberName } = req.body as { tasks: (Task & { projectName: string })[], memberName: string };

    if (!tasks || !memberName) {
      return res.status(400).json({ error: 'Tasks and memberName are required.' });
    }

    const systemInstruction = `You are a senior project manager analyzing a team member's workload.
Your goal is to provide a concise, 2-3 sentence summary of their current situation based on their assigned tasks across all projects.
- Start with an overall assessment (e.g., "heavy but manageable," "at capacity," "light workload").
- Identify the most critical task or biggest risk (e.g., a high-priority task, a task on an at-risk project, an upcoming deadline).
- Conclude with an actionable recommendation (e.g., "monitor their progress on X," "ensure they have support for Y," "consider offloading lower-priority tasks").
Your tone should be professional and insightful. Do not use markdown.`;

    const tasksString = tasks.map(t => 
      `- Task: "${t.name}" on Project: "${t.projectName}" (Priority: ${t.priority}, Due: ${t.dueDate || 'N/A'})`
    ).join('\n');

    const prompt = `Analyze the workload for team member "${memberName}" based on the following assigned tasks:\n\n${tasksString}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const summary = safeExtractText(response).trim();

    if (!summary) {
      // FIX: Corrected a typo in the throw statement.
      throw new Error('The AI model returned an empty or blocked response.');
    }

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Error in get-team-workload-summary handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate workload summary.';
    return res.status(500).json({ error: errorMessage });
  }
}