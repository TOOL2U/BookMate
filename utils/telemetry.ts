/**
 * Telemetry tracking for Phase 2
 * Lightweight metrics for admin health dashboard
 */

interface Metric {
  timestamp: string;
  name: string;
  value: number;
  metadata?: Record<string, any>;
}

// In-memory store (replace with Redis/DB for production)
const metrics: Metric[] = [];
const MAX_METRICS = 1000;

export function trackMetric(name: string, value: number, metadata?: Record<string, any>): void {
  metrics.push({
    timestamp: new Date().toISOString(),
    name,
    value,
    metadata
  });

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }
}

export function getMetrics(name?: string, since?: Date): Metric[] {
  let filtered = [...metrics];

  if (name) {
    filtered = filtered.filter(m => m.name === name);
  }

  if (since) {
    filtered = filtered.filter(m => new Date(m.timestamp) >= since);
  }

  return filtered;
}

export function getMetricStats(name: string, since?: Date) {
  const data = getMetrics(name, since);
  
  if (data.length === 0) {
    return null;
  }

  const values = data.map(m => m.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    count: data.length,
    sum,
    avg,
    min,
    max,
    latest: data[data.length - 1]
  };
}

export function clearMetrics(): void {
  metrics.length = 0;
}
