/**
 * CheeTaxi JavaScript / TypeScript SDK
 *
 * Official typed client for the CheeTaxi REST API.
 *
 * @example
 * ```ts
 * import { CheeTaxiClient } from '@cheetaxi/sdk';
 *
 * const client = new CheeTaxiClient({
 *   baseUrl: 'https://api.cheetaxi.africa',
 *   apiKey: 'your-api-key', // or accessToken from /auth/login
 * });
 *
 * // Request a trip
 * const trip = await client.trips.request({
 *   pickup: { lat: 9.0195, lng: 38.7525, address: 'Bole' },
 *   dropoff: { lat: 9.0112, lng: 38.7623, address: 'Meskel Square' },
 *   mode: 'TAXI',
 *   vehicleType: 'TAXI',
 *   paymentMethod: 'CASH',
 * });
 *
 * // Subscribe to webhooks
 * client.webhooks.verifySignature(body, signature, secret);
 * ```
 */

export interface CheeTaxiConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  timeoutMs?: number;
}

export interface TripRequestInput {
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  stops?: Array<{ lat: number; lng: number; address?: string }>;
  mode: string;
  vehicleType: string;
  paymentMethod: string;
  scheduledFor?: string;
  promoCode?: string;
  notes?: string;
  passengerCount?: number;
}

export interface Trip {
  id: string;
  publicId: string;
  status: string;
  mode: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalFare: number;
  currency: string;
  requestedAt: string;
  completedAt?: string;
  driver?: { user: { firstName: string; lastName: string }; currentVehicle?: { plateNumber: string } };
}

export interface FareQuote {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  promoDiscount: number;
  taxAmount: number;
  totalFare: number;
  currency: string;
  distanceMeters: number;
  durationSeconds: number;
}

export class CheeTaxiClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly accessToken?: string;
  private readonly timeoutMs: number;

  readonly trips: TripsResource;
  readonly pricing: PricingResource;
  readonly subscriptions: SubscriptionsResource;
  readonly wallets: WalletsResource;
  readonly webhooks: WebhooksResource;
  readonly health: HealthResource;

  constructor(config: CheeTaxiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.accessToken = config.accessToken;
    this.timeoutMs = config.timeoutMs ?? 30000;

    this.trips = new TripsResource(this);
    this.pricing = new PricingResource(this);
    this.subscriptions = new SubscriptionsResource(this);
    this.wallets = new WalletsResource(this);
    this.webhooks = new WebhooksResource(this);
    this.health = new HealthResource(this);
  }

  /** Set or update the access token (e.g. after refreshing). */
  setAccessToken(token: string): void {
    (this as any).accessToken = token;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const json = await res.json() as { success: boolean; data: T | null; error: { message: string } | null };
      if (!res.ok || !json.success) {
        throw new CheeTaxiError(json?.error?.message ?? `HTTP ${res.status}`, res.status, json?.error);
      }
      return json.data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  getAuthToken(): string | undefined { return this.accessToken; }
}

export class CheeTaxiError extends Error {
  constructor(message: string, public statusCode: number, public details?: unknown) {
    super(message);
    this.name = 'CheeTaxiError';
  }
}

// ─── Resources ──────────────────────────────────────────────────────────────

class TripsResource {
  constructor(private client: CheeTaxiClient) {}

  async request(input: TripRequestInput): Promise<{ tripId: string; publicId: string; estimate: FareQuote; shareToken: string }> {
    return this.client.request('POST', '/trips/request', input);
  }

  async get(tripId: string): Promise<Trip> {
    return this.client.request('GET', `/trips/${tripId}`);
  }

  async cancel(tripId: string, reason: string, by: 'passenger' | 'driver' | 'system' = 'passenger'): Promise<Trip> {
    return this.client.request('POST', `/trips/${tripId}/cancel`, { reason, by });
  }

  async listMyPassengerTrips(page = 1, limit = 20): Promise<{ items: Trip[]; total: number; page: number; limit: number }> {
    return this.client.request('GET', `/trips/me/passenger?page=${page}&limit=${limit}`);
  }

  async accept(tripId: string): Promise<Trip> {
    return this.client.request('POST', `/trips/${tripId}/accept`);
  }
  async arrive(tripId: string): Promise<Trip> {
    return this.client.request('POST', `/trips/${tripId}/arrive`);
  }
  async start(tripId: string): Promise<Trip> {
    return this.client.request('POST', `/trips/${tripId}/start`);
  }
  async complete(tripId: string, data?: { actualDistanceMeters?: number; actualDurationSeconds?: number }): Promise<Trip> {
    return this.client.request('POST', `/trips/${tripId}/complete`, data);
  }

