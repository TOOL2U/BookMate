import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Textarea({
  label,
  error,
  helperText,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-2.5 bg-bg-card border border-border-card rounded-xl
          text-text-primary placeholder:text-text-tertiary font-mono text-sm
          focus:outline-none focus:border-accent focus:shadow-glow-cyan-sm
          transition-all duration-300 resize-none
          ${error ? 'border-error/40 focus:border-error focus:shadow-[0_0_12px_rgba(255,51,102,0.4)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-text-tertiary">{helperText}</p>
      )}
    </div>
  );
}
