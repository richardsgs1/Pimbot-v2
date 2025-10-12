import React, { useState } from 'react';
import type { Project, OnboardingData } from '../types';
import { ProjectStatus, Priority } from '../types';

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
On Track: ${filteredProjects.filter(p => p.status === ProjectStatus.OnTrack).length}
At Risk: ${filteredProjects.filter(p => p.status === ProjectStatus.AtRisk).length}
Off Track: ${filteredProjects.filter(p => p.status === ProjectStatus.OffTrack).length}
Completed: ${filteredProjects.filter(p => p.status === ProjectStatus.Completed).length}

========================
PROJECT DETAILS
========================

`;

    filteredProjects.forEach(project => {
      const completedTasks = project.tasks.filter(t => t.completed).length;
      const totalTasks = project.tasks.length;
      const overdueTasks = project.tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
      
      report += `
PROJECT: ${project.name}
Status: ${project.status}
Priority: ${project.priority}
Progress: ${project.progress}%
Manager: ${project.manager}
Timeline: ${project.startDate} to ${project.dueDate}

Tasks: ${completedTasks}/${totalTasks} completed
${overdueTasks > 0 ? `⚠️ ${overdueTasks} overdue tasks` : ''}

Budget: $${(project.budget || 0).toLocaleString()}
Spent: $${(project.spent || 0).toLocaleString()}
Remaining: $${((project.budget || 0) - (project.spent || 0)).toLocaleString()}

Team Size: ${project.teamSize}
${project.teamMembers && project.teamMembers.length > 0 ? `Team: ${project.teamMembers.map(m => m.name).join(', ')}` : ''}

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
Period: ${dateRange.start} to ${dateRange.end}

========================
SUMMARY
========================

Total Projects: ${filteredProjects.length}
Total Tasks: ${filteredProjects.reduce((acc, p) => acc + p.tasks.length, 0)}
Completed Tasks: ${filteredProjects.reduce((acc, p) => acc + p.tasks.filter(t => t.completed).length, 0)}

========================
PROJECT TIMELINES
========================

`;

    filteredProjects.forEach(project => {
      const totalDuration = project.tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
      const completedDuration = project.tasks
        .filter(t => t.completed)
        .reduce((acc, t) => acc + (t.duration || 0), 0);

      report += `
${project.name}
Timeline: ${project.startDate} to ${project.dueDate}
Estimated Duration: ${totalDuration} days
Completed: ${completedDuration} days
Progress: ${project.progress}%

Tasks:
${project.tasks.map(t => `  - ${t.name}: ${t.duration || 0} days ${t.completed ? '✓' : '○'}`).join('\n')}

---
`;
    });

    return report;
  };

  const generateExecutiveSummary = () => {
    const filteredProjects = projects.filter(p => selectedProjects.includes(p.id));
    
    const critical = filteredProjects.filter(p => p.priority === Priority.Critical || p.status === ProjectStatus.OffTrack);
    const onTrack = filteredProjects.filter(p => p.status === ProjectStatus.OnTrack);
    const totalBudget = filteredProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalSpent = filteredProjects.reduce((acc, p) => acc + (p.spent || 0), 0);

    return `EXECUTIVE SUMMARY
${new Date().toLocaleDateString()}

TO: Stakeholders
FROM: ${userData.name}
RE: Project Portfolio Status

========================
KEY HIGHLIGHTS
========================

✓ ${onTrack.length} of ${filteredProjects.length} projects on track
${critical.length > 0 ? `⚠️ ${critical.length} projects require immediate attention` : ''}

Budget Performance: ${((totalSpent / totalBudget) * 100).toFixed(1)}% utilized
Portfolio Health: ${onTrack.length / filteredProjects.length >= 0.7 ? 'Strong' : 'Needs Attention'}

========================
CRITICAL ITEMS
========================

${critical.length > 0 ? critical.map(p => `• ${p.name} - ${p.status}`).join('\n') : 'No critical items'}

========================
NEXT STEPS
========================

${critical.length > 0 
  ? '• Address at-risk and off-track projects\n• Review resource allocation\n• Update stakeholders on mitigation plans'
  : '• Continue monitoring project progress\n• Plan for upcoming milestones\n• Maintain current trajectory'}
`;
  };

  const handleExport = async () => {
    setIsGenerating(true);

    try {
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
          reportContent = generateExecutiveSummary();
          break;
        case 'custom':
          reportContent = JSON.stringify(projects.filter(p => selectedProjects.includes(p.id)), null, 2);
          break;
      }

      // Create download based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedReport}-report-${timestamp}`;

      if (selectedFormat === 'json') {
        downloadFile(reportContent, `${filename}.json`, 'application/json');
      } else if (selectedFormat === 'csv') {
        const csvContent = convertToCSV(reportContent);
        downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      } else {
        // For PDF and Excel, download as text for now
        downloadFile(reportContent, `${filename}.txt`, 'text/plain');
      }

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (content: string) => {
    // Simple CSV conversion - can be enhanced
    return content.replace(/\n/g, '\r\n');
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#dashboard`;
    navigator.clipboard.writeText(link);
    alert('Dashboard link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Export & Reporting</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Generate and export project reports
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Report Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Types */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Select Report Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map(report => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report.id);
                        setSelectedFormat(report.formats[0] as ExportFormat);
                      }}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedReport === report.id
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{report.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[var(--text-primary)]">{report.name}</h4>
                          <p className="text-sm text-[var(--text-tertiary)] mt-1">{report.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Format */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Export Format</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedReportInfo?.formats.map(format => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format as ExportFormat)}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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

              {/* Date Range */}
              {(selectedReport === 'time-tracking' || selectedReport === 'budget') && (
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Date Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Start Date</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">End Date</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full p-2 border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Project Selection */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Select Projects ({selectedProjects.length}/{projects.length})
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedProjects(
                      selectedProjects.length === projects.length ? [] : projects.map(p => p.id)
                    )}
                    className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
                  >
                    {selectedProjects.length === projects.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {projects.map(project => (
                      <label
                        key={project.id}
                        className="flex items-center p-3 border border-[var(--border-primary)] rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={() => toggleProject(project.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-[var(--text-primary)]">{project.name}</span>
                          <span className="text-sm text-[var(--text-tertiary)] ml-2">• {project.status}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-4">
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                <h4 className="font-semibold text-[var(--text-primary)] mb-3">Export Actions</h4>
                
                <button
                  onClick={handleExport}
                  disabled={isGenerating || selectedProjects.length === 0}
                  className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-semibold mb-3"
                >
                  {isGenerating ? 'Generating...' : `Export as ${selectedFormat.toUpperCase()}`}
                </button>

                <button
                  onClick={copyShareLink}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Copy Dashboard Link
                </button>
              </div>

              <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg p-4">
                <h4 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Report Info
                </h4>
                <div className="text-sm text-[var(--text-secondary)] space-y-2">
                  <p><strong>Report:</strong> {selectedReportInfo?.name}</p>
                  <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>
                  <p><strong>Projects:</strong> {selectedProjects.length} selected</p>
                  {(selectedReport === 'time-tracking' || selectedReport === 'budget') && (
                    <p><strong>Period:</strong> {dateRange.start} to {dateRange.end}</p>
                  )}
                </div>
              </div>

              <div className="text-xs text-[var(--text-tertiary)] space-y-1">
                <p>💡 <strong>Tip:</strong> Select multiple projects for comparative analysis</p>
                <p>📊 Charts and visualizations work best in PDF format</p>
                <p>🔗 Share links require dashboard access permissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;