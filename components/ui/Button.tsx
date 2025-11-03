import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
  const baseClasses = 'font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap';

  // Mobile app dark theme button variants with cyan/neon colors
  const variantClasses = {
    primary: 'bg-[#00D9FF] hover:shadow-[0_0_35px_rgba(0,217,255,0.6)] text-[#000000] font-semibold disabled:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50 disabled:text-[#666666]',
    secondary: 'bg-[#1A1A1A] hover:bg-[#222222] text-[#FFFFFF] border border-[#2A2A2A] hover:border-[#00D9FF] hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'border border-[#2A2A2A] text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] hover:border-[#00D9FF] hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-[#FF3366] hover:shadow-[0_0_30px_rgba(255,51,102,0.5)] text-[#FFFFFF] font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
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
        scale: isLoading || disabled ? 1 : 1.02,
        y: isLoading || disabled ? 0 : -2,
        transition: { type: 'spring', stiffness: 300, damping: 25, duration: 0.3 }
      }}
      whileTap={{
        scale: isLoading || disabled ? 1 : 0.95,
        transition: { type: 'spring', stiffness: 300, damping: 25, duration: 0.2 }
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

