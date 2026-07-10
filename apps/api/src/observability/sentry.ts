/**
 * Sentry initialization for production error tracking.
 * Activate by setting SENTRY_DSN env var.
 *
 * In production, call initSentry() once during bootstrap (main.ts).
 * Errors thrown in any controller or service are automatically captured.
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

let initialized = false;

export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return false;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.APP_VERSION ?? 'cheetaxi@1.0.0',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1),
    integrations: [nodeProfilingIntegration()],
    beforeSend(event) {
      // Scrub sensitive fields before sending
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  initialized = true;
  return true;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export function captureException(err: unknown): void {
  if (initialized) Sentry.captureException(err);
}

export function captureMessage(msg: string, level: Sentry.SeverityLevel = 'info'): void {
  if (initialized) Sentry.captureMessage(msg, level);
}

export async function flushSentry(timeoutMillis = 2000): Promise<void> {
  if (initialized) await Sentry.close(timeoutMillis);
}
