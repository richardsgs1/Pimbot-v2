export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: {
    projects: string[];
    priorities: string[];
    statuses: string[];
    assignees: string[];
    showMilestones: boolean;
    showOverdueOnly: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'pimbot_calendar_filter_presets';

export class FilterPresetService {
  /**
   * Get all saved presets
   */
  static getPresets(): FilterPreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return this.getDefaultPresets();
      
      const presets = JSON.parse(stored);
      return presets.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load filter presets:', error);
      return this.getDefaultPresets();
    }
  }

  /**
   * Save a new preset
   */
  static savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>): FilterPreset {
    const presets = this.getPresets();
    
    const newPreset: FilterPreset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    presets.push(newPreset);
    this.persistPresets(presets);
    
    return newPreset;
  }

  /**
   * Update an existing preset
   */
  static updatePreset(id: string, updates: Partial<Omit<FilterPreset, 'id' | 'createdAt'>>): FilterPreset | null {
    const presets = this.getPresets();
    const index = presets.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    presets[index] = {
      ...presets[index],
      ...updates,
      updatedAt: new Date()
    };

    this.persistPresets(presets);
    return presets[index];
  }

  /**
   * Delete a preset
   */
  static deletePreset(id: string): boolean {
    const presets = this.getPresets();
    const filtered = presets.filter(p => p.id !== id);
    
    if (filtered.length === presets.length) return false;
    
    this.persistPresets(filtered);
    return true;
  }

  /**
   * Get a specific preset by ID
   */
  static getPreset(id: string): FilterPreset | null {
    const presets = this.getPresets();
    return presets.find(p => p.id === id) || null;
  }

  /**
   * Get default presets (built-in)
   */
  private static getDefaultPresets(): FilterPreset[] {
    const now = new Date();
    
    return [
      {
        id: 'default-overdue',
        name: '🔴 Overdue Tasks',
        description: 'All overdue tasks across projects',
        filters: {
          projects: [],
          priorities: [],
          statuses: [],
          assignees: [],
          showMilestones: false,
          showOverdueOnly: true
        },
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'default-high-priority',
        name: '🔥 High Priority',
        description: 'All high priority tasks',
        filters: {
          projects: [],
          priorities: ['high'],
          statuses: [],
          assignees: [],
          showMilestones: false,
          showOverdueOnly: false
        },
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'default-in-progress',
        name: '⚡ In Progress',
        description: 'Tasks currently being worked on',
        filters: {
          projects: [],
          priorities: [],
          statuses: ['in-progress'],
          assignees: [],
          showMilestones: false,
          showOverdueOnly: false
        },
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'default-milestones',
        name: '🎯 Milestones Only',
        description: 'Project start and end dates',
        filters: {
          projects: [],
          priorities: [],
          statuses: [],
          assignees: [],
          showMilestones: true,
          showOverdueOnly: false
        },
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * Persist presets to localStorage
   */
  private static persistPresets(presets: FilterPreset[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save filter presets:', error);
    }
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export presets to JSON file
   */
  static exportPresets(): void {
    const presets = this.getPresets();
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pimbot-filter-presets.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import presets from JSON file
   */
  static async importPresets(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (!Array.isArray(imported)) {
            reject(new Error('Invalid format'));
            return;
          }

          const existingPresets = this.getPresets();
          const newPresets = imported.map(p => ({
            ...p,
            id: this.generateId(), // Generate new IDs to avoid conflicts
            createdAt: new Date(p.createdAt),
            updatedAt: new Date()
          }));

          this.persistPresets([...existingPresets, ...newPresets]);
          resolve(newPresets.length);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Check if current filters match a preset
   */
  static findMatchingPreset(filters: FilterPreset['filters']): FilterPreset | null {
    const presets = this.getPresets();
    
    return presets.find(preset => {
      const pf = preset.filters;
      return (
        JSON.stringify(pf.projects.sort()) === JSON.stringify(filters.projects.sort()) &&
        JSON.stringify(pf.priorities.sort()) === JSON.stringify(filters.priorities.sort()) &&
        JSON.stringify(pf.statuses.sort()) === JSON.stringify(filters.statuses.sort()) &&
        JSON.stringify(pf.assignees.sort()) === JSON.stringify(filters.assignees.sort()) &&
        pf.showMilestones === filters.showMilestones &&
        pf.showOverdueOnly === filters.showOverdueOnly
      );
    }) || null;
  }
}