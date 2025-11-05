import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: 'yellow' | 'green' | 'pink' | 'purple' | 'none';
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
    yellow: 'border-l-4 border-l-accent',
    green: 'border-l-4 border-l-success',
    pink: 'border-l-4 border-l-error',
    purple: 'border-l-4 border-l-info',
    none: '',
  };

  return (
    <div
      className={`
        bg-[#0A0A0A] border border-border-card rounded-2xl
        ${hover ? 'hover:border-yellow hover:shadow-glow transition-all duration-300 cursor-pointer' : ''}
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
