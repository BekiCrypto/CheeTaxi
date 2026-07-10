import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WS_EVENTS, type SupportedLanguage } from '@cheetaxi/shared';
import { PrismaService } from '../common/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
  driverId?: string;
  passengerId?: string;
  language?: SupportedLanguage;
}

/**
 * Realtime gateway — handles all live communication:
 *
 * Channels:
 *   • user:<userId>            — personal notifications, wallet updates
 *   • trip:<tripId>            — trip lifecycle events (passenger + driver + dispatchers)
 *   • driver:offers:<driverId> — trip offers directed at a specific driver
 *   • dispatcher:city:<city>   — live driver positions per city (dispatchers only)
 *
 * Auth:
 *   Client sends `auth` event with { token } immediately after connect.
 *   All subsequent events require authenticated socket.
 *
 * Events emitted by server (typed in @cheetaxi/shared WS_EVENTS):
 *   trip.requested, trip.assigned, trip.arriving, trip.arrived,
 *   trip.started, trip.completed, trip.cancelled,
 *   driver.location, driver.status,
 *   driver.offer, driver.offer.response,
 *   notification, sos.triggered, wallet.updated
 */
@WebSocketGateway({
  namespace: 'realtime',
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  },
  transports: ['websocket'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger('RealtimeGateway');

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized on /realtime');
  }

  async handleConnection(client: AuthenticatedSocket) {
    // Token can be passed as query param (mobile) or auth handshake (web)
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);

    if (!token) {
      this.logger.warn(`Rejecting connection ${client.id} — no token`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify(token) as {
        sub: string;
        phone: string;
        role: string;
      };
      client.userId = payload.sub;
      client.role = payload.role;

      // Look up passenger/driver ids for fast routing
      if (payload.role === 'DRIVER') {
        const driver = await this.prisma.driver.findUnique({
          where: { userId: payload.sub },
          select: { id: true },
        });
        client.driverId = driver?.id;
      } else if (payload.role === 'PASSENGER') {
        const passenger = await this.prisma.passenger.findUnique({
          where: { userId: payload.sub },
          select: { id: true },
        });
        client.passengerId = passenger?.id;
      }

      // Auto-join personal channel
      void client.join(`user:${payload.sub}`);

      this.logger.debug(
        `Connected: ${client.id} user=${payload.sub} role=${payload.role}`,
      );
    } catch (err) {
      this.logger.warn(
        `Rejecting connection ${client.id} — invalid token: ${(err as Error).message}`,
      );
      client.emit('error', { message: 'Invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Disconnected: ${client.id} user=${client.userId ?? 'n/a'}`);
  }

  // ─── Client → Server events ─────────────────────────────────────────────

  /** Client subscribes to a trip's live updates. */
  @SubscribeMessage('trip:subscribe')
  handleSubscribeTrip(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tripId: string },
  ) {
    if (!client.userId) return { ok: false, error: 'Not authenticated' };
    void client.join(`trip:${data.tripId}`);
    return { ok: true, tripId: data.tripId };
  }

  /** Client unsubscribes from a trip. */
  @SubscribeMessage('trip:unsubscribe')
  handleUnsubscribeTrip(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tripId: string },
  ) {
    void client.leave(`trip:${data.tripId}`);
    return { ok: true };
  }

  /** Driver broadcasts their location while online (lower-frequency alternative to REST). */
  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { latitude: number; longitude: number; heading?: number; speedKmh?: number; accuracyMeters?: number },
  ) {
    if (!client.userId || client.role !== 'DRIVER' || !client.driverId) {
      return { ok: false, error: 'Only authenticated drivers' };
    }

    // Update DB + Redis via the same path as REST endpoint (so admin/dispatcher see it)
    await this.prisma.driver.update({
      where: { id: client.driverId },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speedKmh: data.speedKmh,
        accuracyMeters: data.accuracyMeters,
        locationUpdatedAt: new Date(),
      },
    });

    // Broadcast to all clients in any active trip room for this driver
    const activeTrip = await this.prisma.trip.findFirst({
      where: { driverId: client.driverId, status: { in: ['DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS'] } },
      select: { id: true, passengerUserId: true },
    });

    if (activeTrip) {
      this.server.to(`trip:${activeTrip.id}`).emit(WS_EVENTS.DRIVER_LOCATION, {
        tripId: activeTrip.id,
        driverId: client.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speedKmh: data.speedKmh,
        accuracyMeters: data.accuracyMeters,
        timestamp: new Date().toISOString(),
      });
    }

    return { ok: true };
  }

  /** Driver responds to a trip offer via WebSocket (alternative to POST /dispatch/respond). */
  @SubscribeMessage('driver:offer:respond')
  async handleOfferResponse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tripId: string; accept: boolean },
  ) {
    if (!client.driverId) return { ok: false, error: 'Not a driver' };
    // Notify the trip room that an offer response was received — the actual
    // business logic runs in DispatchService via the REST endpoint or an
    // internal event bus. This keeps WS as a notification layer only.
    this.server.to(`trip:${data.tripId}`).emit(WS_EVENTS.TRIP_OFFER_RESPONSE, {
      tripId: data.tripId,
      driverId: client.driverId,
      accept: data.accept,
    });
    return { ok: true };
  }

  // ─── Server → Client helpers (called by other services) ─────────────────

  /** Emit a trip lifecycle event to all subscribers of that trip. */
  emitTripEvent(tripId: string, eventName: string, payload: unknown): void {
    this.server?.to(`trip:${tripId}`).emit(eventName, payload);
  }

  /** Push a notification to a user's personal channel. */
  emitNotification(userId: string, notification: unknown): void {
    this.server?.to(`user:${userId}`).emit(WS_EVENTS.NOTIFICATION, notification);
  }

  /** Send a trip offer to a specific driver. */
  emitTripOffer(driverId: string, offer: unknown): void {
    this.server?.to(`user:${driverId}`).emit(WS_EVENTS.TRIP_OFFER, offer);
  }

  /** Broadcast a driver status change (online/offline/on-trip). */
  emitDriverStatus(driverId: string, status: string): void {
    this.server.emit(WS_EVENTS.DRIVER_STATUS, { driverId, status });
  }

  /** Broadcast SOS trigger to all safety-team sockets. */
  emitSosTriggered(sosId: string, userId: string, location: { latitude: number; longitude: number }): void {
    this.server.emit(WS_EVENTS.SOS_TRIGGERED, { sosId, userId, ...location });
  }

  /** Notify a user that their wallet balance changed. */
  emitWalletUpdate(userId: string, balance: string, currency: string): void {
    this.server?.to(`user:${userId}`).emit(WS_EVENTS.WALLET_UPDATED, { balance, currency });
  }
}
