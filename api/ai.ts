// Option 1: Try this import first
import { GoogleGenerativeAI } from '@google/generative-ai';
// If that doesn't work, try: import { GoogleGenerativeAI } from '@google/genai';

import type { VercelRequest, VercelResponse } from '@vercel/node';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, ...data } = req.body;

    switch (action) {
      case 'generate':
        return await handleGenerate(req, res, data);
      case 'briefing':
        return await handleBriefing(req, res, data);
      case 'get-portfolio-summary':
        return await handlePortfolioSummary(req, res, data);
      case 'generate-health-summary':
        return await handleHealthSummary(req, res, data);
      case 'draft-communication':
        return await handleDraftCommunication(req, res, data);
      case 'summarize-search':
        return await handleSummarizeSearch(req, res, data);
      case 'suggest-tasks':
        return await handleSuggestTasks(req, res, data);
      case 'summarize-journal':
        return await handleSummarizeJournal(req, res, data);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

// Generate chat responses (streaming)
async function handleGenerate(req: VercelRequest, res: VercelResponse, data: any) {
  const { prompt, userData, history } = data;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const context = `You are PiMbOt AI, a project management assistant and teaching tool. 
User Info: ${userData.name}, Skill Level: ${userData.skillLevel || 'Not specified'}
Tools they use: ${userData.tools?.join(', ') || 'Not specified'}
Methodologies: ${userData.methodologies?.join(', ') || 'Not specified'}

Provide helpful, practical project management advice. Tailor your response to their skill level.`;

    // Build conversation history
    const chatHistory = history?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream(`${context}\n\nUser: ${prompt}`);

    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }

    res.end();
  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}

// Daily briefing
async function handleBriefing(req: VercelRequest, res: VercelResponse, data: any) {
  const { userData, projects } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Create a daily briefing for ${userData.name} (${userData.skillLevel} level PM).
    
Projects: ${JSON.stringify(projects, null, 2)}

Provide a concise daily briefing with:
1. Key priorities for today
2. Upcoming deadlines
3. Projects needing attention
4. Quick wins available

Keep it under 200 words and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ briefing: response.text() });
  } catch (error) {
    console.error('Briefing error:', error);
    return res.status(500).json({ error: 'Failed to generate briefing' });
  }
}

// Portfolio summary
async function handlePortfolioSummary(req: VercelRequest, res: VercelResponse, data: any) {
  const { projects } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this project portfolio and provide insights:
    
${JSON.stringify(projects, null, 2)}

Provide:
1. Overall portfolio health
2. Risk assessment
3. Resource allocation insights
4. Recommendations for improvement

Keep response under 300 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ summary: response.text() });
  } catch (error) {
    console.error('Portfolio summary error:', error);
    return res.status(500).json({ error: 'Failed to generate portfolio summary' });
  }
}

// Health summary for projects
async function handleHealthSummary(req: VercelRequest, res: VercelResponse, data: any) {
  const { project } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze project health and provide summary:
    
Project: ${JSON.stringify(project, null, 2)}

Provide a brief health assessment focusing on:
1. Current status vs timeline
2. Task completion rate
3. Potential risks
4. Next critical actions

Keep under 150 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ healthSummary: response.text() });
  } catch (error) {
    console.error('Health summary error:', error);
    return res.status(500).json({ error: 'Failed to generate health summary' });
  }
}

// Draft communication
async function handleDraftCommunication(req: VercelRequest, res: VercelResponse, data: any) {
  const { type, context, recipient } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Draft a ${type} communication for project management:
    
Context: ${context}
Recipient: ${recipient}

Create a professional, clear, and actionable ${type}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ communication: response.text() });
  } catch (error) {
    console.error('Communication draft error:', error);
    return res.status(500).json({ error: 'Failed to draft communication' });
  }
}

// Summarize search results
async function handleSummarizeSearch(req: VercelRequest, res: VercelResponse, data: any) {
  const { searchTerm, resultCounts } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `User searched for "${searchTerm}" and found:
- ${resultCounts.projects} projects
- ${resultCounts.tasks} tasks  
- ${resultCounts.journal} journal entries

Provide a brief, helpful summary of what this search likely indicates and suggest next actions. Keep under 100 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ summary: response.text() });
  } catch (error) {
    console.error('Search summary error:', error);
    return res.status(500).json({ error: 'Failed to summarize search' });
  }
}

// Suggest tasks
async function handleSuggestTasks(req: VercelRequest, res: VercelResponse, data: any) {
  const { project, userData } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Suggest next tasks for this project based on user skill level (${userData.skillLevel}):

Project: ${JSON.stringify(project, null, 2)}

Suggest 3-5 specific, actionable tasks that would move this project forward. Consider current task dependencies and project status.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ suggestions: response.text() });
  } catch (error) {
    console.error('Task suggestion error:', error);
    return res.status(500).json({ error: 'Failed to suggest tasks' });
  }
}

// Summarize journal entries
async function handleSummarizeJournal(req: VercelRequest, res: VercelResponse, data: any) {
  const { journalEntries, timeframe } = data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Summarize these project journal entries from ${timeframe}:

${JSON.stringify(journalEntries, null, 2)}

Provide key insights, patterns, and recommendations based on the journal activity.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.json({ summary: response.text() });
  } catch (error) {
    console.error('Journal summary error:', error);
    return res.status(500).json({ error: 'Failed to summarize journal' });
  }
}