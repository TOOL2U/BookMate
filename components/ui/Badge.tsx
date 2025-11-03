import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantClasses = {
    success: 'bg-success/10 text-success border border-success/40',
    warning: 'bg-warning/10 text-warning border border-warning/40',
    danger: 'bg-error/10 text-error border border-error/40',
    info: 'bg-info/10 text-info border border-info/40',
    default: 'bg-bg-card text-text-secondary border border-border-card',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs font-medium rounded-lg',
    md: 'px-3 py-1.5 text-sm font-medium rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
