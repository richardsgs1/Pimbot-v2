
import React, { useState, FormEvent, useRef, useEffect, useMemo } from 'react';
import type { OnboardingData, Project, SearchResults, SearchResultItem, TeamMember } from '../types';
import { ProjectStatus, Priority } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import ProjectList from './ProjectList';
import ProjectDetails from './ProjectDetails';
import Home from './Home';
import Analytics from './Analytics';
import SearchResultsOverlay from './SearchResultsOverlay';

// Mock Data for Team
const mockTeam: TeamMember[] = [
    { id: 'user-1', name: 'Valued User', avatarColor: 'bg-cyan-500' }, // Current user
    { id: 'user-2', name: 'Alex Green', avatarColor: 'bg-green-500' },
    { id: 'user-3', name: 'Samantha Blue', avatarColor: 'bg-blue-500' },
    { id: 'user-4', name: 'Leo Yellow', avatarColor: 'bg-yellow-500' },
];

// Mock Data for Projects
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Q3 Marketing Campaign Launch',
    description: 'A comprehensive marketing campaign to launch the new "Synergy" product line. Includes digital, print, and social media outreach.',
    status: ProjectStatus.OnTrack,
    dueDate: '2024-09-30',
    progress: 75,
    tasks: [
      { id: 't1-1', name: 'Finalize ad copy', completed: true, priority: Priority.High, dueDate: '2024-07-15', assigneeId: 'user-2' },
      { id: 't1-2', name: 'Approve social media assets', completed: true, priority: Priority.Medium, dueDate: '2024-07-20', assigneeId: 'user-3' },
      { id: 't1-3', name: 'Launch PPC campaign', completed: false, priority: Priority.High, dueDate: '2024-08-01', dependsOn: 't1-2', assigneeId: 'user-1' },
      { id: 't1-4', name: 'Monitor initial engagement metrics', completed: false, priority: Priority.Low, dependsOn: 't1-3', assigneeId: 'user-4' },
    ],
    journal: [],
  },
  {
    id: 'proj-2',
    name: 'Website Redesign & Migration',
    description: 'Complete overhaul of the corporate website, including a new UI/UX design, and migration to a new hosting platform.',
    status: ProjectStatus.AtRisk,
    dueDate: '2024-08-15',
    progress: 40,
    tasks: [
      { id: 't2-1', name: 'User research and personas', completed: true, priority: Priority.High, dueDate: '2024-05-30', assigneeId: 'user-3' },
      { id: 't2-2', name: 'Wireframing and mockups', completed: true, priority: Priority.Medium, dueDate: '2024-06-15', dependsOn: 't2-1', assigneeId: 'user-2' },
      { id: 't2-3', name: 'Frontend development', completed: false, priority: Priority.High, dueDate: '2024-07-25', dependsOn: 't2-2', assigneeId: 'user-1' },
      { id: 't2-4', name: 'Backend integration', completed: false, priority: Priority.Medium, dueDate: '2024-07-30', dependsOn: 't2-2' },
      { id: 't2-5', name: 'Content migration', completed: false, priority: Priority.Low, dependsOn: 't2-3', assigneeId: 'user-4' },
    ],
    journal: [],
  },
  {
    id: 'proj-3',
    name: 'Mobile App Feature Update (v2.5)',
    description: 'Release version 2.5 of the mobile app, featuring a new user dashboard and integration with third-party calendars.',
    status: ProjectStatus.Completed,
    dueDate: '2024-06-01',
    progress: 100,
    tasks: [
        { id: 't3-1', name: 'Develop dashboard UI', completed: true, priority: Priority.High, dueDate: '2024-05-10', assigneeId: 'user-1' },
        { id: 't3-2', name: 'Implement calendar API', completed: true, priority: Priority.Medium, dueDate: '2024-05-20', assigneeId: 'user-2' },
        { id: 't3-3', name: 'Perform QA and bug fixing', completed: true, priority: Priority.Low, dependsOn: 't3-2', assigneeId: 'user-3' },
        { id: 't3-4', name: 'Deploy to app stores', completed: true, priority: Priority.None, dependsOn: 't3-3' },
    ],
    journal: [],
  },
];


