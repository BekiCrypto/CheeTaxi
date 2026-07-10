import {
  USER_ROLES,
  TRIP_STATUSES,
  TRIP_MODES,
  VEHICLE_TYPES,
  PAYMENT_METHODS,
  SUBSCRIPTION_TIERS,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  AFRICAN_COUNTRIES,
  WS_EVENTS,
  UserRole,
  TripStatus,
} from '../src';

describe('shared domain types', () => {
  describe('USER_ROLES', () => {
    it('includes all 19 required roles per the Executive Order', () => {
      const required = [
        'SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS', 'FINANCE', 'SUPPORT',
        'DISPATCHER', 'COMPLIANCE', 'SAFETY', 'FRAUD', 'MARKETING',
        'FLEET_MANAGER', 'REGIONAL_MANAGER', 'CITY_MANAGER', 'REGULATOR',
        'DRIVER', 'PASSENGER', 'DEVELOPER', 'AUDITOR', 'READ_ONLY',
      ];
      for (const role of required) {
        expect(USER_ROLES).toContain(role);
      }
      expect(USER_ROLES.length).toBeGreaterThanOrEqual(19);
    });
  });

  describe('TRIP_STATUSES', () => {
    it('covers the full trip lifecycle', () => {
      const required = [
        'REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING',
        'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED',
        'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM',
        'NO_DRIVER_FOUND',
      ];
      for (const s of required) {
        expect(TRIP_STATUSES).toContain(s);
      }
    });
  });

  describe('TRIP_MODES', () => {
    it('includes all 16 transport modes', () => {
      expect(TRIP_MODES.length).toBeGreaterThanOrEqual(16);
      expect(TRIP_MODES).toContain('TAXI');
      expect(TRIP_MODES).toContain('MOTORCYCLE');
      expect(TRIP_MODES).toContain('INTERCITY');
      expect(TRIP_MODES).toContain('EMERGENCY');
    });
  });

  describe('VEHICLE_TYPES', () => {
    it('includes core vehicle types', () => {
      ['TAXI', 'RIDE_SHARING', 'MOTORCYCLE', 'THREE_WHEELER', 'FOOD_DELIVERY', 'TRUCK'].forEach(
        (v) => expect(VEHICLE_TYPES).toContain(v),
      );
    });
  });

  describe('PAYMENT_METHODS', () => {
    it('includes all 5 payment methods', () => {
      expect(PAYMENT_METHODS).toEqual(
        expect.arrayContaining(['CASH', 'WALLET', 'CARD', 'CORPORATE_ACCOUNT', 'SUBSCRIPTION']),
      );
    });
  });

  describe('SUBSCRIPTION_TIERS', () => {
    it('includes all 8 tiers', () => {
      expect(SUBSCRIPTION_TIERS).toEqual(
        expect.arrayContaining([
          'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY',
          'CORPORATE_FLEET', 'ENTERPRISE', 'GOVERNMENT',
        ]),
      );
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('includes 9 African + international languages', () => {
      expect(SUPPORTED_LANGUAGES).toEqual(
        expect.arrayContaining(['en', 'am', 'om', 'ti', 'so', 'ar', 'fr', 'sw', 'pt']),
      );
    });
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('includes ETB (Ethiopian Birr) as first entry', () => {
      expect(SUPPORTED_CURRENCIES[0].code).toBe('ETB');
    });
    it('includes major African currencies', () => {
      const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
      ['ETB', 'KES', 'NGN', 'GHS', 'ZAR', 'EGP'].forEach((c) => expect(codes).toContain(c));
    });
    it('every currency has code, name, symbol, country', () => {
      for (const c of SUPPORTED_CURRENCIES) {
        expect(c).toHaveProperty('code');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('symbol');
        expect(c).toHaveProperty('country');
      }
    });
  });

  describe('AFRICAN_COUNTRIES', () => {
    it('includes ETHIOPIA as launch country', () => {
      expect(AFRICAN_COUNTRIES).toContain('ETHIOPIA');
    });
  });

  describe('WS_EVENTS', () => {
    it('defines all trip lifecycle events', () => {
      ['TRIP_REQUESTED', 'TRIP_ASSIGNED', 'TRIP_ARRIVING', 'TRIP_ARRIVED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED'].forEach(
        (e) => expect(WS_EVENTS).toHaveProperty(e),
      );
    });
    it('defines driver events', () => {
      expect(WS_EVENTS).toHaveProperty('DRIVER_LOCATION');
      expect(WS_EVENTS).toHaveProperty('DRIVER_STATUS');
      expect(WS_EVENTS).toHaveProperty('TRIP_OFFER');
    });
    it('defines SOS and wallet events', () => {
      expect(WS_EVENTS).toHaveProperty('SOS_TRIGGERED');
      expect(WS_EVENTS).toHaveProperty('WALLET_UPDATED');
    });
  });

  describe('type compilation', () => {
    it('UserRole can be assigned from USER_ROLES', () => {
      const role: UserRole = 'DRIVER';
      expect(role).toBe('DRIVER');
    });
    it('TripStatus can be assigned from TRIP_STATUSES', () => {
      const status: TripStatus = 'COMPLETED';
      expect(status).toBe('COMPLETED');
    });
  });
});
