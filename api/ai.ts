import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    switch (action) {
      case 'daily-briefing':
        try {
          if (!data?.prompt) {
            return res.status(400).json({ error: 'Prompt is required for daily briefing' });
          }

          const result = await model.generateContent(data.prompt);
          const response = await result.response;
          const briefing = response.text();

          return res.status(200).json({ briefing });
        } catch (error) {
          console.error('Daily briefing error:', error);
          return res.status(500).json({ error: 'Failed to generate daily briefing' });
        }

      case 'chat':
        try {
          if (!data?.message) {
            return res.status(400).json({ error: 'Message is required for chat' });
          }

          let fullPrompt = data.message;
          if (data.history && Array.isArray(data.history)) {
            const conversationContext = data.history
              .map((msg: any) => `${msg.role}: ${msg.content}`)
              .join('\n');
            fullPrompt = `Previous conversation:\n${conversationContext}\n\nUser: ${data.message}`;
          }

          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          const reply = response.text();

          return res.status(200).json({ reply });
        } catch (error) {
          console.error('Chat error:', error);
          return res.status(500).json({ error: 'Failed to generate chat response' });
        }

      case 'skill-aware-response':
        try {
          if (!data?.prompt || !data?.skillLevel) {
            return res.status(400).json({ error: 'Prompt and skill level are required' });
          }

          let enhancedPrompt = data.prompt;
          
          switch (data.skillLevel) {
            case 'No Experience':
              enhancedPrompt = `As a helpful AI assistant for someone completely new to project management, provide a beginner-friendly, step-by-step response that explains basic concepts clearly. Use simple language and avoid jargon. ${data.prompt}`;
              break;
            case 'Novice':
              enhancedPrompt = `As an AI assistant for someone with basic project management knowledge, provide a clear response with some context and explanation. ${data.prompt}`;
              break;
            case 'Intermediate':
              enhancedPrompt = `As an AI assistant for someone with moderate project management experience, provide a balanced response with relevant details and best practices. ${data.prompt}`;
              break;
            case 'Experienced':
              enhancedPrompt = `As an AI assistant for an experienced project manager, provide a comprehensive response with advanced insights and strategic considerations. ${data.prompt}`;
              break;
            case 'Expert':
              enhancedPrompt = `As an AI assistant for a project management expert, provide sophisticated insights, cutting-edge strategies, and expert-level analysis. ${data.prompt}`;
              break;
          }

          const result = await model.generateContent(enhancedPrompt);
          const response = await result.response;
          const reply = response.text();

          return res.status(200).json({ reply });
        } catch (error) {
          console.error('Skill-aware response error:', error);
          return res.status(500).json({ error: 'Failed to generate skill-aware response' });
        }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}