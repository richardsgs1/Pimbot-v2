import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import type { Task, TeamMember } from '../types';
import { CommunicationType } from '../types';

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

const getSystemInstruction = (type: CommunicationType) => {
    let instruction = `You are an expert project manager drafting a communication. Your tone should be clear, professional, and friendly.
The output should be the message body only, suitable for pasting into an email or chat client. Do not include a subject line.`;

    switch (type) {
        case CommunicationType.AssignTask:
            instruction += ` The message should clearly state the task, its due date (if any), and offer support.`;
            break;
        case CommunicationType.RequestUpdate:
            instruction += ` The message should politely ask for a status update on the task, acknowledging its due date.`;
            break;
        case CommunicationType.AnnounceCompletion:
            instruction += ` The message should announce the completion of the task to the team, highlighting its importance to the project.`;
            break;
    }
    return instruction;
};

const buildPrompt = (
    type: CommunicationType, 
    task: Task, 
    project: { name: string },
    assignee: TeamMember | null,
    projectManager: { name: string }
): string => {
    let prompt = `Draft a message for the following scenario:\n`;
    prompt += `- Communication Type: ${type}\n`;
    prompt += `- Project Manager: ${projectManager.name}\n`;
    prompt += `- Project Name: ${project.name}\n`;
    prompt += `- Task Name: "${task.name}"\n`;
    if (task.dueDate) prompt += `- Task Due Date: ${task.dueDate}\n`;
    if (assignee) prompt += `- Recipient: ${assignee.name}\n`;
    
    if (type === CommunicationType.AnnounceCompletion) {
        prompt += `\nThe message should be addressed to the whole team.`;
    }
    
    return prompt;
};

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

    const { type, task, project, assignee, projectManager } = req.body as {
        type: CommunicationType;
        task: Task;
        project: { name: string };
        assignee: TeamMember | null;
        projectManager: { name: string };
    };

    if (!type || !task || !project || !projectManager) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const systemInstruction = getSystemInstruction(type);
    const prompt = buildPrompt(type, task, project, assignee, projectManager);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const draft = safeExtractText(response).trim();

    if (!draft) {
      throw new Error('The AI model returned an empty or blocked response.');
    }

    return res.status(200).json({ draft });

  } catch (error) {
    console.error('Error in draft-communication handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to draft communication.';
    return res.status(500).json({ error: errorMessage });
  }
}