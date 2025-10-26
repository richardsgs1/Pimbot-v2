// TeamViewService.ts
// Team calendar view management

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role?: string;
  department?: string;
}

export interface TeamView {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: Date;
  createdBy: string;
}

export interface TeamCalendarEvent {
  taskId: string;
  assigneeId: string;
  start: Date;
  end: Date;
  title: string;
  color: string;
}

export class TeamViewService {
  private static instance: TeamViewService;
  private readonly STORAGE_KEY = 'taskflow_team_views';
  private readonly MEMBERS_KEY = 'taskflow_team_members';

  private constructor() {
    this.initializeDefaultMembers();
  }

  static getInstance(): TeamViewService {
    if (!TeamViewService.instance) {
      TeamViewService.instance = new TeamViewService();
    }
    return TeamViewService.instance;
  }

  // Initialize default team members
  private initializeDefaultMembers(): void {
    const existing = this.getAllMembers();
    if (existing.length === 0) {
      const defaultMembers: TeamMember[] = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          email: 'alice@company.com',
          color: '#3b82f6',
          role: 'Product Manager',
          department: 'Product'
        },
        {
          id: 'user-2',
          name: 'Bob Smith',
          email: 'bob@company.com',
          color: '#10b981',
          role: 'Developer',
          department: 'Engineering'
        },
        {
          id: 'user-3',
          name: 'Carol Davis',
          email: 'carol@company.com',
          color: '#f59e0b',
          role: 'Designer',
          department: 'Design'
        },
        {
          id: 'user-4',
          name: 'David Wilson',
          email: 'david@company.com',
          color: '#ef4444',
          role: 'QA Engineer',
          department: 'Engineering'
        },
        {
          id: 'user-5',
          name: 'Eve Martinez',
          email: 'eve@company.com',
          color: '#8b5cf6',
          role: 'Marketing Lead',
          department: 'Marketing'
        }
      ];
      this.saveMembers(defaultMembers);
    }
  }

  // Get all team members
  getAllMembers(): TeamMember[] {
    try {
      const stored = localStorage.getItem(this.MEMBERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Save team members
  private saveMembers(members: TeamMember[]): void {
    localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
  }

  // Add a team member
  addMember(member: Omit<TeamMember, 'id'>): TeamMember {
    const members = this.getAllMembers();
    const newMember: TeamMember = {
      ...member,
      id: `user-${Date.now()}`
    };
    members.push(newMember);
    this.saveMembers(members);
    return newMember;
  }

  // Update a team member
  updateMember(id: string, updates: Partial<TeamMember>): TeamMember | null {
    const members = this.getAllMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;

    members[index] = { ...members[index], ...updates };
    this.saveMembers(members);
    return members[index];
  }

  // Delete a team member
  deleteMember(id: string): boolean {
    const members = this.getAllMembers();
    const filtered = members.filter(m => m.id !== id);
    if (filtered.length === members.length) return false;
    
    this.saveMembers(filtered);
    return true;
  }

  // Get member by ID
  getMember(id: string): TeamMember | null {
    const members = this.getAllMembers();
    return members.find(m => m.id === id) || null;
  }

  // Get members by department
  getMembersByDepartment(department: string): TeamMember[] {
    return this.getAllMembers().filter(m => m.department === department);
  }

  // Get all team views
  getAllViews(): TeamView[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const views = JSON.parse(stored);
      return views.map((view: any) => ({
        ...view,
        createdAt: new Date(view.createdAt)
      }));
    } catch {
      return [];
    }
  }

  // Save team views
  private saveViews(views: TeamView[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(views));
  }

  // Create a team view
  createView(name: string, memberIds: string[], createdBy: string): TeamView {
    const views = this.getAllViews();
    const allMembers = this.getAllMembers();
    
    const members = memberIds
      .map(id => allMembers.find(m => m.id === id))
      .filter((m): m is TeamMember => m !== undefined);

    const newView: TeamView = {
      id: `view-${Date.now()}`,
      name,
      members,
      createdAt: new Date(),
      createdBy
    };

    views.push(newView);
    this.saveViews(views);
    return newView;
  }

  // Update a team view
  updateView(id: string, updates: Partial<Omit<TeamView, 'id' | 'createdAt' | 'createdBy'>>): TeamView | null {
    const views = this.getAllViews();
    const index = views.findIndex(v => v.id === id);
    if (index === -1) return null;

    if (updates.members) {
      views[index].members = updates.members;
    }
    if (updates.name) {
      views[index].name = updates.name;
    }

    this.saveViews(views);
    return views[index];
  }

  // Delete a team view
  deleteView(id: string): boolean {
    const views = this.getAllViews();
    const filtered = views.filter(v => v.id !== id);
    if (filtered.length === views.length) return false;
    
    this.saveViews(filtered);
    return true;
  }

  // Get view by ID
  getView(id: string): TeamView | null {
    const views = this.getAllViews();
    return views.find(v => v.id === id) || null;
  }

  // Create default team views
  createDefaultViews(currentUserId: string): void {
    const allMembers = this.getAllMembers();
    if (allMembers.length === 0) return;

    const views = this.getAllViews();
    if (views.length > 0) return; // Already have views

    // Engineering team
    const engineeringIds = allMembers
      .filter(m => m.department === 'Engineering')
      .map(m => m.id);
    if (engineeringIds.length > 0) {
      this.createView('Engineering Team', engineeringIds, currentUserId);
    }

    // Product team
    const productIds = allMembers
      .filter(m => m.department === 'Product' || m.department === 'Design')
      .map(m => m.id);
    if (productIds.length > 0) {
      this.createView('Product Team', productIds, currentUserId);
    }

    // Everyone
    this.createView('All Team Members', allMembers.map(m => m.id), currentUserId);
  }

  // Group tasks by team member
  groupTasksByMember(tasks: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    const members = this.getAllMembers();

    members.forEach(member => {
      grouped.set(member.id, []);
    });

    tasks.forEach(task => {
      if (task.assignee) {
        const existing = grouped.get(task.assignee) || [];
        existing.push(task);
        grouped.set(task.assignee, existing);
      }
    });

    return grouped;
  }

  // Calculate team workload
  calculateWorkload(tasks: any[]): Map<string, number> {
    const workload = new Map<string, number>();
    const members = this.getAllMembers();

    members.forEach(member => {
      workload.set(member.id, 0);
    });

    tasks.forEach(task => {
      if (task.assignee && task.status !== 'completed') {
        const current = workload.get(task.assignee) || 0;
        workload.set(task.assignee, current + 1);
      }
    });

    return workload;
  }

  // Get team availability
  getTeamAvailability(teamView: TeamView, tasks: any[]): Map<string, 'available' | 'busy' | 'overloaded'> {
    const availability = new Map<string, 'available' | 'busy' | 'overloaded'>();
    const workload = this.calculateWorkload(tasks);

    teamView.members.forEach(member => {
      const taskCount = workload.get(member.id) || 0;
      
      if (taskCount === 0) {
        availability.set(member.id, 'available');
      } else if (taskCount <= 5) {
        availability.set(member.id, 'busy');
      } else {
        availability.set(member.id, 'overloaded');
      }
    });

    return availability;
  }

  // Get department list
  getDepartments(): string[] {
    const members = this.getAllMembers();
    const departments = new Set(members.map(m => m.department).filter(Boolean));
    return Array.from(departments) as string[];
  }

  // Export team calendar events
  exportTeamEvents(teamView: TeamView, tasks: any[]): TeamCalendarEvent[] {
    return tasks
      .filter(task => task.assignee && teamView.members.some(m => m.id === task.assignee))
      .map(task => {
        const member = teamView.members.find(m => m.id === task.assignee);
        return {
          taskId: task.id,
          assigneeId: task.assignee,
          start: new Date(task.date),
          end: new Date(task.date),
          title: `${member?.name}: ${task.title}`,
          color: member?.color || '#gray'
        };
      });
  }
}

// Export singleton instance
export const teamViewService = TeamViewService.getInstance();