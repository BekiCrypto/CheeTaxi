/**
 * OpenTelemetry tracing setup. Exports OTLP traces to the configured
 * OTEL_EXPORTER_OTLP_ENDPOINT (e.g. Honeycomb, Tempo, Jaeger).
 *
 * Call initTracing() BEFORE importing any NestJS modules — typically the
 * first line of main.ts. This ensures all instrumentations hook in correctly.
 *
 * Note: Disabled if OTEL_EXPORTER_OTLP_ENDPOINT is not set.
 */

let initialized = false;

export function initTracing(): boolean {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return false;

  try {
    // Lazy-load to avoid build errors when packages aren't installed
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

    const traceExporter = new OTLPTraceExporter({ url: endpoint });

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]:
          process.env.OTEL_SERVICE_NAME ?? 'cheetaxi-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
          process.env.NODE_ENV ?? 'development',
      }),
      traceExporter,
      instrumentations: [
        new HttpInstrumentation({
          ignoreIncomingRequestHook: (req: any) =>
            req.url === '/health' || req.url === '/health/ready' || req.url === '/metrics',
        }),
      ],
    });

    sdk.start();
    initialized = true;
    return true;
  } catch (err) {
    // OpenTelemetry packages not installed — tracing disabled
    return false;
  }
}

export async function shutdownTracing(): Promise<void> {
  // SDK shutdown handled by process SIGTERM handler in main.ts
}
