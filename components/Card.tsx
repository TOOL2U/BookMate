import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: 'cyan' | 'green' | 'pink' | 'purple' | 'none';
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'lg',
  glow = 'none',
  ...rest
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const glowClasses = {
    cyan: 'border-l-4 border-l-[#00D9FF]',
    green: 'border-l-4 border-l-[#00FF88]',
    pink: 'border-l-4 border-l-[#FF3366]',
    purple: 'border-l-4 border-l-[#9D4EDD]',
    none: '',
  };

  return (
    <div
      className={`
        bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl
        ${hover ? 'hover:border-[#00D9FF] hover:shadow-glow-cyan transition-all duration-300' : ''}
        ${paddingClasses[padding]}
        ${glowClasses[glow]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}

