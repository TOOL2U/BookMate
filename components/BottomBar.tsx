'use client';

import { ReactNode } from 'react';

interface BottomBarProps {
  children: ReactNode;
  show?: boolean;
}

export default function BottomBar({ children, show = true }: BottomBarProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="bg-bg-app/80 border-t border-border-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
