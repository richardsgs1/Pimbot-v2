import React, { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import type { OnboardingData, Project, TeamMember } from '../types';
import { ProjectStatus, Priority } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import Home from './Home';
import ProjectList from './ProjectList';
import Chat from './Chat';
import DailyBriefing from './DailyBriefing';
import TimelineView from './TimelineView';
import ThemeToggle from './ThemeToggle';
import TaskSuggestions from './TaskSuggestions';

type View = 'home' | 'projectList' | 'projectDetails' | 'chat' | 'timeline';

interface DashboardProps {
  userData: OnboardingData;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      status: ProjectStatus.OnTrack,
      progress: 65,
      startDate: '2024-01-15',
      endDate: '2024-03-30',
      dueDate: '2024-03-30',
      priority: Priority.High,
      manager: 'Sarah Johnson',
      teamSize: 5,
      tasks: [
        {
          id: '1',
          name: 'Design wireframes',
          completed: true,
          priority: Priority.High,
          dueDate: '2024-02-01',
          startDate: '2024-01-15',
          duration: 14
        },
        {
          id: '2',
          name: 'Develop frontend',
          completed: false,
          priority: Priority.High,
          dueDate: '2024-03-15',
          startDate: '2024-02-01',
          duration: 42
        }
      ],
      budget: 50000,
      spent: 32500,
      teamMembers: [
        {
          id: '1',
          name: 'Sarah Johnson',
          role: 'Project Manager',
          email: 'sarah@company.com',
          avatarColor: '#3B82F6'
        },
        {
          id: '2',
          name: 'Mike Chen',
          role: 'Developer',
          email: 'mike@company.com',
          avatarColor: '#10B981'
        }
      ],
      journal: [
        {
          id: '1',
          date: '2024-01-20',
          content: 'Project kickoff meeting completed. All stakeholders aligned on objectives.',
          author: 'Sarah Johnson'
        }
      ]
    },
    {
      id: '2',
      name: 'Mobile App Development',
      description: 'Native iOS and Android applications',
      status: ProjectStatus.AtRisk,
      progress: 35,
      startDate: '2024-02-01',
      endDate: '2024-06-15',
      dueDate: '2024-06-15',
      priority: Priority.Medium,
      manager: 'Mike Chen',
      teamSize: 8,
      tasks: [
        {
          id: '3',
          name: 'UI/UX Design',
          completed: true,
          priority: Priority.Medium,
          dueDate: '2024-02-28',
          startDate: '2024-02-01',
          duration: 21
        },
        {
          id: '4',
          name: 'Backend API',
          completed: false,
          priority: Priority.High,
          dueDate: '2024-04-30',
          startDate: '2024-03-01',
          duration: 60
        }
      ],
      budget: 120000,
      spent: 42000,
      teamMembers: [
        {
          id: '3',
          name: 'Mike Chen',
          role: 'Lead Developer',
          email: 'mike@company.com',
          avatarColor: '#8B5CF6'
        },
        {
          id: '4',
          name: 'Lisa Wong',
          role: 'UI Designer',
          email: 'lisa@company.com',
          avatarColor: '#F59E0B'
        }
      ],
      journal: [
        {
          id: '2',
          date: '2024-02-05',
          content: 'Development phase initiated. Backend API structure defined.',
          author: 'Mike Chen'
        }
      ]
    }
  ]);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setProjectFilter(null);
    setShowSidebar(false);
    
    // Update browser history
    window.history.pushState({ view }, '', `#${view}`);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setCurrentView(event.state.view);
        setProjectFilter(null);
      }
    };

    // Set initial URL
    window.history.replaceState({ view: currentView }, '', `#${currentView}`);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history when view changes programmatically
  useEffect(() => {
    window.history.replaceState({ view: currentView }, '', `#${currentView}`);
  }, [currentView]);

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'home':
        return { title: 'Dashboard', subtitle: 'Welcome back to PiMbOt AI' };
      case 'projectList':
        if (projectFilter && projectFilter !== 'all') {
          return { 
            title: `${projectFilter.charAt(0).toUpperCase() + projectFilter.slice(1).replace('-', ' ')} Projects`,
            subtitle: 'Filtered project view'
          };
        }
        return { title: 'Projects', subtitle: 'Manage your projects' };
      case 'projectDetails':
        return { 
          title: selectedProject?.name || 'Project Details',
          subtitle: 'Project management and tracking'
        };
      case 'chat':
        return { title: 'AI Assistant', subtitle: 'Get help with your projects' };
      case 'timeline':
        return { title: 'Timeline', subtitle: 'Project schedules and dependencies' };
      default:
        return { title: 'Dashboard', subtitle: 'PiMbOt AI' };
    }
  };

  const renderViewContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <DailyBriefing userData={userData} projects={projects} />
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
            onMenuClick={() => setShowSidebar(true)}
            onProjectCreated={(newProject: Project) => {
              setProjects(prev => [...prev, newProject]);
            }}
            onClearFilter={() => setProjectFilter(null)}
          />
        );

      case 'projectDetails':
        return selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setCurrentView('projectList');
                    setSelectedProject(null);
                  }}
                  className="mr-4 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">{selectedProject.name}</h1>
                  <p className="text-[var(--text-tertiary)]">{selectedProject.description}</p>
                </div>
              </div>
            </div>
            
            {/* Project Details Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Project Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        selectedProject.status === ProjectStatus.OnTrack ? 'bg-green-100 text-green-800' :
                        selectedProject.status === ProjectStatus.AtRisk ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedProject.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Progress</p>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">{selectedProject.progress}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Due Date</p>
                      <p className="text-[var(--text-primary)]">{new Date(selectedProject.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Manager</p>
                      <p className="text-[var(--text-primary)]">{selectedProject.manager}</p>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Tasks</h3>
                  <div className="space-y-3">
                    {selectedProject.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            className="mr-3"
                            readOnly
                          />
                          <div>
                            <p className={`font-medium ${task.completed ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                              {task.name}
                            </p>
                            <p className="text-sm text-[var(--text-tertiary)]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === Priority.High ? 'bg-red-100 text-red-800' :
                          task.priority === Priority.Medium ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Suggestions */}
                <TaskSuggestions
                  userData={userData}
                  project={selectedProject}
                  onTaskAdd={(newTask) => {
                    const updatedProject = {
                      ...selectedProject,
                      tasks: [
                        ...selectedProject.tasks,
                        {
                          ...newTask,
                          id: Date.now().toString()
                        }
                      ]
                    };
                    setProjects(prev => 
                      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
                    );
                    setSelectedProject(updatedProject);
                  }}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Budget</h3>
                  {selectedProject.budget && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-tertiary)]">Budget</span>
                        <span className="text-[var(--text-primary)]">${selectedProject.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-tertiary)]">Spent</span>
                        <span className="text-[var(--text-primary)]">${(selectedProject.spent || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-[var(--text-secondary)]">Remaining</span>
                        <span className="text-[var(--text-primary)]">${(selectedProject.budget - (selectedProject.spent || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Team</h3>
                  <div className="space-y-2">
                    <p className="text-[var(--text-tertiary)]">Team Size: {selectedProject.teamSize}</p>
                    <p className="text-[var(--text-tertiary)]">Manager: {selectedProject.manager}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                No Project Selected
              </h3>
              <p className="text-[var(--text-tertiary)]">
                Please select a project to view details
              </p>
              <button
                onClick={() => setCurrentView('projectList')}
                className="mt-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View All Projects
              </button>
            </div>
          </div>
        );

      case 'chat':
        return (
          <Chat
            userData={userData}
            projects={projects}
            onMenuClick={() => setShowSidebar(true)}
          />
        );

      case 'timeline':
        return (
          <TimelineView 
            projects={projects} 
            selectedProjectId={selectedProject?.id} 
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                View Not Found
              </h3>
              <p className="text-[var(--text-tertiary)]">
                The requested view could not be found
              </p>
              <button
                onClick={() => setCurrentView('home')}
                className="mt-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        );
    }
  };

  const SidebarIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mr-3 flex-shrink-0">
      {children}
    </div>
  );

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`p-6 border-b border-[var(--border-primary)] ${sidebarMinimized ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          {!sidebarMinimized && (
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">PiMbOt AI</h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">Project Intelligence</p>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarMinimized ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button 
              onClick={() => handleNavClick('home')} 
              className={`w-full flex items-center ${sidebarMinimized ? 'justify-center' : ''} p-3 rounded-lg font-semibold transition-colors duration-200 ${
                currentView === 'home' 
                  ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' 
                  : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}
              title={sidebarMinimized ? "Home" : ""}
            >
              <SidebarIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </SidebarIcon>
              {!sidebarMinimized && "Home"}
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick('projectList')} 
              className={`w-full flex items-center ${sidebarMinimized ? 'justify-center' : ''} p-3 rounded-lg font-semibold transition-colors duration-200 ${
                currentView === 'projectList' 
                  ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' 
                  : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}
              title={sidebarMinimized ? "Projects" : ""}
            >
              <SidebarIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </SidebarIcon>
              {!sidebarMinimized && "Projects"}
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick('timeline')} 
              className={`w-full flex items-center ${sidebarMinimized ? 'justify-center' : ''} p-3 rounded-lg font-semibold transition-colors duration-200 ${
                currentView === 'timeline' 
                  ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' 
                  : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}
              title={sidebarMinimized ? "Timeline" : ""}
            >
              <SidebarIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </SidebarIcon>
              {!sidebarMinimized && "Timeline"}
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick('chat')} 
              className={`w-full flex items-center ${sidebarMinimized ? 'justify-center' : ''} p-3 rounded-lg font-semibold transition-colors duration-200 ${
                currentView === 'chat' 
                  ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)]' 
                  : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}
              title={sidebarMinimized ? "AI Assistant" : ""}
            >
              <SidebarIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </SidebarIcon>
              {!sidebarMinimized && "AI Assistant"}
            </button>
          </li>
        </ul>

        <div className={`mt-8 pt-4 border-t border-[var(--border-primary)] ${sidebarMinimized ? 'text-center' : ''}`}>
          <div className="mb-4">
            {!sidebarMinimized && <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Appearance</h3>}
            <div className={sidebarMinimized ? 'flex justify-center' : ''}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className={`p-4 border-t border-[var(--border-primary)] ${sidebarMinimized ? 'px-2' : ''}`}>
        <div className={`flex items-center mb-3 ${sidebarMinimized ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-bold text-white">
              {userData.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {!sidebarMinimized && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {userData.name}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                {userData.skillLevel}
              </p>
            </div>
          )}
        </div>
        <button 
          onClick={onLogout}
          className={`w-full bg-[var(--bg-tertiary)] hover:bg-red-600/20 text-[var(--text-tertiary)] hover:text-red-400 font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
            sidebarMinimized ? 'text-xs' : ''
          }`}
          title={sidebarMinimized ? "Sign Out" : ""}
        >
          {sidebarMinimized ? "Out" : "Sign Out"}
        </button>
      </div>
    </div>
  );

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <div className={`hidden md:block ${sidebarMinimized ? 'w-16' : 'w-64'} bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-300`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]">
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden mr-4 p-1 rounded-full hover:bg-[var(--bg-tertiary)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
                <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;