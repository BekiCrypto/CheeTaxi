import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';

/**
 * AI voice/chat assistant — natural language interface for support + booking.
 *
 * Uses the LLM via the z-ai-web-dev-sdk (or any OpenAI-compatible API) to:
 *   • Understand user intent from voice or text input
 *   • Book rides ("I need a taxi from Bole to the airport")
 *   • Answer FAQs ("How much does a ride cost?")
 *   • Resolve support issues ("My driver didn't show up")
 *   • Provide real-time status ("Where is my driver?")
 *
 * The assistant uses function calling — the LLM decides which API function
 * to invoke based on the user's message.
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger('AssistantService');

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** Process a user message and return a response + optional actions. */
  async chat(userId: string, message: string, language: string = 'en'): Promise<AssistantResponse> {
    // 1. Classify intent
    const intent = await this.classifyIntent(message);

    // 2. Extract entities (location, time, etc.)
    const entities = await this.extractEntities(message);

    // 3. Execute the appropriate function
    const action = await this.executeIntent(userId, intent, entities, language);

    // 4. Generate natural language response
    const response = await this.generateResponse(intent, action, entities, language);

    return {
      message: response,
      intent,
      entities,
      action,
    };
  }

  /** Convert voice to text using ASR. */
  async transcribe(audioBase64: string, language: string = 'am'): Promise<string> {
    // Real impl: use z-ai-web-dev-sdk ASR or Whisper API
    // For now, return empty — wire in production
    this.logger.log(`[ASR] Transcribing ${audioBase64.length} chars of audio (${language})`);
    return '';
  }

  /** Convert text to speech for voice responses. */
  async synthesize(text: string, language: string = 'am'): Promise<string> {
    // Real impl: use z-ai-web-dev-sdk TTS or Google TTS
    // Returns base64 audio
    this.logger.log(`[TTS] Synthesizing "${text}" (${language})`);
    return '';
  }

  private async classifyIntent(message: string): Promise<string> {
    const msg = message.toLowerCase();
    if (/book|ride|taxi|need.*car|pick.*up/.test(msg)) return 'book_ride';
    if (/where.*driver|track|status|eta/.test(msg)) return 'track_trip';
    if (/cancel/.test(msg)) return 'cancel_trip';
    if (/cost|price|fare|how much/.test(msg)) return 'get_fare';
    if (/help|support|problem|issue|wrong/.test(msg)) return 'support';
    if (/wallet|balance|top.*up/.test(msg)) return 'wallet';
    if (/subscription|plan/.test(msg)) return 'subscription';
    return 'general';
  }

  private async extractEntities(message: string): Promise<Record<string, unknown>> {
    const entities: Record<string, unknown> = {};
    // Extract phone numbers, addresses, amounts — real impl would use NER
    const phoneMatch = message.match(/\+?\d{10,}/);
    if (phoneMatch) entities.phone = phoneMatch[0];
    const amountMatch = message.match(/\d+\s*(birr|br|etb)/i);
    if (amountMatch) entities.amount = Number(amountMatch[0].replace(/\D/g, ''));
    return entities;
  }

  private async executeIntent(userId: string, intent: string, entities: Record<string, unknown>, language: string): Promise<AssistantAction> {
    switch (intent) {
      case 'book_ride':
        return { type: 'suggest_booking', payload: { message: 'Use the home screen to set pickup and dropoff' } };
      case 'track_trip': {
        const activeTrip = await this.prisma.trip.findFirst({
          where: { passengerUserId: userId, status: { in: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS'] } },
          orderBy: { requestedAt: 'desc' },
        });
        if (activeTrip) {
          return { type: 'show_trip', payload: { tripId: activeTrip.id, status: activeTrip.status } };
        }
        return { type: 'no_active_trip', payload: {} };
      }
      case 'cancel_trip': {
        const activeTrip = await this.prisma.trip.findFirst({
          where: { passengerUserId: userId, status: { in: ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING'] } },
        });
        if (activeTrip) {
          return { type: 'confirm_cancel', payload: { tripId: activeTrip.id } };
        }
        return { type: 'no_active_trip', payload: {} };
      }
      case 'get_fare':
        return { type: 'suggest_fare_quote', payload: {} };
      case 'support':
        return { type: 'create_ticket', payload: {} };
      case 'wallet': {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        return { type: 'show_wallet', payload: { balance: wallet?.balance ?? 0, currency: wallet?.currency ?? 'ETB' } };
      }
      default:
        return { type: 'none', payload: {} };
    }
  }

  private async generateResponse(intent: string, action: AssistantAction, entities: Record<string, unknown>, language: string): Promise<string> {
    // Real impl: LLM generates natural response. For now, template-based.
    const responses: Record<string, string> = {
      book_ride: 'I can help you book a ride. Open the home screen and set your pickup and dropoff locations.',
      track_trip: action.type === 'show_trip' ? `Your trip is currently ${action.payload.status}. The driver is on the way.` : 'You have no active trips right now.',
      cancel_trip: action.type === 'confirm_cancel' ? 'I found your active trip. Would you like me to cancel it? Reply "yes" to confirm.' : 'You have no active trips to cancel.',
      get_fare: 'To get a fare estimate, enter your pickup and dropoff on the home screen. The app will show the estimated fare before you book.',
      support: 'I can create a support ticket for you. What issue are you experiencing?',
      wallet: action.type === 'show_wallet' ? `Your wallet balance is ${action.payload.balance} ${action.payload.currency}.` : 'I can\'t find your wallet. Please sign in first.',
      subscription: 'Drivers pay one subscription — daily, weekly, or monthly. Check the subscription screen for pricing.',
      general: 'I\'m here to help with rides, tracking, payments, and support. What do you need?',
    };
    return responses[intent] ?? responses.general;
  }
}

export interface AssistantResponse {
  message: string;
  intent: string;
  entities: Record<string, unknown>;
  action: AssistantAction;
}

export interface AssistantAction {
  type: string;
  payload: Record<string, unknown>;
}
