import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { Project } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { project } = req.body as { project: Project };

  if (!project) {
    return res.status(400).json({ error: 'Project data is required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const overdueTasks = project.tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;

    const prompt = `Analyze the health of the project "${project.name}".
    Description: ${project.description}
    Current Status: ${project.status}
    Progress: ${project.progress}%
    Due Date: ${project.dueDate}
    Total Tasks: ${project.tasks.length}
    Overdue Tasks: ${overdueTasks}
    
    Based on this data, provide a concise (2-3 sentences) health summary. Identify the primary risk factor (e.g., overdue tasks, slow progress relative to deadline) and suggest one specific, actionable recommendation to improve the project's health.`;

    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    res.status(200).json({ summary: response.text });

  } catch (error) {
    console.error('Error calling Gemini API for health summary:', error);
    res.status(500).json({ error: 'Failed to generate health summary.' });
  }
}
