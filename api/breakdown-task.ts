import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Type, GenerateContentResponse, GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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

// A robust function to clean and parse JSON from the model's text response.
function cleanAndParseJson(rawText: string): any {
  if (!rawText) return {};
  let cleanedText = rawText.trim();
  const jsonRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const match = cleanedText.match(jsonRegex);
  if (match && match[1]) {
    cleanedText = match[1];
  }
  if (!cleanedText) return {};
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse JSON after cleaning:", cleanedText);
    return {}; 
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
    const { objective, projectContext } = req.body as { objective: string; projectContext: { name: string; description: string } };

    if (!objective || !projectContext) {
      return res.status(400).json({ error: 'Objective and project context are required.' });
    }

    const systemInstruction = `You are an expert project manager. Your goal is to break down a high-level user objective into a list of smaller, concrete, and actionable sub-tasks.
Consider the overall context of the project. The tasks should be logical next steps.
Generate between 3 and 7 tasks. Task names should be clear, concise, and start with an action verb (e.g., "Design", "Develop", "Research").`;

    const userPrompt = `Project Name: "${projectContext.name}"
Project Description: "${projectContext.description}"

High-Level Objective: "${objective}"

Please break this objective down into actionable sub-tasks.`;

    const breakdownSchema = {
      type: Type.OBJECT,
      properties: {
        tasks: {
          type: Type.ARRAY,
          description: "A list of actionable sub-task names.",
          items: {
            type: Type.STRING,
            description: "A concise, actionable task name."
          }
        }
      },
      required: ['tasks']
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: breakdownSchema,
      },
    });

    const rawText = safeExtractText(response);
    if (!rawText) {
      throw new Error('The AI model returned an empty or blocked response. This may be due to content safety filters.');
    }
    
    const breakdown = cleanAndParseJson(rawText);

    if (!breakdown || !breakdown.tasks) {
        throw new Error('The AI model returned a response in an unexpected format.');
    }

    return res.status(200).json(breakdown);

  } catch (error) {
    console.error('Error in breakdown-task handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to break down the task.';
    return res.status(500).json({ error: errorMessage });
  }
}