
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import type { Project } from '../types';
import { CommunicationType } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { project, communicationType, audience, keyPoints } = req.body as {
    project: Project;
    communicationType: CommunicationType;
    audience: string;
    keyPoints: string;
  };

  if (!project || !communicationType || !audience || !keyPoints) {
    return res.status(400).json({ error: 'Missing required parameters: project, communicationType, audience, and keyPoints are required.' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert project management assistant. Draft a professional communication for the project manager.
    
    Project Name: ${project.name}
    Current Status: ${project.status}
    Progress: ${project.progress}%
    
    Communication Type: ${communicationType}
    Audience: ${audience}
    Key Points to Include:
    - ${keyPoints.split('\n').join('\n- ')}
    
    Draft a clear, concise, and professional message suitable for the specified audience. Structure it appropriately (e.g., use bullet points for status updates if relevant).
    
    Begin the draft now:`;
    
    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    res.status(200).json({ draft: response.text });

  } catch (error) {
    console.error('Error calling Gemini API for communication draft:', error);
    res.status(500).json({ error: 'Failed to generate communication draft.' });
  }
}