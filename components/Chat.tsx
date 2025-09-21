import React, { useState, useRef, useEffect } from 'react';
import type { OnboardingData, Project, ChatMessage } from '../types';
import { SkillLevel } from '../types';
import SkillAwareAI from './SkillAwareAI';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatProps {
  userData: OnboardingData;
  projects: Project[];
  onMenuClick: () => void;
}

const Chat: React.FC<ChatProps> = ({ userData, projects, onMenuClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add welcome message based on skill level
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date().toISOString()
    }]);
  }, [userData.skillLevel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = (): string => {
    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return `Hi ${userData.name}! Welcome to your AI project management assistant. I'm here to help you learn project management step by step. Feel free to ask me anything - from basic concepts like "What is a project timeline?" to specific help with your current projects. Don't worry if you're not sure what to ask - I'm here to guide you through everything!`;
      
      case SkillLevel.NOVICE:
        return `Hello ${userData.name}! I'm your AI project management assistant. I can help you with your projects, explain PM concepts, and suggest best practices. Ask me about anything from task planning to team coordination - I'll provide clear explanations and practical advice.`;
      
      case SkillLevel.INTERMEDIATE:
        return `Hi ${userData.name}! Ready to tackle your project challenges? I can help with strategic planning, risk management, resource optimization, and advanced project techniques. What would you like to work on today?`;
      
      case SkillLevel.EXPERIENCED:
        return `Welcome ${userData.name}! I'm here to provide strategic insights, portfolio optimization advice, and advanced project management guidance. How can I help you drive your projects forward today?`;
      
      case SkillLevel.EXPERT:
        return `Hello ${userData.name}! Let's focus on strategic excellence. I can assist with portfolio strategy, organizational PMO development, and executive-level project insights. What strategic challenges are you facing?`;
      
      default:
        return `Hi ${userData.name}! I'm your AI project management assistant. How can I help you today?`;
    }
  };

  const getSkillLevelPrompts = (): string[] => {
    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return [
          "What is project management?",
          "How do I start planning a project?",
          "What's the difference between tasks and milestones?",
          "Help me understand project status"
        ];
      
      case SkillLevel.NOVICE:
        return [
          "How can I improve my project planning?",
          "What should I do when a task is behind schedule?",
          "How do I communicate with stakeholders?",
          "Help me organize my project tasks"
        ];
      
      case SkillLevel.INTERMEDIATE:
        return [
          "How can I optimize resource allocation?",
          "What's the best way to manage project risks?",
          "How do I handle scope changes?",
          "Help me improve team productivity"
        ];
      
      case SkillLevel.EXPERIENCED:
        return [
          "How can I optimize my project portfolio?",
          "What are advanced risk mitigation strategies?",
          "How do I mentor junior project managers?",
          "Help me with strategic project planning"
        ];
      
      case SkillLevel.EXPERT:
        return [
          "How can I improve organizational PMO maturity?",
          "What are emerging trends in project management?",
          "How do I align projects with business strategy?",
          "Help me develop project management standards"
        ];
      
      default:
        return ["How can I improve my projects?"];
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setCurrentResponse('');

    try {
      const context = `User is managing ${projects.length} projects. Current projects: ${projects.map(p => `${p.name} (${p.status})`).join(', ')}`;
      const prompt = SkillAwareAI.createChatPrompt(userData, inputMessage, context);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          prompt: prompt,
          message: inputMessage,
          userData: userData,
          projects: projects
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedResponse += data.content;
                  setCurrentResponse(accumulatedResponse);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedResponse || 'Sorry, I couldn\'t generate a response.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse('');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFallbackResponse(inputMessage),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const getFallbackResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('timeline') || lowerInput.includes('schedule')) {
      return SkillAwareAI.getFeatureHelp(userData.skillLevel!, 'timeline');
    }
    
    if (lowerInput.includes('status') || lowerInput.includes('progress')) {
      return SkillAwareAI.getFeatureHelp(userData.skillLevel!, 'projectStatus');
    }

    switch (userData.skillLevel) {
      case SkillLevel.NO_EXPERIENCE:
        return "I'm having trouble connecting right now, but I'm here to help you learn! Try asking about basic project management concepts, or check out the Timeline and Projects sections to explore your current work. Remember, every expert was once a beginner!";
      
      case SkillLevel.NOVICE:
        return "I'm experiencing connection issues, but don't let that stop your progress! Try exploring the different sections of PiMbOt - the Timeline view can help you visualize your project schedules, and the Projects section lets you track your work.";
      
      default:
        return "I'm temporarily unable to provide a custom response. Please try again in a moment, or explore the Timeline and Projects sections for insights into your current portfolio.";
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const skillLevelPrompts = getSkillLevelPrompts();

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
        <div className="flex items-center">
          <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-full hover:bg-[var(--bg-tertiary)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Assistant</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              {userData.skillLevel === SkillLevel.NO_EXPERIENCE ? 'Learning Mode' :
               userData.skillLevel === SkillLevel.NOVICE ? 'Building Skills' :
               userData.skillLevel === SkillLevel.INTERMEDIATE ? 'Growing Expertise' :
               userData.skillLevel === SkillLevel.EXPERIENCED ? 'Strategic Focus' :
               'Expert Level'} • {projects.length} active projects
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Suggested questions for your level:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {skillLevelPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="text-left p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
              message.role === 'user'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
            }`}>
              {message.role === 'assistant' ? (
                <MarkdownRenderer content={message.content} />
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isStreaming && currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
              <MarkdownRenderer content={currentResponse} />
              <div className="flex items-center mt-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="rounded-full h-2 w-2 bg-[var(--accent-primary)]"></div>
                  <div className="rounded-full h-2 w-2 bg-[var(--accent-primary)]"></div>
                  <div className="rounded-full h-2 w-2 bg-[var(--accent-primary)]"></div>
                </div>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={userData.skillLevel === SkillLevel.NO_EXPERIENCE ? 
            "Ask me anything about project management..." :
            "How can I help with your projects today?"
          }
          disabled={isStreaming}
          className="flex-1 px-4 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-50"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isStreaming}
          className="px-6 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;