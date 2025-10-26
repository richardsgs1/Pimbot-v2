export interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutAction[];
}

export class KeyboardShortcutService {
  private static shortcuts: Map<string, ShortcutAction> = new Map();
  private static enabled: boolean = true;
  private static helpVisible: boolean = false;

  /**
   * Register a keyboard shortcut
   */
  static register(shortcut: ShortcutAction): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Register multiple shortcuts
   */
  static registerMultiple(shortcuts: ShortcutAction[]): void {
    shortcuts.forEach(s => this.register(s));
  }

  /**
   * Unregister a shortcut
   */
  static unregister(key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean, metaKey?: boolean): void {
    const shortcutKey = this.getShortcutKey({ key, ctrlKey, shiftKey, altKey, metaKey } as ShortcutAction);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Clear all shortcuts
   */
  static clearAll(): void {
    this.shortcuts.clear();
  }

  /**
   * Get shortcut key string
   */
  private static getShortcutKey(shortcut: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }): string {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.metaKey) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Handle keyboard event
   */
  static handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.enabled) return false;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Exception: Allow Escape key
      if (event.key !== 'Escape') return false;
    }

    const key = this.getShortcutKey({
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    });

    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      return true;
    }

    return false;
  }

  /**
   * Enable shortcuts
   */
  static enable(): void {
    this.enabled = true;
  }

  /**
   * Disable shortcuts
   */
  static disable(): void {
    this.enabled = false;
  }

  /**
   * Toggle shortcuts
   */
  static toggle(): void {
    this.enabled = !this.enabled;
  }

  /**
   * Get all registered shortcuts grouped by category
   */
  static getShortcutsByCategory(): ShortcutCategory[] {
    const navigation: ShortcutAction[] = [];
    const view: ShortcutAction[] = [];
    const actions: ShortcutAction[] = [];
    const filters: ShortcutAction[] = [];
    const general: ShortcutAction[] = [];

    this.shortcuts.forEach(shortcut => {
      const desc = shortcut.description.toLowerCase();
      
      if (desc.includes('navigate') || desc.includes('go to') || desc.includes('previous') || desc.includes('next')) {
        navigation.push(shortcut);
      } else if (desc.includes('view') || desc.includes('switch') || desc.includes('toggle')) {
        view.push(shortcut);
      } else if (desc.includes('create') || desc.includes('save') || desc.includes('export') || desc.includes('delete')) {
        actions.push(shortcut);
      } else if (desc.includes('filter') || desc.includes('search') || desc.includes('preset')) {
        filters.push(shortcut);
      } else {
        general.push(shortcut);
      }
    });

    return [
      { name: 'Navigation', shortcuts: navigation },
      { name: 'View', shortcuts: view },
      { name: 'Actions', shortcuts: actions },
      { name: 'Filters', shortcuts: filters },
      { name: 'General', shortcuts: general }
    ].filter(cat => cat.shortcuts.length > 0);
  }

  /**
   * Get formatted shortcut display string
   */
  static getShortcutDisplay(shortcut: ShortcutAction): string {
    const parts: string[] = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.ctrlKey) parts.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.metaKey) parts.push('Meta');
    
    // Format key display
    const key = shortcut.key;
    if (key === ' ') {
      parts.push('Space');
    } else if (key === 'ArrowUp') {
      parts.push('↑');
    } else if (key === 'ArrowDown') {
      parts.push('↓');
    } else if (key === 'ArrowLeft') {
      parts.push('←');
    } else if (key === 'ArrowRight') {
      parts.push('→');
    } else if (key === 'Escape') {
      parts.push('Esc');
    } else {
      parts.push(key.toUpperCase());
    }

    return parts.join(' + ');
  }

  /**
   * Initialize event listener
   */
  static initialize(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  /**
   * Cleanup event listener
   */
  static cleanup(): void {
    document.removeEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  /**
   * Show help modal
   */
  static showHelp(): void {
    this.helpVisible = true;
  }

  /**
   * Hide help modal
   */
  static hideHelp(): void {
    this.helpVisible = false;
  }

  /**
   * Toggle help modal
   */
  static toggleHelp(): void {
    this.helpVisible = !this.helpVisible;
  }

  /**
   * Get help visibility state
   */
  static isHelpVisible(): boolean {
    return this.helpVisible;
  }
}

/**
 * Default calendar shortcuts factory
 */
export class CalendarShortcuts {
  static create(callbacks: {
    onViewChange: (view: 'month' | 'week' | 'day' | 'agenda') => void;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    onFilterToggle: () => void;
    onPresetToggle: () => void;
    onExportToggle: () => void;
    onCreateTask: () => void;
    onSearch: () => void;
    onHelp: () => void;
  }): ShortcutAction[] {
    return [
      // Navigation
      {
        key: 'ArrowLeft',
        description: 'Navigate to previous period',
        action: () => callbacks.onNavigate('prev')
      },
      {
        key: 'ArrowRight',
        description: 'Navigate to next period',
        action: () => callbacks.onNavigate('next')
      },
      {
        key: 't',
        description: 'Go to today',
        action: () => callbacks.onNavigate('today')
      },

      // View switching
      {
        key: 'm',
        description: 'Switch to month view',
        action: () => callbacks.onViewChange('month')
      },
      {
        key: 'w',
        description: 'Switch to week view',
        action: () => callbacks.onViewChange('week')
      },
      {
        key: 'd',
        description: 'Switch to day view',
        action: () => callbacks.onViewChange('day')
      },
      {
        key: 'a',
        description: 'Switch to agenda view',
        action: () => callbacks.onViewChange('agenda')
      },

      // Actions
      {
        key: 'n',
        ctrlKey: true,
        description: 'Create new task',
        action: callbacks.onCreateTask
      },
      {
        key: 'e',
        ctrlKey: true,
        description: 'Export calendar',
        action: callbacks.onExportToggle
      },
      {
        key: 'k',
        ctrlKey: true,
        description: 'Search tasks',
        action: callbacks.onSearch
      },

      // Filters & Presets
      {
        key: 'f',
        ctrlKey: true,
        description: 'Toggle filters',
        action: callbacks.onFilterToggle
      },
      {
        key: 'p',
        ctrlKey: true,
        description: 'Open presets',
        action: callbacks.onPresetToggle
      },

      // General
      {
        key: 'Escape',
        description: 'Close modals',
        action: () => {
          // Will be handled by individual modals
        }
      },
      {
        key: '?',
        shiftKey: true,
        description: 'Show keyboard shortcuts',
        action: callbacks.onHelp
      },
      {
        key: 'h',
        ctrlKey: true,
        description: 'Show keyboard shortcuts',
        action: callbacks.onHelp
      }
    ];
  }
}