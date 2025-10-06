import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Project = {
  id: string;
  name: string;
  description: string;
  client: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  teamMembers: TeamMember[];
  archived: boolean;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
};

type TimeEntry = {
  id: string;
  taskId: string;
  userName: string;
  hours: number;
  date: string;
  notes: string;
  createdAt: string;
};

interface ProjectAnalyticsProps {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  onBack: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  projects,
  tasks,
  timeEntries,
  onBack,
}) => {
  // Calculate metrics
  const activeProjects = projects.filter(p => !p.archived);
  const totalBudget = activeProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);

  // Project status distribution
  const statusData = [
    { name: 'Planning', value: activeProjects.filter(p => p.status === 'planning').length },
    { name: 'Active', value: activeProjects.filter(p => p.status === 'active').length },
    { name: 'On Hold', value: activeProjects.filter(p => p.status === 'on-hold').length },
    { name: 'Completed', value: activeProjects.filter(p => p.status === 'completed').length },
  ].filter(d => d.value > 0);

  // Hours by project
  const projectHoursData = activeProjects.map(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    return {
      name: project.name,
      estimated: projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      actual: projectTasks.reduce((sum, t) => sum + t.actualHours, 0),
    };
  });

  // Team workload
  const teamWorkload: Record<string, number> = {};
  timeEntries.forEach(entry => {
    teamWorkload[entry.userName] = (teamWorkload[entry.userName] || 0) + entry.hours;
  });
  const teamWorkloadData = Object.entries(teamWorkload).map(([name, hours]) => ({
    name,
    hours,
  }));

  // Budget utilization (simple estimation based on hours)
  const budgetData = activeProjects.map(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const actualHours = projectTasks.reduce((sum, t) => sum + t.actualHours, 0);
    const estimatedCost = actualHours * 100; // Assume $100/hour rate
    const utilization = project.budget > 0 ? (estimatedCost / project.budget) * 100 : 0;
    
    return {
      name: project.name,
      budget: project.budget,
      spent: estimatedCost,
      utilization: Math.min(utilization, 100),
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics & Reporting</h1>
            <p className="text-[var(--text-tertiary)]">Project insights and team performance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <p className="text-[var(--text-tertiary)] text-sm mb-1">Active Projects</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{activeProjects.length}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <p className="text-[var(--text-tertiary)] text-sm mb-1">Total Budget</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <p className="text-[var(--text-tertiary)] text-sm mb-1">Estimated Hours</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalEstimatedHours}h</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <p className="text-[var(--text-tertiary)] text-sm mb-1">Actual Hours</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalActualHours}h</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {totalEstimatedHours > 0 ? `${((totalActualHours / totalEstimatedHours) * 100).toFixed(1)}% of estimate` : 'No estimate'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Team Workload */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Team Workload (Hours Logged)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamWorkloadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estimated vs Actual Hours by Project */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Estimated vs Actual Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="estimated" fill="#0088FE" name="Estimated" />
              <Bar dataKey="actual" fill="#FF8042" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Utilization */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Budget Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#8884D8" name="Budget" />
              <Bar dataKey="spent" fill="#82ca9d" name="Spent (Est.)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;