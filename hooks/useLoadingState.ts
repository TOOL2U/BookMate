/**
 * Hook to coordinate loading screen with data fetching
 * Ensures loading screen stays visible until BOTH:
 * 1. Minimum animation time has passed (brand display)
 * 2. Data has been fetched and is ready
 */

import { useState, useEffect } from 'react';

interface UseLoadingStateOptions {
  minLoadingTime?: number; // Minimum time to show loading screen (ms)
  onDataReady?: () => void; // Callback when data is ready
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { minLoadingTime = 2000 } = options;
  
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Combined loading state - only false when BOTH are ready
  const isLoading = !isAnimationComplete || !isDataReady;
  
  useEffect(() => {
    // Start minimum loading timer
    const timer = setTimeout(() => {
      setIsAnimationComplete(true);
      console.log('✅ Loading animation complete');
    }, minLoadingTime);
    
    return () => clearTimeout(timer);
  }, [minLoadingTime]);
  
  // Log when both conditions are met
  useEffect(() => {
    if (isAnimationComplete && isDataReady) {
      console.log('✅ Loading screen ready to hide - animation done & data loaded');
    }
  }, [isAnimationComplete, isDataReady]);
  
  return {
    isLoading,
    isAnimationComplete,
    isDataReady,
    setDataReady: setIsDataReady
  };
}