  async share(token: string): Promise<Partial<Trip>> {
    return this.client.request('GET', `/trips/share/${token}`);
  }
}

class PricingResource {
  constructor(private client: CheeTaxiClient) {}

  async quote(input: {
    vehicleType: string;
    pickupLat: number; pickupLng: number; pickupAddress?: string;
    dropoffLat: number; dropoffLng: number; dropoffAddress?: string;
    city?: string; country?: string; promoCode?: string;
  }): Promise<FareQuote> {
    const qs = new URLSearchParams();
    Object.entries(input).forEach(([k, v]) => v != null && qs.set(k, String(v)));
    return this.client.request('GET', `/pricing/quote?${qs}`);
  }

  async listTiers(): Promise<any[]> {
    return this.client.request('GET', '/pricing/tiers');
  }
}

class SubscriptionsResource {
  constructor(private client: CheeTaxiClient) {}

  async listPlans(): Promise<any[]> {
    return this.client.request('GET', '/subscriptions/plans');
  }

  async getMyActive(): Promise<any> {
    return this.client.request('GET', '/subscriptions/me/active');
  }

  async purchase(data: { planCode: string; paymentMethod: string; autoRenew?: boolean; driverIds?: string[] }): Promise<any> {
    return this.client.request('POST', '/subscriptions/purchase', data);
  }
}

class WalletsResource {
  constructor(private client: CheeTaxiClient) {}

  async getMyWallet(): Promise<{ id: string; balance: string; currency: string }> {
    return this.client.request('GET', '/wallets/me');
  }

  async topUp(amount: number, currency: string, provider: string): Promise<void> {
    return this.client.request('POST', '/wallets/me/topup', { amount, currency, provider });
  }

  async listTransactions(page = 1, limit = 20): Promise<{ items: any[]; total: number }> {
    return this.client.request('GET', `/wallets/me/transactions?page=${page}&limit=${limit}`);
  }
}

class WebhooksResource {
  constructor(private client: CheeTaxiClient) {}

  async createEndpoint(data: { url: string; events: string[]; description?: string }): Promise<{ id: string; secret: string }> {
    return this.client.request('POST', '/webhooks/endpoints', data);
  }

  async listEndpoints(): Promise<any[]> {
    return this.client.request('GET', '/webhooks/endpoints');
  }

  async deleteEndpoint(id: string): Promise<void> {
    return this.client.request('DELETE', `/webhooks/endpoints/${id}`);
  }

  /**
   * Verify a webhook signature. Call this in your webhook handler before
   * trusting the payload.
   *
   * @example
   * ```ts
   * import crypto from 'crypto';
   *
   * app.post('/webhook', (req, res) => {
   *   const sig = req.headers['x-cheetaxi-signature'] as string;
   *   const body = JSON.stringify(req.body);
   *   if (!client.webhooks.verifySignature(body, sig, SECRET)) {
   *     return res.status(401).send('invalid signature');
   *   }
   *   // handle event
   *   res.status(200).send('ok');
   * });
   * ```
   */
  verifySignature(body: string, signature: string, secret: string): boolean {
    const expected = cryptoHmacSha256(body, secret);
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  }
}

class HealthResource {
  constructor(private client: CheeTaxiClient) {}

  async liveness(): Promise<{ status: string; timestamp: string }> {
    return this.client.request('GET', '/health');
  }

  async readiness(): Promise<{
    status: string;
    timestamp: string;
    checks: Record<string, { status: string; latencyMs?: number }>;
  }> {
    return this.client.request('GET', '/health/ready');
  }
}

// Use Web Crypto API if available (Node 20+ / browsers), else fallback
function cryptoHmacSha256(body: string, secret: string): string {
  // Lazy import to support both browser and Node
  try {
    // Node.js path
    const { createHmac } = require('crypto');
    return createHmac('sha256', secret).update(body).digest('hex');
  } catch {
    // Browser path — synchronous fallback (use SubtleCrypto for true async)
    throw new Error('Web Crypto async verification not implemented synchronously — use Node.js or provide your own verify.');
  }
}

export default CheeTaxiClient;
