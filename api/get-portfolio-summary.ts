import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { Project, TeamMember } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { projects, team } = req.body as { projects: Project[]; team: TeamMember[] };

  if (!projects || !team) {
    return res.status(400).json({ error: 'Projects and team data are required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analyze the following project portfolio and provide a concise, high-level strategic summary (3-4 sentences). 
    Focus on overall health, potential risks, and resource allocation.
    
    Number of Projects: ${projects.length}
    Number of Team Members: ${team.length}
    
    Project Details:
    ${projects.map(p => `- ${p.name} (Status: ${p.status}, Progress: ${p.progress}%, Due: ${p.dueDate})`).join('\n')}
    
    Your summary should identify any patterns (e.g., multiple projects at risk, tight deadlines clustering) and suggest a strategic focus point for the project manager.`;

    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    res.status(200).json({ summary: response.text });

  } catch (error) {
    console.error('Error calling Gemini API for portfolio summary:', error);
    res.status(500).json({ error: 'Failed to generate portfolio summary.' });
  }
}