interface DashboardProps {
  userData: OnboardingData;
  onLogout: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

type View = 'home' | 'chat' | 'projectList' | 'projectDetails' | 'analytics';

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
    const savedChat = localStorage.getItem(`pimbot_chatHistory_${userData.name}`);
    return savedChat ? JSON.parse(savedChat) : [];
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [projects, setProjects] = useState<Project[]>(() => {
    const savedProjects = localStorage.getItem(`pimbot_projects_${userData.name}`);
    return savedProjects ? JSON.parse(savedProjects) : mockProjects;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  // Update the mock team to ensure the current user's name is correct
  const team = useMemo(() => {
    const updatedTeam = mockTeam.map(member => 
      member.id === 'user-1' ? { ...member, name: userData.name, id: userData.id } : member
    );
    // Ensure the current user is in the team if they aren't 'user-1'
    if (!updatedTeam.find(m => m.id === userData.id)) {
        updatedTeam.push({ id: userData.id, name: userData.name, avatarColor: 'bg-cyan-500' });
    }
    return updatedTeam;
  }, [userData.id, userData.name]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(`pimbot_projects_${userData.name}`, JSON.stringify(projects));
  }, [projects, userData.name]);

  const searchResults = useMemo<SearchResults>(() => {
    if (!searchTerm.trim()) {
      return { projects: [], tasks: [], journal: [] };
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results: SearchResults = { projects: [], tasks: [], journal: [] };

    projects.forEach(project => {
      // Search projects
      if (project.name.toLowerCase().includes(lowerCaseSearchTerm) || project.description.toLowerCase().includes(lowerCaseSearchTerm)) {
        results.projects.push({ type: 'project', data: project });
      }
      // Search tasks
      project.tasks.forEach(task => {
        if (task.name.toLowerCase().includes(lowerCaseSearchTerm)) {
          results.tasks.push({ type: 'task', data: task, project: { id: project.id, name: project.name } });
        }
      });
      // Search journal
      project.journal.forEach(entry => {
        if (entry.content.toLowerCase().includes(lowerCaseSearchTerm)) {
          results.journal.push({ type: 'journal', data: entry, project: { id: project.id, name: project.name } });
        }
      });
    });

    return results;
  }, [searchTerm, projects]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setAiSearchSummary(null);
      return;
    }

    const hasResults = searchResults.projects.length > 0 || searchResults.tasks.length > 0 || searchResults.journal.length > 0;
    if (!hasResults) {
      setAiSearchSummary(null);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSummaryLoading(true);
      setAiSearchSummary(null);
      try {
        const response = await fetch('/api/summarize-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchTerm,
            resultCounts: {
              projects: searchResults.projects.length,
              tasks: searchResults.tasks.length,
              journal: searchResults.journal.length
            }
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch summary.');
        const data = await response.json();
        setAiSearchSummary(data.summary);
      } catch (error) {
        console.error("Failed to get AI search summary:", error);
        setAiSearchSummary("Could not generate summary.");
      } finally {
        setIsSummaryLoading(false);
      }
    }, 500); // Debounce API call

    return () => clearTimeout(handler);
  }, [searchResults, searchTerm]);

