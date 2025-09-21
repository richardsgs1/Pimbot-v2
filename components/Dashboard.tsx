import React, { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import type { OnboardingData, Project, TeamMember } from '../types';
import { ProjectStatus, Priority } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import ProjectList from './ProjectList';
import ProjectDetails from './ProjectDetails';
import Home from './Home';
import Analytics from './Analytics';
import TeamHub from './TeamHub';
import DailyBriefing from './DailyBriefing';
import StandaloneSearch from './StandaloneSearch';
import ThemeToggle from './ThemeToggle';

interface DashboardProps {
  userData: OnboardingData;
  onLogout: () => void;
}

type View = 'home' | 'projectList' | 'projectDetails' | 'chat' | 'analytics' | 'teamHub';

// Mock data for projects and team members
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design and improved UX',
    status: ProjectStatus.OnTrack,
    dueDate: '2024-12-15',
    progress: 65,
    tasks: [
      { id: '1', name: 'Design mockups', completed: true, priority: Priority.High, dueDate: '2024-11-01' },
      { id: '2', name: 'Frontend development', completed: false, priority: Priority.High, dueDate: '2024-11-30' },
      { id: '3', name: 'Content migration', completed: false, priority: Priority.Medium, dueDate: '2024-12-10' }
    ],
    journal: [
      { id: '1', date: '2024-10-15', content: 'Project kickoff meeting completed', type: 'user' },
      { id: '2', date: '2024-10-20', content: 'Design phase progressing well', type: 'user' }
    ]
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms',
    status: ProjectStatus.AtRisk,
    dueDate: '2025-01-30',
    progress: 35,
    tasks: [
      { id: '4', name: 'Requirements gathering', completed: true, priority: Priority.High, dueDate: '2024-10-15' },
      { id: '5', name: 'UI/UX design', completed: false, priority: Priority.High, dueDate: '2024-11-15' },
      { id: '6', name: 'Backend API', completed: false, priority: Priority.Medium, dueDate: '2024-12-01' }
    ],
    journal: [
      { id: '3', date: '2024-10-10', content: 'Initial planning session', type: 'user' }
    ]
  }
];

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Alice Johnson', avatarColor: 'bg-blue-500' },
  { id: '2', name: 'Bob Smith', avatarColor: 'bg-green-500' },
  { id: '3', name: 'Carol Davis', avatarColor: 'bg-purple-500' }
];

