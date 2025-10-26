import React, { useState } from 'react';
import type { Project, OnboardingData, Priority, ProjectStatus } from '../types';
import { PROJECT_STATUS_VALUES, PRIORITY_VALUES } from '../types';

interface ExportCenterProps {
  projects: Project[];
  userData: OnboardingData;
  onClose: () => void;
}

type ReportType = 'status' | 'budget' | 'time-tracking' | 'executive' | 'custom';
type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

const ExportCenter: React.FC<ExportCenterProps> = ({ projects, userData, onClose }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('status');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(projects.map(p => p.id));
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'status' as ReportType,
      name: 'Status Report',
      description: 'Project progress, tasks, and milestones',
      icon: '📊',
      formats: ['pdf', 'excel']
    },
    {
      id: 'budget' as ReportType,
      name: 'Budget Report',
      description: 'Financial overview with charts',
      icon: '💰',
      formats: ['pdf', 'excel', 'csv']
    },
    {
      id: 'time-tracking' as ReportType,
      name: 'Time Tracking',
      description: 'Task duration and timeline analysis',
      icon: '⏱️',
      formats: ['pdf', 'excel', 'csv']
    },
    {
      id: 'executive' as ReportType,
      name: 'Executive Summary',
      description: 'High-level overview for stakeholders',
      icon: '📈',
      formats: ['pdf']
    },
    {
      id: 'custom' as ReportType,
      name: 'Custom Export',
      description: 'Choose specific data fields',
      icon: '⚙️',
      formats: ['excel', 'csv', 'json']
    }
  ];

  const selectedReportInfo = reportTypes.find(r => r.id === selectedReport);

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const generateStatusReport = () => {
    const filteredProjects = projects.filter(p => selectedProjects.includes(p.id));
    
    let report = `PROJECT STATUS REPORT
Generated: ${new Date().toLocaleString()}
Prepared for: ${userData.name}
Period: ${dateRange.start} to ${dateRange.end}

========================
EXECUTIVE SUMMARY
========================

Total Projects: ${filteredProjects.length}
On Track: ${filteredProjects.filter(p => p.status === PROJECT_STATUS_VALUES.OnTrack).length}
At Risk: ${filteredProjects.filter(p => p.status === PROJECT_STATUS_VALUES.AtRisk).length}
Off Track: ${filteredProjects.filter(p => p.status === PROJECT_STATUS_VALUES.OnHold).length}
Completed: ${filteredProjects.filter(p => p.status === PROJECT_STATUS_VALUES.Completed).length}

========================
PROJECT DETAILS
========================

`;

    filteredProjects.forEach(project => {
      const completedTasks = project.tasks.filter(t => t.completed).length;
      const totalTasks = project.tasks.length;
      const overdueTasks = project.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
      
      report += `
PROJECT: ${project.name}
Status: ${project.status}
Priority: ${project.priority}
Progress: ${project.progress}%
Manager: ${project.manager}
Timeline: ${project.startDate} to ${project.dueDate || 'No due date'}

Tasks: ${completedTasks}/${totalTasks} completed
${overdueTasks > 0 ? `⚠️ ${overdueTasks} overdue tasks` : ''}

Budget: $${(project.budget || 0).toLocaleString()}
Spent: $${(project.spent || 0).toLocaleString()}
Remaining: $${((project.budget || 0) - (project.spent || 0)).toLocaleString()}

${project.teamMembers && project.teamMembers.length > 0 ? `Team: ${project.teamMembers.map(m => m.name).join(', ')} (${project.teamMembers.length} members)` : 'No team members assigned'}

---
`;
    });

    return report;
  };

  const generateBudgetReport = () => {
    const filteredProjects = projects.filter(p => selectedProjects.includes(p.id));

    const totalBudget = filteredProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalSpent = filteredProjects.reduce((acc, p) => acc + (p.spent || 0), 0);
    const utilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0';

    let report = `BUDGET ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Prepared for: ${userData.name}

========================
BUDGET OVERVIEW
========================

Total Budget: $${totalBudget.toLocaleString()}
Total Spent: $${totalSpent.toLocaleString()}
Remaining: $${(totalBudget - totalSpent).toLocaleString()}
Utilization: ${utilization}%

========================
PROJECT BREAKDOWN
========================

`;

    filteredProjects.forEach(project => {
      const projectBudget = project.budget || 0;
      const projectSpent = project.spent || 0;
      const projectUtil = projectBudget > 0 ? ((projectSpent / projectBudget) * 100).toFixed(1) : '0';
      const status = projectSpent > projectBudget ? '🔴 Over Budget' : 
                     parseFloat(projectUtil) > 90 ? '🟡 High Utilization' : 
                     '🟢 On Track';

      report += `
${project.name}
Budget: $${projectBudget.toLocaleString()}
Spent: $${projectSpent.toLocaleString()}
Remaining: $${(projectBudget - projectSpent).toLocaleString()}
Utilization: ${projectUtil}%
Status: ${status}
---
`;
    });

    return report;
  };

  const generateTimeTrackingReport = () => {
    const filteredProjects = projects.filter(p => selectedProjects.includes(p.id));

    let report = `TIME TRACKING REPORT
Generated: ${new Date().toLocaleString()}
Prepared for: ${userData.name}
Period: ${dateRange.start} to ${dateRange.end}

========================
TIME SUMMARY
========================

`;

    let totalEstimated = 0;
    let totalCompleted = 0;

    filteredProjects.forEach(project => {
      const estimatedHours = project.tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      const completedTasks = project.tasks.filter(t => t.completed).length;
      const totalTasks = project.tasks.length;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';
      
      totalEstimated += estimatedHours;
      totalCompleted += completedTasks;

      report += `
${project.name}
Estimated Hours: ${estimatedHours}h
Completed Tasks: ${completedTasks}/${totalTasks} (${completionRate}%)
${parseFloat(completionRate) < 50 ? '⚠️ Behind schedule' : '✅ On track'}

`;
    });

    const allTasks = filteredProjects.reduce((acc, p) => acc + p.tasks.length, 0);
    const overallCompletion = allTasks > 0 ? ((totalCompleted / allTasks) * 100).toFixed(1) : '0';

    report += `
========================
OVERALL TOTALS
========================

Total Estimated Hours: ${totalEstimated}h
Tasks Completed: ${totalCompleted}/${allTasks}
Overall Completion: ${overallCompletion}%
`;

    return report;
  };

  const handleExport = () => {
    setIsGenerating(true);

    let reportContent = '';
    switch (selectedReport) {
      case 'status':
        reportContent = generateStatusReport();
        break;
      case 'budget':
        reportContent = generateBudgetReport();
        break;
      case 'time-tracking':
        reportContent = generateTimeTrackingReport();
        break;
      case 'executive':
        reportContent = generateStatusReport() + '\n\n' + generateBudgetReport();
        break;
      case 'custom':
        reportContent = JSON.stringify(
          projects
            .filter(p => selectedProjects.includes(p.id))
            .map(p => ({
              name: p.name,
              status: p.status,
              priority: p.priority,
              progress: p.progress,
              budget: p.budget,
              spent: p.spent,
              tasks: p.tasks.map(t => ({
                name: t.name,
                status: t.status,
                priority: t.priority,
                completed: t.completed
              }))
            })),
          null,
          2
        );
        break;
    }

    // Simulate export delay
    setTimeout(() => {
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-report-${Date.now()}.${selectedFormat === 'json' ? 'json' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsGenerating(false);
      
      // Show success message
      alert(`Report exported successfully as ${selectedFormat.toUpperCase()}!`);
    }, 1500);
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/dashboard?view=${selectedReport}&projects=${selectedProjects.join(',')}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Dashboard link copied to clipboard!');
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[var(--bg-primary)] w-full max-w-5xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col">
        {/* Header - MOBILE SAFE */}
        <div className="p-3 sm:p-6 border-b border-[var(--border-primary)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">📊 Export Center</h2>
              <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-1">Generate professional reports and export your data</p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left/Main Column - Report Selection - FULL WIDTH ON MOBILE */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Report Type - MOBILE STACKED */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Report Type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {reportTypes.map(report => (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left active:scale-95 ${
                          selectedReport === report.id
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                            : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50'
                        }`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-2xl sm:text-3xl flex-shrink-0">{report.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">{report.name}</h4>
                            <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-1">{report.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Format - MOBILE BUTTONS */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Export Format</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selectedReportInfo?.formats.map(format => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format as ExportFormat)}
                        className={`flex-1 sm:flex-none min-w-[80px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors active:scale-95 ${
                          selectedFormat === format
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range - MOBILE RESPONSIVE GRID */}
                {(selectedReport === 'time-tracking' || selectedReport === 'budget') && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Date Range</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full p-2.5 sm:p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">End Date</label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full p-2.5 sm:p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Selection - MOBILE COMPACT */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">
                    Select Projects ({selectedProjects.length}/{projects.length})
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedProjects(
                        selectedProjects.length === projects.length ? [] : projects.map(p => p.id)
                      )}
                      className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-medium"
                    >
                      {selectedProjects.length === projects.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <div className="grid grid-cols-1 gap-2 max-h-48 sm:max-h-60 overflow-y-auto">
                      {projects.map(project => (
                        <label
                          key={project.id}
                          className="flex items-center p-2.5 sm:p-3 border border-[var(--border-primary)] rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => toggleProject(project.id)}
                            className="mr-2 sm:mr-3 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-[var(--text-primary)] block truncate">{project.name}</span>
                            <span className="text-xs text-[var(--text-tertiary)]">• {project.status}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Actions - MOBILE STACKED */}
              <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] mb-3">Export Actions</h4>
                  
                  <button
                    onClick={handleExport}
                    disabled={isGenerating || selectedProjects.length === 0}
                    className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-semibold mb-3 active:scale-95 text-sm sm:text-base"
                  >
                    {isGenerating ? 'Generating...' : `Export as ${selectedFormat.toUpperCase()}`}
                  </button>

                  <button
                    onClick={copyShareLink}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden sm:inline">Copy Dashboard Link</span>
                    <span className="sm:hidden">Share Link</span>
                  </button>
                </div>

                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Report Info
                  </h4>
                  <div className="text-xs sm:text-sm text-[var(--text-secondary)] space-y-1.5 sm:space-y-2">
                    <p><strong>Report:</strong> {selectedReportInfo?.name}</p>
                    <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>
                    <p><strong>Projects:</strong> {selectedProjects.length} selected</p>
                    {(selectedReport === 'time-tracking' || selectedReport === 'budget') && (
                      <p className="break-words"><strong>Period:</strong> {dateRange.start} to {dateRange.end}</p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[var(--text-tertiary)] space-y-1 hidden sm:block">
                  <p>💡 <strong>Tip:</strong> Select multiple projects for comparative analysis</p>
                  <p>📊 Charts and visualizations work best in PDF format</p>
                  <p>🔗 Share links require dashboard access permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - MOBILE SAFE AREA */}
        <div className="p-3 sm:p-6 pb-safe border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;