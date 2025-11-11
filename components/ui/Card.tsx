import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  hoverable?: boolean;
  glow?: boolean;
}

export default function Card({
  children,
  hoverable = false,
  glow = true,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'bg-card text-cardFg rounded-xl2 shadow-soft border border-border p-6 transition-all duration-300 relative';
  const glowClasses = glow ? 'shadow-glow' : '';
  const hoverClasses = hoverable ? 'hover:border-yellow/20 hover:shadow-glow-lg cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={hoverable ? {
        y: -4,
        transition: { type: 'spring', stiffness: 200, damping: 25 }
      } : {}}
      className={`${baseClasses} ${glowClasses} ${hoverClasses} ${className}`}
      style={{
        backgroundImage: glow ? 'radial-gradient(circle at 50% -20%, rgba(255, 240, 43, 0.06), transparent 60%)' : undefined
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

