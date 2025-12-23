import React, { useState, useEffect } from 'react';
import type { Task, RecurrencePattern } from '../types';
import { recurringTaskGenerator } from '../lib/RecurringTaskGenerator';

interface RecurringTaskSetupProps {
  task: Task;
  onUpdateTask: (updates: Partial<Task>) => void;
}

const RecurringTaskSetup: React.FC<RecurringTaskSetupProps> = ({
  task,
  onUpdateTask,
}) => {
  const [isRecurring, setIsRecurring] = useState(task.isRecurring || false);
  const [frequency, setFrequency] = useState<RecurrencePattern['frequency']>(
    task.recurrencePattern?.frequency || 'weekly'
  );
  const [interval, setInterval] = useState(task.recurrencePattern?.interval || 1);
  const [endType, setEndType] = useState<'date' | 'count' | 'infinite'>(
    task.recurrencePattern?.endDate ? 'date' :
    task.recurrencePattern?.maxOccurrences ? 'count' :
    'infinite'
  );
  const [endDate, setEndDate] = useState(task.recurrencePattern?.endDate || '');
  const [maxOccurrences, setMaxOccurrences] = useState(
    task.recurrencePattern?.maxOccurrences || 10
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    task.recurrencePattern?.daysOfWeek || []
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    task.recurrencePattern?.dayOfMonth || 1
  );

  // Get preview of next occurrences
  const [preview, setPreview] = useState<Array<{ date: string; occurrenceNumber: number }>>([]);

  useEffect(() => {
    if (!isRecurring) return;

    // Create temporary pattern for preview
    const pattern: RecurrencePattern = {
      frequency,
      interval: interval || 1,
      daysOfWeek: frequency === 'weekly' && daysOfWeek.length > 0 ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      endDate: endType === 'date' ? endDate : undefined,
      maxOccurrences: endType === 'count' ? maxOccurrences : undefined,
    };

    const previewData = recurringTaskGenerator.getNextOccurrencesPreview(
      { ...task, recurrencePattern: pattern },
      5
    );

    setPreview(previewData);
  }, [isRecurring, frequency, interval, endType, endDate, maxOccurrences, daysOfWeek, dayOfMonth, task]);

  const handleSaveRecurrence = () => {
    if (!isRecurring) {
      onUpdateTask({
        isRecurring: false,
        recurrencePattern: undefined,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Build pattern
    const pattern: RecurrencePattern = {
      frequency,
      interval: interval || 1,
      daysOfWeek: frequency === 'weekly' && daysOfWeek.length > 0 ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      endDate: endType === 'date' ? endDate : undefined,
      maxOccurrences: endType === 'count' ? maxOccurrences : undefined,
    };

    // Validate pattern
    const validation = recurringTaskGenerator.validatePattern(pattern);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onUpdateTask({
      isRecurring: true,
      recurrencePattern: pattern,
      updatedAt: new Date().toISOString(),
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Enable Recurring Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] cursor-pointer accent-[var(--accent-primary)]"
        />
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Make this a recurring task
        </span>
      </label>

      {isRecurring && (
        <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrencePattern['frequency'])}
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Interval */}
          {frequency !== 'biweekly' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Repeat every {frequency === 'monthly' ? 'N months' : frequency === 'quarterly' ? 'N quarters' : frequency === 'yearly' ? 'N years' : 'N weeks'}
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
              />
            </div>
          )}

          {/* Days of Week (for weekly) */}
          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Days of week
              </label>
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDaysOfWeek(prev =>
                        prev.includes(index)
                          ? prev.filter(d => d !== index)
                          : [...prev, index]
                      );
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      daysOfWeek.includes(index)
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Day of month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
              />
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              End condition
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="infinite"
                  checked={endType === 'infinite'}
                  onChange={() => setEndType('infinite')}
                  className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Never end</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="date"
                  checked={endType === 'date'}
                  onChange={() => setEndType('date')}
                  className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">End on date</span>
              </label>

              {endType === 'date' && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ml-6 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="count"
                  checked={endType === 'count'}
                  onChange={() => setEndType('count')}
                  className="w-4 h-4 cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">End after N occurrences</span>
              </label>

              {endType === 'count' && (
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(parseInt(e.target.value) || 10)}
                  className="ml-6 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
                />
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)]">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Next occurrences:
              </p>
              <ul className="space-y-1 text-sm text-[var(--text-tertiary)]">
                {preview.slice(0, 5).map((occ, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-[var(--accent-primary)]">#{occ.occurrenceNumber}</span>
                    <span>
                      {new Date(occ.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveRecurrence}
            className="w-full px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
          >
            Save Recurrence Pattern
          </button>
        </div>
      )}

      {/* Current Recurrence Info */}
      {task.isRecurring && task.recurrencePattern && !isRecurring === false && (
        <div className="p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg">
          <p className="text-sm font-medium text-[var(--accent-primary)] mb-1">
            Recurrence Pattern:
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {recurringTaskGenerator.describePattern(task.recurrencePattern)}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecurringTaskSetup;
