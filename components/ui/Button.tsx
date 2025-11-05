import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dangerGhost' | 'primaryAccent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-xl2 transition-all duration-200 ease-smoother flex items-center justify-center gap-2 whitespace-nowrap font-aileron';

  const variantClasses = {
    primary: 'bg-yellow text-black shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed',
    primaryAccent: 'bg-yellow text-black shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed', // Alias for compatibility
    secondary: 'bg-grey-dark text-yellow hover:bg-black border border-yellow/20 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-muted hover:text-fg hover:bg-grey-dark/50 disabled:opacity-50 disabled:cursor-not-allowed',
    dangerGhost: 'bg-transparent border border-error/40 text-error hover:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <motion.button
      whileHover={{
        scale: isLoading || disabled ? 1 : 1.01,
        transition: { type: 'spring', stiffness: 300, damping: 25, duration: 0.2 }
      }}
      whileTap={{
        scale: isLoading || disabled ? 1 : 0.99,
        transition: { type: 'spring', stiffness: 300, damping: 25, duration: 0.15 }
      }}
      disabled={isLoading || disabled}
      className={`${finalClassName} relative overflow-hidden`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