const Dashboard: React.FC<DashboardProps> = ({ userData, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(() => {
    const saved = localStorage.getItem(`pimbot_chatHistory_${userData.name}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`pimbot_chatHistory_${userData.name}`, JSON.stringify(chatHistory));
  }, [chatHistory, userData.name]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    
    const userMessage = { role: 'user' as const, content: prompt };
    setChatHistory(prev => [...prev, userMessage]);
    setPrompt('');

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate',
          prompt: prompt,
          userData: userData,
          projects: projects,
          history: chatHistory
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage = { role: 'assistant' as const, content: '' };
      setChatHistory(prev => [...prev, assistantMessage]);

      // Read the streaming response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        setChatHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content += text;
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = useCallback(() => {
    setChatHistory([]);
    localStorage.removeItem(`pimbot_chatHistory_${userData.name}`);
    setCurrentView('chat');
    console.log('Chat cleared');
  }, [userData.name]);

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'home':
        return { title: 'Dashboard Overview', subtitle: 'Welcome back to your project management hub' };
      case 'projectList':
        if (projectFilter && projectFilter !== 'all') {
          const filterTitle = projectFilter.charAt(0).toUpperCase() + projectFilter.slice(1).replace('-', ' ');
          return { title: `${filterTitle} Projects`, subtitle: `Projects filtered by ${filterTitle.toLowerCase()} status` };
        }
        return { title: 'All Projects', subtitle: 'Manage and track your project portfolio' };
      case 'projectDetails':
        return { title: selectedProject?.name || 'Project Details', subtitle: 'Project overview and task management' };
      case 'chat':
        return { title: 'AI Assistant', subtitle: 'Get personalized project management advice' };
      case 'analytics':
        return { title: 'Analytics & Insights', subtitle: 'Project performance and team productivity metrics' };
      case 'teamHub':
        return { title: 'Team Hub', subtitle: 'Collaborate and communicate with your team' };
      default:
        return { title: 'Dashboard', subtitle: 'Project management made intelligent' };
    }
  };

  const SidebarIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="mr-3 flex-shrink-0">{children}</span>
  );

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }) => {
    const handleNavClick = (view: View) => {
      setCurrentView(view);
      setProjectFilter(null); // Clear any filters when switching views
      if (isMobile) setIsSidebarOpen(false);
    };

    return (
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--accent-primary)] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 0v2m0 8v-2m0 2H8m4 0h4m-4 0v2m0-14a2 2 0 100 4 2 2 0 000-4zM4 12a8 8 0 1116 0H4z" />
            </svg>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">PiMbOt AI</h1>
          </div>
          
          <StandaloneSearch 
            projects={projects}
            onProjectClick={(projectId: string) => {
              const project = projects.find(p => p.id === projectId);
              if (project) {
                setSelectedProject(project);
                setCurrentView('projectDetails');
              }
            }}
          />

          <button onClick={clearChat} className="w-full flex items-center justify-center p-3 mb-4 rounded-lg bg-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/80 text-[var(--accent-primary)] font-semibold transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          <nav>
            <ul>
              <li className="mb-2">
                <button onClick={() => handleNavClick('home')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView === 'home' ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                  <SidebarIcon>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </SidebarIcon>
                  Home
                </button>
              </li>
              <li className="mb-2">
                <button onClick={() => handleNavClick('projectList')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView === 'projectList' || currentView === 'projectDetails' ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                  <SidebarIcon>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </SidebarIcon>
                  Projects
                </button>
              </li>
              <li className="mb-2">
                <button onClick={() => handleNavClick('chat')} className={`w-full flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 ${currentView === 'chat' ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                  <SidebarIcon>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </SidebarIcon>
                  Chat with PiMbOt
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        <div>
          {/* Theme Toggle Section */}
          <div className="mb-4 p-3 border-t border-[var(--border-primary)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Appearance</span>
            </div>
            <ThemeToggle />
          </div>
          
          <a href="mailto:feedback-pimbot-mvp@example.com?subject=PiMbOt%20AI%20MVP%20Feedback" target="_blank" rel="noopener noreferrer" className="w-full flex items-center p-3 mb-2 rounded-lg font-semibold hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors duration-200">
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </SidebarIcon>
            Provide Feedback
          </a>
          <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg font-semibold hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors duration-200">
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </SidebarIcon>
            Logout
          </button>
        </div>
      </div>
    );
  };

  const renderViewContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <DailyBriefing userData={userData} />
            <Home 
              projects={projects} 
              userData={userData}
              onSelectProject={(id: string) => {
                const project = projects.find(p => p.id === id);
                if (project) {
                  setSelectedProject(project);
                  setCurrentView('projectDetails');
                }
              }}
              onMenuClick={(filter: string) => {
                if (filter.startsWith('projects-')) {
                  setProjectFilter(filter.replace('projects-', ''));
                  setCurrentView('projectList');
                } else {
                  setCurrentView('projectList');
                }
              }}
            />
          </div>
        );
      case 'projectList':
        return (
          <ProjectList 
            projects={projects} 
            projectFilter={projectFilter}
            onSelectProject={(id: string) => {
              const project = projects.find(p => p.id === id);
              if (project) {
                setSelectedProject(project);
                setCurrentView('projectDetails');
              }
            }}
            onProjectCreated={(projectData: Project) => {
              setProjects(prev => [...prev, projectData]);
            }}
            onClearFilter={() => setProjectFilter(null)}
            onMenuClick={() => setCurrentView('home')}
          />
        );
      case 'projectDetails':
        return selectedProject ? (
          <ProjectDetails 
            project={selectedProject} 
            onUpdateProject={(updatedProject: Project) => {
              setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
              setSelectedProject(updatedProject);
            }}
            onBack={() => setCurrentView('projectList')}
            team={mockTeamMembers}
            userData={userData}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        ) : null;
      case 'chat':
        return (
          <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-[var(--accent-primary)] text-white' 
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                  }`}>
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-3xl p-4 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="border-t border-[var(--border-primary)] pt-4">
              {error && (
                <div className="mb-4 p-3 bg-[var(--error)]/20 border border-[var(--error)] rounded-lg text-[var(--error)]">
                  {error}
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask PiMbOt for project management advice..."
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={!prompt.trim() || isStreaming}
                  className="px-6 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--text-tertiary)] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isStreaming ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        );
      case 'analytics':
        return (
          <Analytics 
            projects={projects}
            onUpdateProject={(updatedProject: Project) => {
              setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            }}
            team={mockTeamMembers}
            onMenuClick={() => setCurrentView('home')}
          />
        );
      case 'teamHub':
        return (
          <TeamHub 
            projects={projects}
            team={mockTeamMembers}
            onSelectProject={(projectId: string) => {
              const project = projects.find(p => p.id === projectId);
              if (project) {
                setSelectedProject(project);
                setCurrentView('projectDetails');
              }
            }}
            onMenuClick={() => setCurrentView('home')}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <aside className="w-64 bg-[var(--bg-secondary)] p-6 border-r border-[var(--border-primary)] hidden md:flex">
        <SidebarContent />
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
              <p className="text-[var(--text-tertiary)] mt-1">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-[var(--text-tertiary)]">Logged in as</p>
                <p className="font-semibold text-[var(--accent-primary)]">{userData.name}</p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--bg-primary)]">
          {renderViewContent()}
        </main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="fixed left-0 top-0 h-full w-64 bg-[var(--bg-secondary)] p-6">
            <SidebarContent isMobile />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;