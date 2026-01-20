import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  hint
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Clone children to add accessibility attributes
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const ariaDescribedBy = [
        error ? errorId : null,
        hint && !error ? hintId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': ariaDescribedBy,
        'aria-required': required ? 'true' : undefined,
      });
    }
    return child;
  });

  return (
    <div className="space-y-1">
      {/* Label */}
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {/* Input/Select/Textarea */}
      {enhancedChildren}

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-red-500 flex items-center gap-1 animate-fade-in"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Hint Text */}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--text-tertiary)]">{hint}</p>
      )}
    </div>
  );
};

export default FormField;
