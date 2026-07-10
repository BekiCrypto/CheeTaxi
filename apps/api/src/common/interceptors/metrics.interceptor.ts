import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../observability/metrics.service';

/**
 * Records HTTP request count + latency in Prometheus.
 * Mounted globally in main.ts.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method } = request;
    // Use the matched route pattern if available (avoids high-cardinality URLs)
    const route = request.route?.path ?? request.url?.split('?')[0] ?? 'unknown';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const status = String(response.statusCode);
          const durationSeconds = (Date.now() - start) / 1000;
          this.metrics.httpRequestsTotal.labels(method, route, status).inc();
          this.metrics.httpRequestDurationSeconds.labels(method, route, status).observe(durationSeconds);
          if (response.statusCode >= 500) {
            this.metrics.httpRequestErrorsTotal.labels(method, route).inc();
          }
        },
        error: () => {
          const durationSeconds = (Date.now() - start) / 1000;
          this.metrics.httpRequestsTotal.labels(method, route, '500').inc();
          this.metrics.httpRequestDurationSeconds.labels(method, route, '500').observe(durationSeconds);
          this.metrics.httpRequestErrorsTotal.labels(method, route).inc();
        },
      }),
    );
  }
}
