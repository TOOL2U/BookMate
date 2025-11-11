'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if this is the initial load
    const hasLoadedBefore = sessionStorage.getItem('bookmate-loaded');
    
    if (hasLoadedBefore) {
      // Skip loading screen on subsequent navigations
      setIsLoading(false);
    } else {
      // Show loading screen on first load
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('bookmate-loaded', 'true');
      }, 2000); // 2 seconds to show the brand
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {isLoading ? <LoadingScreen /> : children}
    </>
  );
};

export default ClientLayout;
