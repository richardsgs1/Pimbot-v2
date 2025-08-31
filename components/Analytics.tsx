import React, { useEffect, useRef, useMemo, useState } from 'react';
import type { Project } from '../types';
import { Priority, ProjectStatus } from '../types';

// Declare Chart.js for TypeScript
declare global {
  interface Window {
    Chart: any;
  }
}

interface AnalyticsProps {
  projects: Project[];
  onUpdateProject: (updatedProject: Project) => void;
}

// Helper function to get the week number for a date
const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// --- Chart Components ---

interface BarChartProps {
  data: { labels: string[]; values: number[] };
  title: string;
}

const VelocityChart: React.FC<BarChartProps> = ({ data, title }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && window.Chart) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: [{
              label: 'Tasks Completed',
              data: data.values,
              backgroundColor: 'rgba(34, 211, 238, 0.6)', // cyan-400 with opacity
              borderColor: 'rgba(34, 211, 238, 1)',
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: title, color: '#cbd5e1', font: { size: 16 } }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8', stepSize: 1 },
                grid: { color: 'rgba(71, 85, 105, 0.5)' }
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false }
              }
            }
          }
        });
      }
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title]);

  return <canvas ref={chartRef}></canvas>;
};

interface DonutChartProps {
  data: { labels: string[]; values: number[] };
  title: string;
}

const PriorityChart: React.FC<DonutChartProps> = ({ data, title }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && window.Chart) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: data.labels,
            datasets: [{
              data: data.values,
              backgroundColor: [
                'rgba(239, 68, 68, 0.7)', // red-500
                'rgba(245, 158, 11, 0.7)', // amber-500
                'rgba(59, 130, 246, 0.7)', // blue-500
                'rgba(100, 116, 139, 0.7)', // slate-500
              ],
              borderColor: '#1e293b', // slate-800
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#cbd5e1' }
              },
              title: {
                display: true,
                text: title,
                color: '#cbd5e1',
                font: { size: 16 }
              }
            }
          }
        });
      }
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, title]);

  return <canvas ref={chartRef}></canvas>;
};


// --- Main Analytics Component ---

const Analytics: React.FC<AnalyticsProps> = ({ projects, onUpdateProject }) => {
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const velocityData = useMemo(() => {
    const tasksCompletedByWeek: { [week: string]: number } = {};
    const today = new Date();
    
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.completed && task.dueDate) {
          const dueDate = new Date(task.dueDate + 'T00:00:00');
          
          if ((!start || dueDate >= start) && (!end || dueDate <= end) && dueDate <= today) {
            const taskYear = dueDate.getFullYear();
            const taskWeek = getWeek(dueDate);
            const weekKey = `${taskYear}-W${taskWeek.toString().padStart(2, '0')}`;
            tasksCompletedByWeek[weekKey] = (tasksCompletedByWeek[weekKey] || 0) + 1;
          }
        }
      });
    });

    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - (i * 7));
        const week = getWeek(date);
        const year = date.getFullYear();
        const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
        labels.push(weekKey);
        values.push(tasksCompletedByWeek[weekKey] || 0);
    }
    
    return { labels, values };
  }, [projects, startDate, endDate]);
  
  const priorityData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0, None: 0 };
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    projects.forEach(project => {
        project.tasks.forEach(task => {
            if(!task.completed) {
                if (start || end) {
                    if (!task.dueDate) return;
                    const dueDate = new Date(task.dueDate + 'T00:00:00');
                    if ((start && dueDate < start) || (end && dueDate > end)) {
                        return;
                    }
                }
                counts[task.priority] = (counts[task.priority] || 0) + 1;
            }
        });
    });
    return {
        labels: Object.values(Priority),
        values: [counts.High, counts.Medium, counts.Low, counts.None]
    };
  }, [projects, startDate, endDate]);
  
  const activeProjects = useMemo(() => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    return projects
      .filter(p => {
          if (p.status === ProjectStatus.Completed) return false;
          if (!start && !end) return true; // No filter, include all active projects
          // If filtering, include project if any of its tasks are within the date range
          return p.tasks.some(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate + 'T00:00:00');
              return (!start || dueDate >= start) && (!end || dueDate <= end);
          });
      })
      .map(p => ({
        ...p,
        overdueTasks: p.tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).length
      }))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [projects, startDate, endDate]);

  const handleGenerateSummary = async (project: Project) => {
    setLoadingSummaryId(project.id);
    setSummaryError(null);
    try {
        const response = await fetch('/api/generate-health-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project }),
        });

        const responseText = await response.text();
        if (!response.ok) {
            let errorMsg = 'Failed to generate summary.';
            try { errorMsg = JSON.parse(responseText).error || errorMsg; } catch (e) { errorMsg = responseText || response.statusText; }
            throw new Error(errorMsg);
        }

        if (!responseText) {
          throw new Error("Received an empty response from the server. The request may have timed out.");
        }
        
        const data = JSON.parse(responseText);
        const updatedProject = { ...project, aiHealthSummary: data.summary };
        onUpdateProject(updatedProject);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error("Summary generation error:", errorMessage);
        setSummaryError(`Failed to generate summary for ${project.name}.`);
    } finally {
        setLoadingSummaryId(null);
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-slate-400">Visual insights into your project performance and workload.</p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-700 text-slate-300 border border-slate-600 text-sm rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    aria-label="Start Date"
                />
                 <span className="text-slate-400">to</span>
                <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-700 text-slate-300 border border-slate-600 text-sm rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    aria-label="End Date"
                />
                <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-3 rounded-md transition"
                >
                    Reset
                </button>
            </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-slate-800 rounded-xl p-4 h-80">
              <VelocityChart data={velocityData} title="Weekly Task Completion Velocity" />
            </div>
            <div className="lg:col-span-2 bg-slate-800 rounded-xl p-4 h-80">
              <PriorityChart data={priorityData} title="Open Task Priority Distribution" />
            </div>
          </div>
          
          {/* Project Health Table */}
          <div className="bg-slate-800 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4 px-6 pt-6">Active Project Health</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-700 text-sm text-slate-400">
                        <tr>
                            <th className="p-3 px-6">Project Name</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Progress</th>
                            <th className="p-3 text-center">Overdue Tasks</th>
                            <th className="p-3 px-6 min-w-[350px]">AI Health Summary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeProjects.map(project => (
                             <tr key={project.id} className="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/30">
                                <td className="p-3 px-6 font-semibold text-white align-top">{project.name}</td>
                                <td className="p-3 align-top">{project.status}</td>
                                <td className="p-3 align-top">
                                    <div className="flex items-center">
                                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs text-slate-400 ml-3">{project.progress}%</span>
                                    </div>
                                </td>
                                <td className={`p-3 text-center font-bold align-top ${project.overdueTasks > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                    {project.overdueTasks}
                                </td>
                                <td className="p-3 px-6 align-top">
                                    {loadingSummaryId === project.id ? (
                                        <div className="flex items-center text-sm text-slate-400">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing...
                                        </div>
                                    ) : project.aiHealthSummary ? (
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap font-light">{project.aiHealthSummary}</p>
                                    ) : (
                                        <button 
                                            onClick={() => handleGenerateSummary(project)}
                                            className="text-sm bg-cyan-600/50 hover:bg-cyan-600/80 text-cyan-200 font-semibold py-1 px-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!!loadingSummaryId}
                                        >
                                            Generate
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {activeProjects.length === 0 && <p className="text-slate-400 text-center py-8">No matching active projects to display for the selected date range.</p>}
                 {summaryError && <p className="text-red-400 text-center text-sm py-4">{summaryError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;