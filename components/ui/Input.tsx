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
        <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider font-aileron">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 bg-[#1b1b1b] border border-border rounded-xl2
          text-fg placeholder:text-muted font-aileron
          focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow
          transition-all duration-300
          ${error ? 'border-error/40 focus:border-error focus:ring-error/50' : ''}
          ${className}
        `}
        style={{ fontSize: '16px' }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error font-aileron">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-muted font-aileron">{helperText}</p>
      )}
    </div>
  );
}
