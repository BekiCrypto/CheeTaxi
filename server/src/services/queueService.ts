import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';

export interface QueueJob<T = any> {
  id: string;
  type: string;
  payload: T;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
  nextRunAt: number;
  lastError?: string;
  createdAt: string;
  completedAt?: string;
}

export type JobHandler<T = any> = (job: QueueJob<T>) => Promise<void>;

export class QueueService {
  private static handlers = new Map<string, JobHandler>();
  private static workerIntervalTimer: NodeJS.Timeout | null = null;
  private static isProcessing = false;

  /**
   * Initialize SQLite persistent job queue table and worker loop
   */
  static init() {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS job_queue (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          attempts INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 3,
          backoff_ms INTEGER NOT NULL DEFAULT 2000,
          next_run_at INTEGER NOT NULL,
          last_error TEXT,
          created_at TEXT NOT NULL,
          completed_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_jobs_status_next ON job_queue(status, next_run_at);
      `);
    } catch (err) {
      console.error('[QueueService] Table init error:', err);
    }

    if (!this.workerIntervalTimer) {
      this.workerIntervalTimer = setInterval(() => {
        this.processBatch();
      }, 1000).unref(); // Process pending jobs every second
    }

    this.registerDefaultHandlers();
  }

  /**
   * Register a job type handler
   */
  static registerHandler<T = any>(type: string, handler: JobHandler<T>) {
    this.handlers.set(type, handler);
  }

  /**
   * Enqueue a job with idempotency and retry parameters
   */
  static enqueue<T = any>(
    type: string,
    payload: T,
    options?: { id?: string; maxAttempts?: number; backoffMs?: number; delayMs?: number }
  ): string {
    const id = options?.id || `job_${uuidv4().substring(0, 8)}`;
    const maxAttempts = options?.maxAttempts || 3;
    const backoffMs = options?.backoffMs || 2000;
    const nextRunAt = Date.now() + (options?.delayMs || 0);
    const now = new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO job_queue (
          id, type, payload_json, status, attempts, max_attempts, backoff_ms, next_run_at, created_at
        ) VALUES (
          @id, @type, @payloadJson, 'PENDING', 0, @maxAttempts, @backoffMs, @nextRunAt, @createdAt
        )
        ON CONFLICT(id) DO NOTHING
      `).run({
        id,
        type,
        payloadJson: JSON.stringify(payload),
        maxAttempts,
        backoffMs,
        nextRunAt,
        createdAt: now,
      });
    } catch (e) {
      console.error('[QueueService] Enqueue error:', e);
    }

    return id;
  }

  /**
   * Poll and execute a batch of ready jobs
   */
  private static async processBatch() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = Date.now();
      const readyJobs = db.prepare(`
        SELECT * FROM job_queue
        WHERE status = 'PENDING' AND next_run_at <= ?
        ORDER BY next_run_at ASC
        LIMIT 10
      `).all(now) as any[];

      for (const row of readyJobs) {
        await this.executeJob(row);
      }
    } catch (err) {
      console.error('[QueueService] Batch loop error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private static async executeJob(row: any) {
    const handler = this.handlers.get(row.type);
    const currentAttempts = row.attempts + 1;
    const nowIso = new Date().toISOString();

    if (!handler) {
      console.warn(`[QueueService] No registered handler for job type: ${row.type}`);
      db.prepare(`
        UPDATE job_queue
        SET status = 'FAILED', last_error = 'NO_HANDLER_REGISTERED', completed_at = ?
        WHERE id = ?
      `).run(nowIso, row.id);
      return;
    }

    // Mark as processing
    db.prepare(`
      UPDATE job_queue
      SET status = 'PROCESSING', attempts = ?
      WHERE id = ?
    `).run(currentAttempts, row.id);

    const job: QueueJob = {
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload_json),
      status: 'PROCESSING',
      attempts: currentAttempts,
      maxAttempts: row.max_attempts,
      backoffMs: row.backoff_ms,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
    };

    try {
      await handler(job);

      // Success
      db.prepare(`
        UPDATE job_queue
        SET status = 'COMPLETED', completed_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), row.id);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      if (currentAttempts >= row.max_attempts) {
        // Move to DEAD_LETTER queue for dead-letter analysis
        db.prepare(`
          UPDATE job_queue
          SET status = 'DEAD_LETTER', last_error = ?, completed_at = ?
          WHERE id = ?
        `).run(errorMsg, new Date().toISOString(), row.id);
        console.error(`[QueueService] Job ${row.id} moved to DEAD_LETTER after ${currentAttempts} attempts: ${errorMsg}`);
      } else {
        // Calculate exponential backoff with jitter
        const jitter = Math.random() * 500;
        const delay = row.backoff_ms * Math.pow(2, currentAttempts - 1) + jitter;
        const nextRun = Date.now() + delay;

        db.prepare(`
          UPDATE job_queue
          SET status = 'PENDING', next_run_at = ?, last_error = ?
          WHERE id = ?
        `).run(Math.floor(nextRun), errorMsg, row.id);
      }
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  static getStats() {
    try {
      const pending = db.prepare("SELECT count(*) as count FROM job_queue WHERE status = 'PENDING'").get() as any;
      const processing = db.prepare("SELECT count(*) as count FROM job_queue WHERE status = 'PROCESSING'").get() as any;
      const deadLetter = db.prepare("SELECT count(*) as count FROM job_queue WHERE status = 'DEAD_LETTER'").get() as any;
      const completed = db.prepare("SELECT count(*) as count FROM job_queue WHERE status = 'COMPLETED'").get() as any;
      return {
        pending: pending?.count || 0,
        processing: processing?.count || 0,
        deadLetter: deadLetter?.count || 0,
        completed: completed?.count || 0,
      };
    } catch (e) {
      return { pending: 0, processing: 0, deadLetter: 0, completed: 0 };
    }
  }

  /**
   * Register system default background handlers
   */
  private static registerDefaultHandlers() {
    // 1. Partner Webhook Delivery
    this.registerHandler('webhook:partner', async (job) => {
      const { url, payload } = job.payload;
      if (!url) return;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }
    });

    // 2. SMS Gateway Delivery
    this.registerHandler('notification:sms', async (job) => {
      const { phone, message } = job.payload;
      // In production, calls Ethio Telecom SMS gateway
      if (!phone || !message) throw new Error('Missing phone or message');
    });

    // 3. Analytics Aggregation
    this.registerHandler('analytics:aggregate', async (_job) => {
      // Background aggregations
    });
  }

  static stop() {
    if (this.workerIntervalTimer) {
      clearInterval(this.workerIntervalTimer);
      this.workerIntervalTimer = null;
    }
  }
}

// Auto-initialize queue table and worker
QueueService.init();
