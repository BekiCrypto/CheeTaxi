import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { QueueService } from './queueService.js';
import { LocationService } from './locationService.js';

interface RequestMetric {
  durationMs: number;
  timestamp: number;
}

export class MetricsService {
  private static requestCounts = new Map<string, number>(); // "METHOD path status" -> count
  private static latencies: number[] = [];
  private static MAX_LATENCY_SAMPLES = 5000;
  private static rateLimitBlocks = 0;

  /**
   * Express middleware to capture latency and status codes
   */
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const durationMs = Date.now() - start;
        const routeKey = `${req.method} ${req.baseUrl || req.path} ${res.statusCode}`;

        this.requestCounts.set(routeKey, (this.requestCounts.get(routeKey) || 0) + 1);

        if (res.statusCode === 429) {
          this.rateLimitBlocks += 1;
        }

        this.latencies.push(durationMs);
        if (this.latencies.length > this.MAX_LATENCY_SAMPLES) {
          this.latencies.shift(); // rolling window
        }
      });

      next();
    };
  }

  static recordRateLimitBlock() {
    this.rateLimitBlocks += 1;
  }

  /**
   * Calculate percentile from captured latency samples
   */
  private static getPercentile(p: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Renders Prometheus text exposition format
   */
  static renderPrometheusMetrics(): string {
    const p50 = this.getPercentile(50);
    const p95 = this.getPercentile(95);
    const p99 = this.getPercentile(99);

    let activeRides = 0;
    let onlineDrivers = 0;
    let busyDrivers = 0;

    try {
      const rideRow = db.prepare(`SELECT count(*) as count FROM rides WHERE status IN ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS')`).get() as any;
      const onlineRow = db.prepare(`SELECT count(*) as count FROM drivers WHERE is_online = 1`).get() as any;
      const busyRow = db.prepare(`SELECT count(*) as count FROM drivers WHERE is_busy = 1`).get() as any;
      activeRides = rideRow?.count || 0;
      onlineDrivers = onlineRow?.count || 0;
      busyDrivers = busyRow?.count || 0;
    } catch (e) {}

    const qStats = QueueService.getStats();
    const mem = process.memoryUsage();

    const lines: string[] = [
      '# HELP chebelew_http_requests_total Total number of HTTP requests processed',
      '# TYPE chebelew_http_requests_total counter',
    ];

    for (const [key, count] of this.requestCounts.entries()) {
      const [method, path, status] = key.split(' ');
      lines.push(`chebelew_http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
    }

    lines.push(
      '',
      '# HELP chebelew_http_request_duration_ms HTTP request latency percentiles in milliseconds',
      '# TYPE chebelew_http_request_duration_ms gauge',
      `chebelew_http_request_duration_ms{quantile="0.5"} ${p50}`,
      `chebelew_http_request_duration_ms{quantile="0.95"} ${p95}`,
      `chebelew_http_request_duration_ms{quantile="0.99"} ${p99}`,
      '',
      '# HELP chebelew_active_rides Number of currently active in-flight rides',
      '# TYPE chebelew_active_rides gauge',
      `chebelew_active_rides ${activeRides}`,
      '',
      '# HELP chebelew_online_drivers Number of drivers currently marked online',
      '# TYPE chebelew_online_drivers gauge',
      `chebelew_online_drivers ${onlineDrivers}`,
      '',
      '# HELP chebelew_busy_drivers Number of drivers currently locked in an active trip',
      '# TYPE chebelew_busy_drivers gauge',
      `chebelew_busy_drivers ${busyDrivers}`,
      '',
      '# HELP chebelew_rate_limit_blocks_total Total number of requests blocked by rate limiters',
      '# TYPE chebelew_rate_limit_blocks_total counter',
      `chebelew_rate_limit_blocks_total ${this.rateLimitBlocks}`,
      '',
      '# HELP chebelew_queue_jobs_pending Background queue pending jobs',
      '# TYPE chebelew_queue_jobs_pending gauge',
      `chebelew_queue_jobs_pending ${qStats.pending}`,
      '',
      '# HELP chebelew_queue_jobs_dead_letter Background queue dead letter failed jobs',
      '# TYPE chebelew_queue_jobs_dead_letter gauge',
      `chebelew_queue_jobs_dead_letter ${qStats.deadLetter}`,
      '',
      '# HELP chebelew_memory_heap_used_bytes Node.js process heap memory used',
      '# TYPE chebelew_memory_heap_used_bytes gauge',
      `chebelew_memory_heap_used_bytes ${mem.heapUsed}`,
      '',
      '# HELP chebelew_in_memory_locations_total Cached driver live locations',
      '# TYPE chebelew_in_memory_locations_total gauge',
      `chebelew_in_memory_locations_total ${LocationService.getStoreSize()}`
    );

    return lines.join('\n') + '\n';
  }
}
