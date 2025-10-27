// FilterPresetService.ts - Simple localStorage-based implementation
// This is an optional service for saving/loading calendar filter presets

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    project?: string;
    priority?: string;
    status?: string;
    assignee?: string;
    milestonesOnly?: boolean;
    overdueOnly?: boolean;
  };
  isBuiltIn: boolean;
  createdAt: Date;
}

export class FilterPresetService {
  private static readonly STORAGE_KEY = 'calendar-filter-presets';
  
  /**
   * Get all saved presets
   */
  static getAllPresets(): FilterPreset[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.getBuiltInPresets();
      
      const presets: FilterPreset[] = JSON.parse(data);
      return [...this.getBuiltInPresets(), ...presets];
    } catch (error) {
      console.error('Failed to load presets:', error);
      return this.getBuiltInPresets();
    }
  }

  /**
   * Get a specific preset by ID
   */
  static getPreset(id: string): FilterPreset | null {
    const presets = this.getAllPresets();
    return presets.find(p => p.id === id) || null;
  }

  /**
   * Save a new filter preset
   */
  static savePreset(name: string, filters: FilterPreset['filters']): FilterPreset {
    const presets = this.getAllPresets().filter(p => !p.isBuiltIn);
    
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
      isBuiltIn: false,
      createdAt: new Date()
    };

    presets.push(newPreset);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }

    return newPreset;
  }

  /**
   * Update an existing preset
   */
  static updatePreset(id: string, updates: Partial<FilterPreset>): void {
    const presets = this.getAllPresets().filter(p => !p.isBuiltIn);
    const index = presets.findIndex(p => p.id === id);
    
    if (index === -1) return;
    
    presets[index] = { ...presets[index], ...updates };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to update preset:', error);
    }
  }

  /**
   * Delete a preset
   */
  static deletePreset(id: string): void {
    const presets = this.getAllPresets().filter(p => !p.isBuiltIn && p.id !== id);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  }

  /**
   * Get built-in presets
   */
  private static getBuiltInPresets(): FilterPreset[] {
    return [
      {
        id: 'high-priority',
        name: 'High Priority',
        filters: { priority: 'high' },
        isBuiltIn: true,
        createdAt: new Date()
      },
      {
        id: 'overdue',
        name: 'Overdue Tasks',
        filters: { overdueOnly: true },
        isBuiltIn: true,
        createdAt: new Date()
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        filters: { status: 'in-progress' },
        isBuiltIn: true,
        createdAt: new Date()
      },
      {
        id: 'milestones',
        name: 'Milestones Only',
        filters: { milestonesOnly: true },
        isBuiltIn: true,
        createdAt: new Date()
      },
      {
        id: 'completed',
        name: 'Completed',
        filters: { status: 'completed' },
        isBuiltIn: true,
        createdAt: new Date()
      }
    ];
  }

  /**
   * Clear all user presets (keep built-in ones)
   */
  static clearAllPresets(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear presets:', error);
    }
  }
}