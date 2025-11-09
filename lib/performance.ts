// Performance monitoring utilities

interface PerformanceMetrics {
  pageName: string;
  loadTime: number;
  timestamp: Date;
}

const performanceLog: PerformanceMetrics[] = [];

export function startPerformanceTimer(pageName: string): () => number {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${pageName} loaded in ${loadTime.toFixed(0)}ms`);
      
      // Store for analytics
      performanceLog.push({
        pageName,
        loadTime,
        timestamp: new Date(),
      });
      
      // Performance warnings
      if (loadTime > 2000) {
        console.warn(`[Performance] ⚠️ ${pageName} took ${loadTime.toFixed(0)}ms (> 2s threshold)`);
      }
    }
    
    return loadTime;
  };
}

export function getPerformanceMetrics(): PerformanceMetrics[] {
  return [...performanceLog];
}

export function clearPerformanceMetrics(): void {
  performanceLog.length = 0;
}

export function logPerformanceSummary(): void {
  if (performanceLog.length === 0) {
    console.log('[Performance] No metrics recorded yet');
    return;
  }
  
  console.table(
    performanceLog.map((metric) => ({
      Page: metric.pageName,
      'Load Time (ms)': metric.loadTime.toFixed(0),
      Time: metric.timestamp.toLocaleTimeString(),
    }))
  );
  
  const avgLoadTime =
    performanceLog.reduce((sum, m) => sum + m.loadTime, 0) / performanceLog.length;
  
  console.log(`[Performance] Average load time: ${avgLoadTime.toFixed(0)}ms`);
}

// Hook for easy performance tracking in components
export function usePerformanceTracking(pageName: string) {
  if (typeof window === 'undefined') return;
  
  const endTimer = startPerformanceTimer(pageName);
  
  return () => {
    const loadTime = endTimer();
    
    // Send to analytics service (future implementation)
    // Example: trackPagePerformance(pageName, loadTime);
    
    return loadTime;
  };
}