  const handleSearchResultClick = (item: SearchResultItem) => {
    if (item.type === 'project') {
      setSelectedProjectId(item.data.id);
    } else {
      setSelectedProjectId(item.project.id);
    }
    setCurrentView('projectDetails');
    setSearchTerm(''); // Clear search after selection
  };
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem(`pimbot_chatHistory_${userData.name}`, JSON.stringify(chatHistory));
  }, [chatHistory, userData.name]);

  useEffect(() => {
    if (currentView === 'chat') {
        scrollToBottom();
    }
  }, [chatHistory, isStreaming, currentView]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 192; // Corresponds to max-h-48
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(adjustTextareaHeight, [prompt]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    setError(null);
    setIsStreaming(true);

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    const currentPrompt = prompt;
    const historyForApi = [...chatHistory];
    
    setChatHistory(prev => [...prev, userMessage, { role: 'model', content: '' }]);
    setPrompt('');
    setTimeout(() => adjustTextareaHeight(), 0);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          userData: userData,
          history: historyForApi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'The server returned an error.');
      }
      
      if (!response.body) {
        throw new Error("Response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].content += chunk;
            return newHistory;
        });
      }

    } catch (err) {
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
      }
      setChatHistory(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'model' && lastMessage.content === '') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
      setError(errorMessage);
    } finally {
      setIsStreaming(false);
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
  
  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(`pimbot_chatHistory_${userData.name}`);
  }
  
  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('projectDetails');
  };
  
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'status' | 'progress' | 'journal'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      status: ProjectStatus.OnTrack, // Default status
      progress: 0, // Default progress
      journal: [{
        id: `j-${Date.now()}`,
        date: new Date().toISOString(),
        content: `Project "${projectData.name}" was created.`
      }],
      tasks: projectData.tasks.map((task, index) => ({
        ...task,
        id: `task-${Date.now()}-${index}`,
        completed: false,
        priority: Priority.None, // Default priority
      }))
    };
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
    // Also update the selected project if it's the one being viewed
    if (selectedProjectId === updatedProject.id) {
      // This is implicitly handled by the state update, but good to be aware of
    }
  };

  const renderMainContent = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    switch (currentView) {
        case 'home':
            return <Home projects={projects} onSelectProject={handleSelectProject} userData={userData} />;
        case 'projectList':
            return <ProjectList projects={projects} onSelectProject={handleSelectProject} onProjectCreated={handleCreateProject} />;
        case 'projectDetails':
            if (selectedProject) {
                return <ProjectDetails project={selectedProject} onBack={() => setCurrentView('projectList')} onUpdateProject={handleUpdateProject} team={team} />;
            }
            // Fallback to project list if no project is selected
            setCurrentView('projectList');
            return null;
        case 'analytics':
            return <Analytics projects={projects} onUpdateProject={handleUpdateProject} />;
        case 'chat':
        default:
            return (
                 <div className="flex-1 flex flex-col h-screen">
                    <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
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
                            {chatHistory.length === 0 && (
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
                                <div className={`max-w-2xl rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none p-4' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                {msg.role === 'model' ? (
                                    <div className="p-4">
                                    <MarkdownRenderer content={msg.content + (isStreaming && index === chatHistory.length - 1 ? '▍' : '')} />
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                                </div>
                                {msg.role === 'user' && <UserIcon name={userData.name} />}
                            </div>
                            ))}

                            {error && (
                            <div className="my-6 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">
                                {error}
                            </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 border-t border-slate-700 flex-shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="relative">
                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e as any);
                                }
                                }}
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl resize-none text-white p-4 pr-32 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 max-h-48"
                                placeholder="Ask PiMbOt AI anything..."
                                rows={1}
                                disabled={isStreaming}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                                <button type="button" className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition disabled:opacity-50" title="Upload Document (Coming Soon)" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </button>
                                <button type="button" className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition disabled:opacity-50" title="Use Voice (Coming Soon)" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                </button>
                                <button type="submit" disabled={!prompt.trim() || isStreaming} className="bg-cyan-600 text-white p-2 rounded-full hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition transform hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            );
    }
  };


  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <aside className="w-64 bg-slate-800 p-6 flex-col justify-between border-r border-slate-700 hidden md:flex">
        <div>
          <div className="flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" />
            </svg>
            <h1 className="text-2xl font-bold">PiMbOt AI</h1>
          </div>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            {searchTerm.trim() && <SearchResultsOverlay results={searchResults} onResultClick={handleSearchResultClick} aiSummary={aiSearchSummary} isSummaryLoading={isSummaryLoading} />}
          </div>

          <button onClick={clearChat} className="w-full flex items-center justify-center p-3 mb-4 rounded-lg bg-cyan-600/50 hover:bg-cyan-600/80 text-cyan-200 font-semibold transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          <nav>
            <ul>
              <li className="mb-2">
                <button onClick={() => setCurrentView('home')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView === 'home' ? 'bg-cyan-600/30 text-cyan-300' : 'hover:bg-slate-700 text-slate-400'}`}>
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></SidebarIcon>
                  Home
                </button>
              </li>
              <li className="mb-2">
                <button onClick={() => setCurrentView('chat')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView === 'chat' ? 'bg-cyan-600/30 text-cyan-300' : 'hover:bg-slate-700 text-slate-400'}`}>
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg></SidebarIcon>
                  Chat
                </button>
              </li>
              <li className="mb-2">
                <button onClick={() => setCurrentView('projectList')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView.startsWith('project') ? 'bg-cyan-600/30 text-cyan-300' : 'hover:bg-slate-700 text-slate-400'}`}>
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></SidebarIcon>
                  Projects
                </button>
              </li>
              <li className="mb-2">
                <button onClick={() => setCurrentView('analytics')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView === 'analytics' ? 'bg-cyan-600/30 text-cyan-300' : 'hover:bg-slate-700 text-slate-400'}`}>
                  <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg></SidebarIcon>
                  Analytics
                </button>
              </li>
            </ul>
          </nav>
        </div>
        <div>
          <div className="border-t border-slate-700 pt-4">
            <a href="https://forms.gle/your-feedback-form-link" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400">
              <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></SidebarIcon>
              Feedback
            </a>
            <button className="w-full flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400" disabled>
              <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></SidebarIcon>
              Settings
            </button>
            <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg hover:bg-slate-700 text-slate-400 mt-2">
              <SidebarIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></SidebarIcon>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen max-h-screen overflow-y-hidden">
        {renderMainContent()}
      </main>
    </div>
  );
};
export default Dashboard;