/**
 * Prometheus-compatible metrics collection.
 *
 * Exposes a /metrics endpoint in the Prometheus text format. We use the
 * `prom-client` library — added in package.json. The metrics below cover
 * the four golden signals: latency, traffic, errors, saturation.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('MetricsService');
  private readonly registry: Registry;

  // ─── Counters (cumulative) ──────────────────────────────────────────────
  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestErrorsTotal: Counter<string>;
  readonly tripsRequested: Counter<string>;
  readonly tripsCompleted: Counter<string>;
  readonly tripsCancelled: Counter<string>;
  readonly paymentsProcessed: Counter<string>;
  readonly paymentsFailed: Counter<string>;
  readonly sosTriggered: Counter<string>;
  readonly otpSent: Counter<string>;

  // ─── Histograms (latency distributions) ─────────────────────────────────
  readonly httpRequestDurationSeconds: Histogram<string>;
  readonly dbQueryDurationSeconds: Histogram<string>;

  // ─── Gauges (point-in-time values) ──────────────────────────────────────
  readonly driversOnline: Gauge<string>;
  readonly tripsInProgress: Gauge<string>;
  readonly activeSubscriptions: Gauge<string>;
  readonly websocketConnections: Gauge<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry, prefix: 'cheetaxi_' });

    this.httpRequestsTotal = new Counter({
      name: 'cheetaxi_http_requests_total',
      help: 'Total HTTP requests handled',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestErrorsTotal = new Counter({
      name: 'cheetaxi_http_request_errors_total',
      help: 'HTTP requests that returned 5xx',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    this.tripsRequested = new Counter({
      name: 'cheetaxi_trips_requested_total',
      help: 'Total trips requested',
      registers: [this.registry],
    });

    this.tripsCompleted = new Counter({
      name: 'cheetaxi_trips_completed_total',
      help: 'Total trips completed successfully',
      registers: [this.registry],
    });

    this.tripsCancelled = new Counter({
      name: 'cheetaxi_trips_cancelled_total',
      help: 'Total trips cancelled',
      labelNames: ['by'],
      registers: [this.registry],
    });

    this.paymentsProcessed = new Counter({
      name: 'cheetaxi_payments_processed_total',
      help: 'Payments successfully processed',
      labelNames: ['provider', 'method'],
      registers: [this.registry],
    });

    this.paymentsFailed = new Counter({
      name: 'cheetaxi_payments_failed_total',
      help: 'Payments that failed',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.sosTriggered = new Counter({
      name: 'cheetaxi_sos_triggered_total',
      help: 'Total SOS alerts triggered',
      registers: [this.registry],
    });

    this.otpSent = new Counter({
      name: 'cheetaxi_otp_sent_total',
      help: 'Total OTP codes sent',
      labelNames: ['purpose', 'provider'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'cheetaxi_http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.dbQueryDurationSeconds = new Histogram({
      name: 'cheetaxi_db_query_duration_seconds',
      help: 'Database query latency in seconds',
      labelNames: ['model', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.driversOnline = new Gauge({
      name: 'cheetaxi_drivers_online',
      help: 'Current number of online drivers',
      registers: [this.registry],
    });

    this.tripsInProgress = new Gauge({
      name: 'cheetaxi_trips_in_progress',
      help: 'Current trips in progress',
      registers: [this.registry],
    });

    this.activeSubscriptions = new Gauge({
      name: 'cheetaxi_active_subscriptions',
      help: 'Active driver subscriptions',
      registers: [this.registry],
    });

    this.websocketConnections = new Gauge({
      name: 'cheetaxi_websocket_connections',
      help: 'Current WebSocket connections',
      registers: [this.registry],
    });

    this.logger.log('MetricsService initialized');
  }

  /** Returns the Prometheus-format metrics text for /metrics. */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /** Updates gauges — called periodically by a scheduled task. */
  setDriversOnline(count: number): void {
    this.driversOnline.set(count);
  }

  setTripsInProgress(count: number): void {
    this.tripsInProgress.set(count);
  }

  setActiveSubscriptions(count: number): void {
    this.activeSubscriptions.set(count);
  }

  setWebsocketConnections(count: number): void {
    this.websocketConnections.set(count);
  }
}
