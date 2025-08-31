
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

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

    const { prompt } = req.body as { prompt: string };

    if (!prompt) {
      return res.status(400).json({ error: 'A project description prompt is required.' });
    }

    // Step 1: Generate the project plan (text-based)
    const systemInstruction = `You are a project management assistant. Based on the user's prompt, create a structured project plan.
- The project name should be a concise title.
- The description should be a one or two-sentence summary.
- The due date should be inferred from the prompt or set to a reasonable future date if not specified. Format it as YYYY-MM-DD.
- Generate a list of 3-5 high-level tasks to get the user started. Task names should be clear and actionable.`;

    const projectSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'The concise name of the project.' },
        description: { type: Type.STRING, description: 'A brief summary of the project.' },
        dueDate: { type: Type.STRING, description: 'The project due date in YYYY-MM-DD format.' },
        tasks: {
          type: Type.ARRAY,
          description: 'A list of initial tasks for the project.',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'The name of the task.' },
            },
            required: ['name'],
          },
        },
      },
      required: ['name', 'description', 'dueDate', 'tasks'],
    };

    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: projectSchema,
      },
    });
    
    const projectData = JSON.parse((textResponse.text ?? '{}').trim());

    // Step 2: Generate a cover image for the project
    let coverImageUrl: string | undefined = undefined;
    try {
        const imagePrompt = `A professional, abstract, digital art piece representing a project about '${projectData.name}'. Minimalist, clean, tech theme, with a color palette of cyan, blue, and dark slate.`;
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '16:9',
            },
        });
        
        const base64ImageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
        if (base64ImageBytes) {
            coverImageUrl = `data:image/png;base64,${base64ImageBytes}`;
        }
    } catch (imageError) {
        console.warn('Could not generate project cover image:', imageError);
        // If image generation fails, we still proceed without it.
    }
    
    const finalProjectData = { ...projectData, coverImageUrl };

    return res.status(200).json(finalProjectData);

  } catch (error) {
    console.error('Error in generate-project handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate project from the AI model.';
    return res.status(500).json({ error: errorMessage });
  }
}