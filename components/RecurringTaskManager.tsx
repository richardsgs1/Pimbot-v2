/**
 * RecurringTaskManager Component
 *
 * Manages recurring task configuration with pattern creation,
 * instance preview, and scheduling options.
 */

import React, { useState, useEffect } from 'react';
import type { Task, RecurrencePattern, RecurringTaskInstance } from '../types';
import { RecurringTaskService } from '../lib/RecurringTaskService';

interface RecurringTaskManagerProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onClose?: () => void;
}

export const RecurringTaskManager: React.FC<RecurringTaskManagerProps> = ({
  task,
  onUpdate,
  onClose
}) => {
  const [isRecurring, setIsRecurring] = useState(task.isRecurring || false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'>(
    task.recurrencePattern?.frequency || 'weekly'
  );
  const [interval, setInterval] = useState(task.recurrencePattern?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(task.recurrencePattern?.daysOfWeek || []);
  const [dayOfMonth, setDayOfMonth] = useState(task.recurrencePattern?.dayOfMonth || 1);
  const [endDate, setEndDate] = useState(task.recurrencePattern?.endDate || '');
  const [maxOccurrences, setMaxOccurrences] = useState(task.recurrencePattern?.maxOccurrences || undefined);
  const [useEndDate, setUseEndDate] = useState(!!task.recurrencePattern?.endDate);
  const [instances, setInstances] = useState<RecurringTaskInstance[]>([]);
  const [previewDates, setPreviewDates] = useState<string[]>([]);

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  // Load instances if this is a recurring task
  useEffect(() => {
    if (task.isRecurring) {
      loadInstances();
    }
  }, [task.id, task.isRecurring]);

  // Update preview when pattern changes
  useEffect(() => {
    if (isRecurring) {
      updatePreview();
    }
  }, [isRecurring, frequency, interval, daysOfWeek, dayOfMonth, endDate, maxOccurrences]);

  const loadInstances = async () => {
    const loadedInstances = await RecurringTaskService.getTaskInstances(task.id);
    setInstances(loadedInstances);
  };

  const updatePreview = () => {
    const pattern: RecurrencePattern = {
      frequency,
      interval,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      endDate: useEndDate ? endDate : undefined,
      maxOccurrences: !useEndDate ? maxOccurrences : undefined
    };

    const upcoming = RecurringTaskService.getUpcomingInstances(
      pattern,
      new Date().toISOString(),
      30
    );

    setPreviewDates(upcoming.slice(0, 5)); // Show first 5
  };

  const handleToggleRecurring = () => {
    setIsRecurring(!isRecurring);
  };

  const handleDayOfWeekToggle = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSave = () => {
    if (!isRecurring) {
      // Remove recurring configuration
      const updatedTask: Task = {
        ...task,
        isRecurring: false,
        recurrencePattern: undefined,
        updatedAt: new Date().toISOString()
      };
      onUpdate(updatedTask);
      return;
    }

    // Create recurrence pattern
    const pattern: RecurrencePattern = {
      frequency,
      interval,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      endDate: useEndDate ? endDate : undefined,
      maxOccurrences: !useEndDate ? maxOccurrences : undefined
    };

    const updatedTask: Task = {
      ...task,
      isRecurring: true,
      recurrencePattern: pattern,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updatedTask);
  };

  const getPatternDescription = () => {
    if (!isRecurring) return 'Does not repeat';

    const pattern: RecurrencePattern = {
      frequency,
      interval,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      endDate: useEndDate ? endDate : undefined,
      maxOccurrences: !useEndDate ? maxOccurrences : undefined
    };

    return RecurringTaskService.getPatternDescription(pattern);
  };

  const handleGenerateNext = async () => {
    if (!task.isRecurring || !task.recurrencePattern) return;

    const nextOccurrenceNum = await RecurringTaskService.getNextOccurrenceNumber(task.id);
    const nextOccurrence = RecurringTaskService.calculateNextOccurrence(task.recurrencePattern);

    if (!nextOccurrence) return;

    const result = await RecurringTaskService.generateTaskInstance(
      task,
      nextOccurrence.date,
      nextOccurrenceNum
    );

    if (result.success) {
      loadInstances();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Recurring Task
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Enable/Disable Recurring */}
      <div className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
        <input
          type="checkbox"
          id="recurring-toggle"
          checked={isRecurring}
          onChange={handleToggleRecurring}
          className="w-5 h-5 rounded border-[var(--border-primary)] bg-[var(--bg-primary)] cursor-pointer accent-[var(--accent-primary)]"
        />
        <label htmlFor="recurring-toggle" className="flex-1 cursor-pointer">
          <div className="font-medium text-[var(--text-primary)]">Make this a recurring task</div>
          <div className="text-sm text-[var(--text-secondary)]">
            Automatically generate task instances on a schedule
          </div>
        </label>
      </div>

      {isRecurring && (
        <>
          {/* Frequency Selection */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-[var(--text-primary)]">Repeat Pattern</h4>

            {/* Frequency Type */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
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
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Every
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className="w-20 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
                <span className="text-[var(--text-secondary)]">
                  {frequency === 'daily' && `day${interval > 1 ? 's' : ''}`}
                  {frequency === 'weekly' && `week${interval > 1 ? 's' : ''}`}
                  {frequency === 'monthly' && `month${interval > 1 ? 's' : ''}`}
                  {frequency === 'yearly' && `year${interval > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Days of Week (for weekly) */}
            {frequency === 'weekly' && (
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  On these days
                </label>
                <div className="flex gap-2 flex-wrap">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      onClick={() => handleDayOfWeekToggle(day.value)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        daysOfWeek.includes(day.value)
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {frequency === 'monthly' && (
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  On day
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-20 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                />
              </div>
            )}
          </div>

          {/* End Condition */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-[var(--text-primary)]">End Condition</h4>

            <div className="space-y-3">
              {/* End Date Option */}
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="end-date-option"
                  checked={useEndDate}
                  onChange={() => setUseEndDate(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="end-date-option" className="block text-sm text-[var(--text-primary)] mb-2">
                    End by date
                  </label>
                  {useEndDate && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                    />
                  )}
                </div>
              </div>

              {/* Max Occurrences Option */}
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="max-occurrences-option"
                  checked={!useEndDate}
                  onChange={() => setUseEndDate(false)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="max-occurrences-option" className="block text-sm text-[var(--text-primary)] mb-2">
                    End after number of occurrences
                  </label>
                  {!useEndDate && (
                    <input
                      type="number"
                      min="1"
                      value={maxOccurrences || ''}
                      onChange={(e) => setMaxOccurrences(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Leave empty for no limit"
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pattern Description */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h4 className="font-medium text-blue-300 mb-1">Recurrence Summary</h4>
                <p className="text-sm text-blue-200">{getPatternDescription()}</p>
              </div>
            </div>
          </div>

          {/* Preview Upcoming Dates */}
          {previewDates.length > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">
                Next 5 Occurrences
              </h4>
              <div className="space-y-2">
                {previewDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <span className="text-[var(--accent-primary)]">#{index + 1}</span>
                    <span>{new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Instances */}
          {task.isRecurring && instances.length > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">
                Generated Instances ({instances.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {instances.map((instance) => (
                  <div
                    key={instance.id}
                    className="flex items-center justify-between p-2 bg-[var(--bg-primary)] rounded text-sm"
                  >
                    <div>
                      <span className="text-[var(--text-primary)]">
                        Occurrence #{instance.occurrenceNumber}
                      </span>
                      <span className="text-[var(--text-secondary)] ml-2">
                        {new Date(instance.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateNext}
                className="mt-3 w-full px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-lg font-medium"
              >
                Generate Next Instance
              </button>
            </div>
          )}
        </>
      )}

      {/* Save Button */}
      <div className="flex gap-2 pt-4 border-t border-[var(--border-primary)]">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:opacity-90"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-lg font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};