import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import type { Project, TeamMember } from '../types';

// A highly robust function to extract text from a Gemini response.
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
    const { projects, team } = req.body as { projects: Project[], team: TeamMember[] };

    if (!projects || !team) {
      return res.status(400).json({ error: 'Projects and team data are required.' });
    }

    const systemInstruction = `You are a senior project management analyst. Your task is to provide a high-level, strategic summary of an entire project portfolio.
Analyze the provided data which includes all projects and team members.
Your summary should be a concise paragraph (3-4 sentences) and must identify:
- The overall health of the portfolio (e.g., "healthy," "stable with some concerns," "facing significant challenges").
- The most significant cross-project risk (e.g., a single person being a bottleneck on multiple at-risk projects, multiple projects having similar overdue dependencies).
- One key upcoming opportunity or deadline that requires attention.
Your tone should be professional, strategic, and forward-looking. Do not use markdown.`;

    // Pre-process data to send a concise summary to the AI
    const portfolioData = {
      totalProjects: projects.length,
      projectStatusCounts: projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tasksPerAssignee: projects.flatMap(p => p.tasks)
        .filter(t => !t.completed && t.assigneeId)
        .reduce((acc, t) => {
          const assigneeName = team.find(m => m.id === t.assigneeId)?.name || 'Unknown';
          acc[assigneeName] = (acc[assigneeName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      overdueTasks: projects.flatMap(p => p.tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).map(t => ({ taskName: t.name, projectName: p.name }))),
    };

    const prompt = `Based on the following portfolio data, generate a strategic summary:\n\n${JSON.stringify(portfolioData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const summary = safeExtractText(response).trim();

    if (!summary) {
      throw new Error('The AI model returned an empty or blocked response.');
    }

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Error in get-portfolio-summary handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate portfolio summary.';
    return res.status(500).json({ error: errorMessage });
  }
}