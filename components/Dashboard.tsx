import React, { useState, FormEvent, useRef, useEffect } from 'react';
import type { OnboardingData } from '../types';

interface DashboardProps {
  userData: OnboardingData;
  onLogout: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const SidebarIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mr-3">{children}</span>
);

const UserIcon: React.FC<{name: string}> = ({ name }) => (
    <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white flex-shrink-0" title={name}>
        {name.charAt(0).toUpperCase()}
    </div>
);

const ModelIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" />
        </svg>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ userData, onLogout }) => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    // Load chat history from localStorage
    const savedChat = localStorage.getItem(`pimbot_chatHistory_${userData.name}`);
    return savedChat ? JSON.parse(savedChat) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Save chat history to localStorage whenever it changes
    localStorage.setItem(`pimbot_chatHistory_${userData.name}`, JSON.stringify(chatHistory));
  }, [chatHistory, userData.name]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setChatHistory(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      // This now calls our secure backend endpoint instead of Google's API directly.
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          userData: userData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'The server returned an error.');
      }

      const data = await response.json();

      const modelMessage: ChatMessage = { role: 'model', content: data.text };
      setChatHistory(prev => [...prev, modelMessage]);

    } catch (err) {
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
      // We don't add the error to chat history anymore, we show it in a dedicated UI spot if needed.
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const getGreeting = () => {
    if (!userData.skillLevel) return "Let's manage your projects efficiently.";
    switch (userData.skillLevel) {
      case 'Novice': return "We'll guide you through every step of your project management journey.";
      case 'Intermediate': return "Ready to level up your project management skills?";
      case 'Experienced': return "Here are the insights you need to excel.";
      case 'Expert': return "High-level overview of your projects. Let's optimize.";
      default: return "Let's manage your projects efficiently.";
    }
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 p-6 flex-col justify-between border-r border-slate-700 hidden md:flex">
        <div>
          <div className="flex items-center mb-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" />
            </svg>
            <h1 className="text-2xl font-bold">PiMbOt AI</h1>
          </div>
          <nav>
            <ul>
              <li className="mb-2">
                <a href="#" className="flex items-center p-3 rounded-lg bg-cyan-600/30 text-cyan-300 font-semibold">
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg></SidebarIcon>
                  Chat
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400">
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></SidebarIcon>
                  Projects
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400">
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg></SidebarIcon>
                  Analytics
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div>
          <div className="border-t border-slate-700 pt-4">
            {/* Replace this link with your actual feedback form URL */}
            <a href="https://forms.gle/your-feedback-form-link" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400">
              <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></SidebarIcon>
              Feedback
            </a>
            <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400">
              <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></SidebarIcon>
              Settings
            </a>
            <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400 mt-2">
              <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></SidebarIcon>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold">Hello, {userData.name}</h2>
            <p className="text-sm text-slate-400">{getGreeting()}</p>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-4">
              <p className="font-semibold">{userData.name}</p>
              <p className="text-xs text-slate-400">{userData.skillLevel}</p>
            </div>
            <UserIcon name={userData.name} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {chatHistory.length === 0 && !isLoading && (
              <div className="text-center mt-20">
                <div className="inline-block bg-slate-700 p-6 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" /></svg>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Ask PiMbOt AI Anything</h3>
                <p className="mt-2 text-slate-400">For example: "Explain the difference between Agile and Scrum"</p>
              </div>
            )}
            
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 my-6 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <ModelIcon />}
                <div className={`max-w-2xl p-4 rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && <UserIcon name={userData.name} />}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-4 my-6">
                <ModelIcon />
                <div className="max-w-2xl p-4 rounded-xl bg-slate-700 text-slate-300 rounded-bl-none">
                  <div className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2"></span>
                    Thinking...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="my-6 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-700">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl resize-none text-white p-4 pr-32 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                placeholder="Ask PiMbOt AI anything..."
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                 <button type="button" className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition disabled:opacity-50" title="Upload Document (Coming Soon)" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </button>
                 <button type="button" className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition disabled:opacity-50" title="Use Voice (Coming Soon)" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
                <button type="submit" disabled={!prompt.trim() || isLoading} className="bg-cyan-600 text-white p-2 rounded-full hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition transform hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;