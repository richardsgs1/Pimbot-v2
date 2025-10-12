// lib/DateParser.ts
// Natural language date parsing utility

export class DateParser {
  /**
   * Parse natural language date expressions into ISO date strings
   * Supports: tomorrow, today, next week, next Friday, in 3 days, etc.
   */
  static parse(input: string): string | null {
    const lowerInput = input.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // TODAY
    if (lowerInput.includes('today')) {
      return this.formatDate(today);
    }

    // TOMORROW
    if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return this.formatDate(tomorrow);
    }

    // YESTERDAY
    if (lowerInput.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return this.formatDate(yesterday);
    }

    // NEXT WEEK
    if (lowerInput.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return this.formatDate(nextWeek);
    }

    // THIS WEEK / END OF WEEK / THIS FRIDAY
    const dayOfWeekMatch = lowerInput.match(/(?:this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (dayOfWeekMatch) {
      const targetDay = dayOfWeekMatch[1];
      const isNext = dayOfWeekMatch[0].includes('next');
      return this.getNextDayOfWeek(targetDay, isNext);
    }

    // IN X DAYS/WEEKS/MONTHS
    const inXMatch = lowerInput.match(/in\s+(\d+)\s+(day|days|week|weeks|month|months)/);
    if (inXMatch) {
      const amount = parseInt(inXMatch[1]);
      const unit = inXMatch[2];
      
      const futureDate = new Date(today);
      if (unit.startsWith('day')) {
        futureDate.setDate(futureDate.getDate() + amount);
      } else if (unit.startsWith('week')) {
        futureDate.setDate(futureDate.getDate() + (amount * 7));
      } else if (unit.startsWith('month')) {
        futureDate.setMonth(futureDate.getMonth() + amount);
      }
      
      return this.formatDate(futureDate);
    }

    // X DAYS/WEEKS FROM NOW
    const fromNowMatch = lowerInput.match(/(\d+)\s+(day|days|week|weeks|month|months)\s+from\s+now/);
    if (fromNowMatch) {
      const amount = parseInt(fromNowMatch[1]);
      const unit = fromNowMatch[2];
      
      const futureDate = new Date(today);
      if (unit.startsWith('day')) {
        futureDate.setDate(futureDate.getDate() + amount);
      } else if (unit.startsWith('week')) {
        futureDate.setDate(futureDate.getDate() + (amount * 7));
      } else if (unit.startsWith('month')) {
        futureDate.setMonth(futureDate.getMonth() + amount);
      }
      
      return this.formatDate(futureDate);
    }

    // END OF WEEK (Friday)
    if (lowerInput.includes('end of week') || lowerInput.includes('eow')) {
      return this.getNextDayOfWeek('friday', false);
    }

    // END OF MONTH
    if (lowerInput.includes('end of month') || lowerInput.includes('eom')) {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return this.formatDate(endOfMonth);
    }

    // SPECIFIC DATE FORMATS
    // Dec 25, December 25, 12/25, 2024-12-25
    const specificDateMatch = lowerInput.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (specificDateMatch) {
      const month = parseInt(specificDateMatch[1]) - 1;
      const day = parseInt(specificDateMatch[2]);
      const year = specificDateMatch[3] ? parseInt(specificDateMatch[3]) : today.getFullYear();
      
      const date = new Date(year, month, day);
      return this.formatDate(date);
    }

    // Month name + day (e.g., "Dec 25", "December 25")
    const monthDayMatch = lowerInput.match(/(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{1,2})/);
    if (monthDayMatch) {
      const monthStr = monthDayMatch[1];
      const day = parseInt(monthDayMatch[2]);
      const month = this.parseMonth(monthStr);
      
      if (month !== -1) {
        const date = new Date(today.getFullYear(), month, day);
        // If date is in the past, assume next year
        if (date < today) {
          date.setFullYear(date.getFullYear() + 1);
        }
        return this.formatDate(date);
      }
    }

    return null;
  }

  /**
   * Get the next occurrence of a specific day of week
   */
  private static getNextDayOfWeek(dayName: string, forceNext: boolean = false): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    
    if (targetDay === -1) return this.formatDate(new Date());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    
    // If the day has passed this week or we want next week's occurrence
    if (daysUntilTarget <= 0 || forceNext) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysUntilTarget);
    
    return this.formatDate(targetDate);
  }

  /**
   * Parse month name to month number (0-11)
   */
  private static parseMonth(monthStr: string): number {
    const months: { [key: string]: number } = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };
    
    return months[monthStr.toLowerCase()] ?? -1;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Extract all date-related phrases from text
   */
  static extractDatePhrases(text: string): string[] {
    const phrases: string[] = [];
    const lowerText = text.toLowerCase();

    const patterns = [
      /tomorrow/,
      /today/,
      /yesterday/,
      /next week/,
      /this week/,
      /end of week/,
      /eow/,
      /end of month/,
      /eom/,
      /(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
      /in\s+\d+\s+(?:day|days|week|weeks|month|months)/,
      /\d+\s+(?:day|days|week|weeks|month|months)\s+from\s+now/,
      /\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/,
      /(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+\d{1,2}/
    ];

    patterns.forEach(pattern => {
      const match = lowerText.match(pattern);
      if (match) {
        phrases.push(match[0]);
      }
    });

    return phrases;
  }
}