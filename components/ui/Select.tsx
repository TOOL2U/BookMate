import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export default function Select({
  label,
  error,
  helperText,
  options,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider font-aileron">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2 bg-[#1b1b1b] border border-border rounded-xl2
          text-fg font-aileron
          focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow
          transition-all duration-300 appearance-none cursor-pointer
          ${error ? 'border-error/40 focus:border-error focus:ring-error/50' : ''}
          ${className}
        `}
        style={{ fontSize: '16px' }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-grey-dark">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-error font-aileron">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-muted font-aileron">{helperText}</p>
      )}
    </div>
  );
}
