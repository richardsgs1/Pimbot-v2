import React, { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import type { OnboardingData, Project, TeamMember } from '../types';
import { ProjectStatus, Priority } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import ProjectDetails from './ProjectDetails';
import DailyBriefing from './DailyBriefing';
import { useTheme } from './ThemeContext';

// Icon components (replacing lucide-react imports)
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MessageSquareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6"/>
    <path d="M1 12h6m6 0h6"/>
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

type View = 'home' | 'projectList' | 'projectDetails' | 'chat' | 'timeline' | 'account';

interface DashboardProps {
  userData: OnboardingData;
  onSignOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onSignOut }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setCurrentView(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setProjectFilter(null);
    setShowSidebar(false);
    setShowAccountMenu(false);
    
    // Update browser history
    window.history.pushState({ view }, '', `#${view}`);
  };

  const projects: Project[] = [
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
          name: 'Develop homepage',
          completed: false,
          priority: Priority.High,
          dueDate: '2024-02-15',
          startDate: '2024-02-01',
          duration: 10
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
          dueDate: '2024-03-15',
          startDate: '2024-02-15',
          duration: 20
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
  ];

  const filteredProjects = projectFilter
    ? projects.filter(p => p.status === projectFilter)
    : projects;

  const SidebarIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className={`${sidebarMinimized ? 'mx-auto' : 'mr-3'} flex-shrink-0`}>
      {React.cloneElement(children as React.ReactElement, {
        size: sidebarMinimized ? 16 : 20
      })}
    </div>
  );

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`${sidebarMinimized ? 'p-2' : 'p-6'} border-b border-[var(--border-primary)] transition-all duration-300`}>
        <div className="flex items-center justify-between">
          {!sidebarMinimized && (
            <h1 className="text-xl font-bold text-[var(--accent-primary)]">PiMbOt AI</h1>
          )}
          {!isMobile && (
            <button
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
              title={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
            >
              {sidebarMinimized ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => handleNavClick('home')}
          className={`w-full flex items-center ${sidebarMinimized ? 'justify-center p-2' : 'p-3'} rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] ${
            currentView === 'home' ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
          }`}
          title={sidebarMinimized ? "Home" : ""}
        >
          <SidebarIcon><HomeIcon /></SidebarIcon>
          {!sidebarMinimized && <span className={`${sidebarMinimized ? 'text-sm' : ''}`}>Home</span>}
        </button>

        <button
          onClick={() => handleNavClick('projectList')}
          className={`w-full flex items-center ${sidebarMinimized ? 'justify-center p-2' : 'p-3'} rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] ${
            currentView === 'projectList' ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
          }`}
          title={sidebarMinimized ? "All Projects" : ""}
        >
          <SidebarIcon><BriefcaseIcon /></SidebarIcon>
          {!sidebarMinimized && <span className={`${sidebarMinimized ? 'text-sm' : ''}`}>All Projects</span>}
        </button>

        <button
          onClick={() => handleNavClick('timeline')}
          className={`w-full flex items-center ${sidebarMinimized ? 'justify-center p-2' : 'p-3'} rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] ${
            currentView === 'timeline' ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
          }`}
          title={sidebarMinimized ? "Timeline" : ""}
        >
          <SidebarIcon><CalendarIcon /></SidebarIcon>
          {!sidebarMinimized && <span className={`${sidebarMinimized ? 'text-sm' : ''}`}>Timeline</span>}
        </button>

        <button
          onClick={() => handleNavClick('chat')}
          className={`w-full flex items-center ${sidebarMinimized ? 'justify-center p-2' : 'p-3'} rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] ${
            currentView === 'chat' ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
          }`}
          title={sidebarMinimized ? "AI Assistant" : ""}
        >
          <SidebarIcon><MessageSquareIcon /></SidebarIcon>
          {!sidebarMinimized && <span className={`${sidebarMinimized ? 'text-sm' : ''}`}>AI Assistant</span>}
        </button>
      </nav>

      <div className={`p-4 border-t border-[var(--border-primary)] space-y-3`}>
        <button
          onClick={toggleTheme}
          className={`w-full ${sidebarMinimized ? 'p-2 justify-center' : 'p-3'} flex items-center bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors`}
          title={sidebarMinimized ? `Switch to ${theme === 'light' ? 'dark' : 'light'} mode` : ""}
        >
          {!sidebarMinimized && (
            <span className="text-sm font-medium">
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
          )}
          {sidebarMinimized && (
            <span className="text-sm">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className={`w-full ${sidebarMinimized ? 'p-2 justify-center' : 'p-3'} flex items-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors`}
            title={sidebarMinimized ? userData.name : ""}
          >
            <div className={`${sidebarMinimized ? 'mx-auto' : 'mr-3'} w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-sm font-medium`}>
              {userData.name.charAt(0)}
            </div>
            {!sidebarMinimized && (
              <div className="text-left">
                <div className="text-sm font-medium text-[var(--text-primary)]">{userData.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{userData.skillLevel}</div>
              </div>
            )}
          </button>

          {showAccountMenu && (
            <div className={`absolute ${sidebarMinimized ? 'left-full ml-2' : 'right-0'} bottom-full mb-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg py-2 z-50`}>
              <button
                onClick={() => handleNavClick('account')}
                className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center"
              >
                <SettingsIcon />
                <span className="ml-2">Account Settings</span>
              </button>
              <button
                onClick={onSignOut}
                className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center"
              >
                <LogOutIcon />
                <span className="ml-2">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderViewContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <DailyBriefing userData={userData} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your Projects</h2>
                <button className="flex items-center px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors">
                  <PlusIcon />
                  <span className="ml-2">New Project</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setCurrentView('projectDetails');
                    }}
                    className="bg-slate-800 p-6 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === ProjectStatus.OnTrack
                          ? 'bg-green-100 text-green-800'
                          : project.status === ProjectStatus.AtRisk
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-4">{project.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-sm text-slate-400">
                          <UsersIcon />
                          <span className="ml-1">{project.teamSize}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Due {new Date(project.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'projectList':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">All Projects</h1>
              <button className="flex items-center px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors">
                <PlusIcon />
                <span className="ml-2">New Project</span>
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setProjectFilter(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  projectFilter === null
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setProjectFilter(ProjectStatus.OnTrack)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  projectFilter === ProjectStatus.OnTrack
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                On Track
              </button>
              <button
                onClick={() => setProjectFilter(ProjectStatus.AtRisk)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  projectFilter === ProjectStatus.AtRisk
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                At Risk
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentView('projectDetails');
                  }}
                  className="bg-slate-800 p-6 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === ProjectStatus.OnTrack
                        ? 'bg-green-200 text-green-900'
                        : project.status === ProjectStatus.AtRisk
                        ? 'bg-yellow-200 text-yellow-900'
                        : 'bg-red-200 text-red-900'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-4">{project.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-sm text-slate-400">
                        <UsersIcon />
                        <span className="ml-1">{project.teamSize}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Due {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projectDetails':
        return selectedProject ? (
          <ProjectDetails
            project={selectedProject}
            onBack={() => setCurrentView('projectList')}
            onMenuClick={() => {}} // Dummy function since we don't need menu click in this context
            userData={userData}
          />
        ) : (
          <div>No project selected</div>
        );

      case 'timeline':
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Timeline View</h2>
            <p className="text-[var(--text-secondary)]">Timeline feature coming soon...</p>
          </div>
        );

      case 'chat':
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">AI Assistant</h2>
            <p className="text-[var(--text-secondary)]">Chat feature coming soon...</p>
          </div>
        );

      case 'account':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Account Settings</h1>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Name</label>
                    <input
                      type="text"
                      value={userData.name}
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Experience Level</label>
                    <select
                      value={userData.skillLevel || ''}
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    >
                      <option value="No Experience">No Experience</option>
                      <option value="Novice">Novice</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Experienced">Experienced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Project Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Preferred Methodology</label>
                    <select className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]">
                      <option>Agile</option>
                      <option>Waterfall</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Default Tools</label>
                    <input
                      type="text"
                      placeholder="Jira, Slack, GitHub..."
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">App Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Theme</span>
                    <button
                      onClick={toggleTheme}
                      className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
                    >
                      {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Sidebar</span>
                    <button
                      onClick={() => setSidebarMinimized(!sidebarMinimized)}
                      className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] transition-colors"
                    >
                      {sidebarMinimized ? 'Expand' : 'Minimize'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)]">
                <button
                  onClick={onSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <div className={`hidden md:block ${sidebarMinimized ? 'w-16' : 'w-64'} bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-300`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="w-64 bg-[var(--bg-secondary)] h-full">
            <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
              <h1 className="text-xl font-bold text-[var(--accent-primary)]">PiMbOt AI</h1>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 hover:bg-[var(--bg-tertiary)] rounded"
              >
                <XIcon />
              </button>
            </div>
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] p-4 flex items-center justify-between">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded"
          >
            <MenuIcon />
          </button>
          <h1 className="text-lg font-semibold text-[var(--accent-primary)]">PiMbOt AI</h1>
          <div className="w-10"></div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
