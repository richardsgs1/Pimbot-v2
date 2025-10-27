// TeamViewService.ts - Simple localStorage-based implementation
// This is an optional service for managing team calendar views

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  color: string;
  role?: string;
}

export interface TeamView {
  id: string;
  name: string;
  memberIds: string[];
  color?: string;
  createdBy: string;
  createdAt: Date;
}

export class TeamViewService {
  private static readonly MEMBERS_KEY = 'team-members';
  private static readonly VIEWS_KEY = 'team-views';

  /**
   * Get all team members
   */
  static getAllMembers(): TeamMember[] {
    try {
      const data = localStorage.getItem(this.MEMBERS_KEY);
      if (!data) return this.getDefaultMembers();
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load team members:', error);
      return this.getDefaultMembers();
    }
  }

  /**
   * Add a team member
   */
  static addMember(member: Omit<TeamMember, 'id'>): TeamMember {
    const members = this.getAllMembers();
    
    const newMember: TeamMember = {
      ...member,
      id: `member-${Date.now()}`
    };

    members.push(newMember);
    
    try {
      localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
    } catch (error) {
      console.error('Failed to add member:', error);
    }

    return newMember;
  }

  /**
   * Update a team member
   */
  static updateMember(id: string, updates: Partial<TeamMember>): void {
    const members = this.getAllMembers();
    const index = members.findIndex(m => m.id === id);
    
    if (index === -1) return;
    
    members[index] = { ...members[index], ...updates };
    
    try {
      localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  }

  /**
   * Remove a team member
   */
  static removeMember(id: string): void {
    const members = this.getAllMembers().filter(m => m.id !== id);
    
    try {
      localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }

  /**
   * Get all team views
   */
  static getAllViews(): TeamView[] {
    try {
      const data = localStorage.getItem(this.VIEWS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load team views:', error);
      return [];
    }
  }

  /**
   * Create a new team view
   */
  static createView(name: string, memberIds: string[], createdBy: string, color?: string): TeamView {
    const views = this.getAllViews();
    
    const newView: TeamView = {
      id: `view-${Date.now()}`,
      name,
      memberIds,
      color: color || this.getRandomColor(),
      createdBy,
      createdAt: new Date()
    };

    views.push(newView);
    
    try {
      localStorage.setItem(this.VIEWS_KEY, JSON.stringify(views));
    } catch (error) {
      console.error('Failed to create view:', error);
    }

    return newView;
  }

  /**
   * Update a team view
   */
  static updateView(id: string, updates: Partial<TeamView>): void {
    const views = this.getAllViews();
    const index = views.findIndex(v => v.id === id);
    
    if (index === -1) return;
    
    views[index] = { ...views[index], ...updates };
    
    try {
      localStorage.setItem(this.VIEWS_KEY, JSON.stringify(views));
    } catch (error) {
      console.error('Failed to update view:', error);
    }
  }

  /**
   * Delete a team view
   */
  static deleteView(id: string): void {
    const views = this.getAllViews().filter(v => v.id !== id);
    
    try {
      localStorage.setItem(this.VIEWS_KEY, JSON.stringify(views));
    } catch (error) {
      console.error('Failed to delete view:', error);
    }
  }

  /**
   * Get a specific view by ID
   */
  static getView(id: string): TeamView | null {
    const views = this.getAllViews();
    return views.find(v => v.id === id) || null;
  }

  /**
   * Create default team views
   */
  static createDefaultViews(userId: string): void {
    const members = this.getAllMembers();
    
    if (members.length === 0) return;

    // Create a view for each member
    members.slice(0, 3).forEach(member => {
      this.createView(
        `${member.name}'s Tasks`,
        [member.id],
        userId,
        member.color
      );
    });

    // Create an "All Team" view
    if (members.length > 1) {
      this.createView(
        'All Team',
        members.map(m => m.id),
        userId,
        '#3b82f6'
      );
    }
  }

  /**
   * Get default team members (stub data)
   */
  private static getDefaultMembers(): TeamMember[] {
    return [
      {
        id: 'member-1',
        name: 'John Doe',
        email: 'john@example.com',
        color: '#3b82f6',
        role: 'Developer'
      },
      {
        id: 'member-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        color: '#ef4444',
        role: 'Designer'
      },
      {
        id: 'member-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        color: '#10b981',
        role: 'Manager'
      }
    ];
  }

  /**
   * Get a random color for a team view
   */
  private static getRandomColor(): string {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316'  // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Clear all team data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.MEMBERS_KEY);
      localStorage.removeItem(this.VIEWS_KEY);
    } catch (error) {
      console.error('Failed to clear team data:', error);
    }
  }
}