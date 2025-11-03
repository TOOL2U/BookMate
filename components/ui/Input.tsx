import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 bg-[#0A0A0A] border border-border-card rounded-xl
          text-text-primary placeholder:text-text-tertiary
          focus:outline-none focus:border-accent focus:shadow-glow-cyan-sm
          transition-all duration-300
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
