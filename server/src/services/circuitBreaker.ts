export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of consecutive failures to open circuit (default: 5)
  cooldownPeriodMs?: number; // Time in ms to wait before attempting half-open probe (default: 15000)
  timeoutMs?: number;        // Call timeout in ms (default: 5000)
}

export class CircuitBreaker {
  private static circuits = new Map<string, CircuitBreaker>();

  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  private failureThreshold: number;
  private cooldownPeriodMs: number;
  private timeoutMs: number;

  constructor(public readonly name: string, options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.cooldownPeriodMs = options?.cooldownPeriodMs ?? 15000;
    this.timeoutMs = options?.timeoutMs ?? 5000;
  }

  static get(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    let cb = this.circuits.get(name);
    if (!cb) {
      cb = new CircuitBreaker(name, options);
      this.circuits.set(name, cb);
    }
    return cb;
  }

  static getAllStates(): Record<string, { state: CircuitState; failures: number }> {
    const states: Record<string, { state: CircuitState; failures: number }> = {};
    for (const [name, cb] of this.circuits.entries()) {
      states[name] = { state: cb.getState(), failures: cb.failureCount };
    }
    return states;
  }

  getState(): CircuitState {
    const now = Date.now();
    if (this.state === 'OPEN' && now >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      if (fallback) {
        return fallback();
      }
      throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN - request failed fast.`);
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`[CircuitBreaker:${this.name}] Call timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        ),
      ]);

      // Success in CLOSED or HALF_OPEN
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.cooldownPeriodMs;
      console.warn(`[CircuitBreaker:${this.name}] Tripped to OPEN! Cool-down period: ${this.cooldownPeriodMs}ms`);
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}
