import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  hoverable?: boolean;
  glowColor?: 'cyan' | 'green' | 'pink' | 'purple' | 'none';
}

export default function Card({
  children,
  hoverable = false,
  glowColor = 'none',
  className = '',
  ...props
}: CardProps) {
  // Mobile app dark theme: #1A1A1A cards with #2A2A2A borders
  const baseClasses = 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 transition-all duration-300';
  
  // Cyan glow on hover (matches mobile app)
  const hoverClasses = hoverable 
    ? 'hover:border-[#00D9FF] hover:shadow-[0_0_25px_rgba(0,217,255,0.4)] cursor-pointer' 
    : '';

  // Neon left border indicators (matches mobile KPI cards)
  const glowBorderClasses = {
    cyan: 'border-l-4 border-l-[#00D9FF]',
    green: 'border-l-4 border-l-[#00FF88]',
    pink: 'border-l-4 border-l-[#FF3366]',
    purple: 'border-l-4 border-l-[#9D4EDD]',
    none: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverable ? {
        y: -2,
        transition: { type: 'spring', stiffness: 200, damping: 25 }
      } : {}}
      className={`${baseClasses} ${hoverClasses} ${glowBorderClasses[glowColor]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

