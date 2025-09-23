/**
 * Performance monitoring utility for the job board
 * Helps track loading times and identify bottlenecks
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  startTimer(name: string): void {
    if (!this.enabled) return;

    const existingMetric = this.metrics.find(m => m.name === name && !m.endTime);
    if (existingMetric) {
      console.warn(`Timer ${name} is already running`);
      return;
    }

    this.metrics.push({
      name,
      startTime: performance.now()
    });
  }

  endTimer(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.find(m => m.name === name && !m.endTime);
    if (!metric) {
      console.warn(`Timer ${name} not found or already ended`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`);
    return metric.duration;
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.find(m => m.name === name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  logSummary(): void {
    if (!this.enabled) return;

    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    if (completedMetrics.length === 0) {
      console.log('📊 No performance metrics recorded');
      return;
    }

    const totalTime = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageTime = totalTime / completedMetrics.length;

    console.log('📊 Performance Summary:');
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average time: ${averageTime.toFixed(2)}ms`);
    console.log(`   Metrics count: ${completedMetrics.length}`);

    // Group by category for better insights
    const categories = {
      'Data Loading': ['data-load', 'json-parse', 'cache-check'],
      'Search': ['search-init', 'search-execution', 'search-transform'],
      'UI Rendering': ['component-render', 'list-render', 'map-render'],
      'Network': ['fetch-request', 'cache-hit']
    };

    Object.entries(categories).forEach(([category, metricNames]) => {
      const categoryMetrics = completedMetrics.filter(m =>
        metricNames.some(name => m.name.toLowerCase().includes(name.toLowerCase()))
      );

      if (categoryMetrics.length > 0) {
        const categoryTotal = categoryMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
        console.log(`   ${category}: ${categoryTotal.toFixed(2)}ms (${categoryMetrics.length} operations)`);
      }
    });
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Utility method to measure async functions
  async measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await asyncFn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  // Utility method to measure sync functions
  measureSync<T>(name: string, syncFn: () => T): T {
    this.startTimer(name);
    try {
      const result = syncFn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Development helper - automatically log performance metrics
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log performance summary when page unloads
  window.addEventListener('beforeunload', () => {
    performanceMonitor.logSummary();
  });

  // Log metrics every 10 seconds in development
  setInterval(() => {
    if (performanceMonitor.getAllMetrics().length > 0) {
      console.log('📊 Current metrics:', performanceMonitor.getAllMetrics());
    }
  }, 10000);
}
