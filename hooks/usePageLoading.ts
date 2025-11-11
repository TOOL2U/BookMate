/**
 * Hook to coordinate page loading with data fetching
 * Similar to useLoadingState but for individual pages
 * Ensures loading screen stays visible until data is ready
 */

import { useState, useEffect } from 'react';

interface UsePageLoadingOptions {
  minLoadingTime?: number; // Minimum time to show loading screen (ms)
}

export function usePageLoading(options: UsePageLoadingOptions = {}) {
  const { minLoadingTime = 500 } = options; // Default 500ms minimum
  
  const [isMinTimeComplete, setIsMinTimeComplete] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Combined loading state - only false when BOTH are ready
  const isLoading = !isMinTimeComplete || !isDataReady;
  
  useEffect(() => {
    // Start minimum loading timer
    const timer = setTimeout(() => {
      setIsMinTimeComplete(true);
      console.log('✅ Page loading animation complete');
    }, minLoadingTime);
    
    return () => clearTimeout(timer);
  }, [minLoadingTime]);
  
  // Log when both conditions are met
  useEffect(() => {
    if (isMinTimeComplete && isDataReady) {
      console.log('✅ Page ready to display - animation done & data loaded');
    }
  }, [isMinTimeComplete, isDataReady]);
  
  // Reset when component unmounts or remounts
  useEffect(() => {
    return () => {
      setIsMinTimeComplete(false);
      setIsDataReady(false);
    };
  }, []);
  
  return {
    isLoading,
    isMinTimeComplete,
    isDataReady,
    setDataReady: setIsDataReady
  };
}
