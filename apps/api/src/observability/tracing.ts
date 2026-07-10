/**
 * OpenTelemetry tracing setup. Exports OTLP traces to the configured
 * OTEL_EXPORTER_OTLP_ENDPOINT (e.g. Honeycomb, Tempo, Jaeger).
 *
 * Call initTracing() BEFORE importing any NestJS modules — typically the
 * first line of main.ts. This ensures all instrumentations (HTTP, Prisma,
 * Redis, gRPC) hook in correctly.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

let sdk: NodeSDK | null = null;

export function initTracing(): boolean {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return false;

  const traceExporter = new OTLPTraceExporter({ url: endpoint });
  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ?? 'cheetaxi-api',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NODE_ENV ?? 'development',
    }),
    traceExporter,
    spanProcessor: new SimpleSpanProcessor(traceExporter),
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req) =>
          req.url === '/health' || req.url === '/health/ready' || req.url === '/metrics',
      }),
      new ExpressInstrumentation(),
    ],
  });

  sdk.start();
  return true;
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) await sdk.shutdown();
}
