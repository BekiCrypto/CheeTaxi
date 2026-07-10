# CheeTaxi — API Reference

**Base URL (production):** `https://api.cheetaxi.africa`
**Base URL (local):** `http://localhost:4000`
**Swagger UI:** `http://localhost:4000/docs` (development only)
**OpenAPI spec:** `http://localhost:4000/docs-json`

## Authentication

All authenticated endpoints require a Bearer JWT in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in 15 minutes. Refresh tokens expire in 30 days and are rotated on every use.

## Standard Response Envelope

Every response follows this shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

## Endpoints

### Auth

| Method | Path                       | Description                          | Auth |
| ------ | -------------------------- | ------------------------------------ | ---- |
| POST   | `/auth/signup`             | Register a new passenger or driver   | ❌  |
| POST   | `/auth/login`              | Login with phone/email + password    | ❌  |
| POST   | `/auth/otp/request`        | Request an OTP for phone login       | ❌  |
| POST   | `/auth/otp/verify`         | Verify OTP and authenticate          | ❌  |
| POST   | `/auth/refresh`            | Exchange refresh token for new tokens | ❌  |
| POST   | `/auth/logout`             | Revoke refresh token                 | ❌  |
| GET    | `/auth/me`                 | Get the currently authenticated user | ✅  |

### Users

| Method | Path                       | Description                          | Roles |
| ------ | -------------------------- | ------------------------------------ | ----- |
| GET    | `/users`                   | List users (paginated, searchable)   | admin/ops/support/auditor |
| GET    | `/users/me`                | Get current user with roles/perms    | any   |
| GET    | `/users/:id`               | Get user by ID                       | admin/ops/support/auditor |
| PATCH  | `/users/me`                | Update own profile                   | any   |
| PATCH  | `/users/:id/status`        | Suspend / ban / activate             | admin/compliance |
| POST   | `/users/:id/roles`         | Assign a role                        | super_admin/platform_admin |
| DELETE | `/users/:id/roles`         | Revoke a role                        | super_admin/platform_admin |
| DELETE | `/users/me`                | GDPR: schedule account deletion      | any   |

### Passengers

| Method | Path                                | Description                |
| ------ | ----------------------------------- | -------------------------- |
| GET    | `/passengers/me`                    | Get passenger profile      |
| GET    | `/passengers/me/trips`              | Trip history               |
| POST   | `/passengers/me/places`             | Add saved place            |
| DELETE | `/passengers/me/places/:placeId`    | Remove saved place         |
| POST   | `/passengers/me/favorites/:driverId`| Add favorite driver        |
| DELETE | `/passengers/me/favorites/:driverId`| Remove favorite driver     |

### Drivers

| Method | Path                       | Description                                |
| ------ | -------------------------- | ------------------------------------------ |
| POST   | `/drivers/onboard`         | Start driver onboarding (KYC submission)   |
| GET    | `/drivers/me`              | Get driver profile                         |
| POST   | `/drivers/me/status`       | Go online / offline                        |
| POST   | `/drivers/me/location`     | Update location (called every 5-10s)       |
| GET    | `/drivers/me/earnings`     | Earnings summary                           |
| GET    | `/drivers/nearby`          | Find nearby online drivers                 |
| GET    | `/drivers/pending`         | List drivers pending KYC approval          |
| PATCH  | `/drivers/:id/approve`     | Approve driver                             |
| PATCH  | `/drivers/:id/reject`      | Reject driver                              |

### Vehicles

| Method | Path                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| POST   | `/vehicles`           | Register a vehicle           |
| GET    | `/vehicles`           | List my vehicles             |
| POST   | `/vehicles/:id/activate` | Set as current vehicle    |
| PATCH  | `/vehicles/:id/verify`   | Verify vehicle (admin)    |

### Fleets

| Method | Path                              | Description                       |
| ------ | --------------------------------- | --------------------------------- |
| POST   | `/fleets`                         | Create a fleet                    |
| GET    | `/fleets`                         | List fleets (paginated)           |
| GET    | `/fleets/:id`                     | Fleet detail with members         |
| PATCH  | `/fleets/:id`                     | Update fleet info                 |
| POST   | `/fleets/:id/members`             | Add a driver to the fleet         |
| DELETE | `/fleets/:id/members/:driverId`   | Remove a driver from the fleet    |

### Trips

| Method | Path                       | Description                                |
| ------ | -------------------------- | ------------------------------------------ |
| POST   | `/trips/request`           | Request a new trip                         |
| POST   | `/trips/:id/accept`        | Driver accepts a trip                      |
| POST   | `/trips/:id/arrive`        | Driver arrived at pickup                   |
| POST   | `/trips/:id/start`         | Driver starts the trip                     |
| POST   | `/trips/:id/complete`      | Driver completes the trip                  |
| POST   | `/trips/:id/cancel`        | Cancel a trip                              |
| GET    | `/trips/:id`               | Get trip detail                            |
| GET    | `/trips/share/:token`      | Public trip tracking (no auth)             |
| GET    | `/trips/me/passenger`      | List my trips as passenger                 |
| GET    | `/trips/me/driver`         | List my trips as driver                    |

### Dispatch

| Method | Path                | Description                       |
| ------ | ------------------- | --------------------------------- |
| POST   | `/dispatch/respond` | Driver responds to a trip offer   |

### Pricing

| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| GET    | `/pricing/quote`  | Get a fare estimate for a trip       |
| GET    | `/pricing/tiers`  | List all active pricing tiers        |
| POST   | `/pricing/surge`  | Set a surge multiplier (admin)       |

### Geo

| Method | Path                  | Description                            |
| ------ | --------------------- | -------------------------------------- |
| GET    | `/geo/geocode`        | Geocode address → coordinates          |
| GET    | `/geo/reverse`        | Reverse geocode coordinates → address  |
| GET    | `/geo/places`         | Search saved places                    |
| GET    | `/geo/geofence/check` | Check if a point is in a geofence      |

### Subscriptions

| Method | Path                       | Description                          |
| ------ | -------------------------- | ------------------------------------ |
| GET    | `/subscriptions/plans`     | List subscription plans              |
| GET    | `/subscriptions/me/active` | Get my active subscription           |
| GET    | `/subscriptions/me/history`| Get my subscription history          |
| POST   | `/subscriptions/purchase`  | Purchase a subscription              |
| POST   | `/subscriptions/:id/cancel`| Cancel a subscription                |
| GET    | `/subscriptions`           | Admin: list all subscriptions        |

### Wallets

| Method | Path                          | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/wallets/me`                 | Get my wallet balance      |
| POST   | `/wallets/me/topup`           | Top up wallet              |
| POST   | `/wallets/me/withdraw`        | Driver withdrawal request  |
| GET    | `/wallets/me/transactions`    | List wallet transactions   |

### Payments

| Method | Path                                | Description                          |
| ------ | ----------------------------------- | ------------------------------------ |
| POST   | `/payments/trips/:tripId/initiate`  | Initiate payment for a trip          |
| POST   | `/payments/webhooks/:provider`      | Payment provider webhook (no auth)   |

### Notifications

| Method | Path                          | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/notifications`              | List my notifications      |
| PATCH  | `/notifications/:id/read`     | Mark as read               |
| PATCH  | `/notifications/read-all`     | Mark all as read           |

### SOS

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| POST   | `/sos`                     | Trigger SOS alert            |
| GET    | `/sos/active`              | List active alerts (safety)  |
| PATCH  | `/sos/:id/acknowledge`     | Acknowledge alert            |
| PATCH  | `/sos/:id/resolve`         | Resolve alert                |

### Support

| Method | Path                              | Description                |
| ------ | --------------------------------- | -------------------------- |
| POST   | `/support/tickets`                | Create a support ticket    |
| GET    | `/support/tickets/me`             | My tickets                 |
| GET    | `/support/tickets`                | Admin: all tickets         |
| POST   | `/support/tickets/:id/messages`   | Add a message              |
| GET    | `/support/tickets/:id/messages`   | List messages              |
| PATCH  | `/support/tickets/:id/assign`     | Assign ticket              |
| PATCH  | `/support/tickets/:id/resolve`    | Resolve ticket             |

### Ratings

| Method | Path                  | Description                |
| ------ | --------------------- | -------------------------- |
| POST   | `/ratings/trips/:tripId` | Rate a trip             |

### Promotions

| Method | Path                      | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | `/promotions`             | List active promo codes    |
| POST   | `/promotions`             | Create a promo code        |
| POST   | `/promotions/redeem`      | Redeem a promo code        |
| GET    | `/promotions/referrals/me`| List my referrals          |

### Audit

| Method | Path     | Description                              |
| ------ | -------- | ---------------------------------------- |
| GET    | `/audit` | List audit logs (admin/auditor/compliance) |

### Health

| Method | Path          | Description                          |
| ------ | ------------- | ------------------------------------ |
| GET    | `/health`     | Liveness probe                       |
| GET    | `/health/ready`| Readiness probe — checks DB + Redis |

## Rate Limits

- 600 requests/minute/IP (default)
- 30 requests/second/IP burst
- OTP requests: 10/hour/phone, 60s cooldown between requests

## Error Codes

| Code                    | HTTP | Meaning                              |
| ----------------------- | ---- | ------------------------------------ |
| VALIDATION_ERROR        | 400  | Request body failed validation       |
| UNAUTHORIZED            | 401  | Missing or invalid token             |
| FORBIDDEN               | 403  | Insufficient role or permission      |
| NOT_FOUND               | 404  | Resource does not exist              |
| CONFLICT                | 409  | Duplicate resource                   |
| DUPLICATE_RESOURCE      | 409  | Unique constraint violation          |
| FOREIGN_KEY_VIOLATION   | 400  | Referenced resource does not exist   |
| INTERNAL_ERROR          | 500  | Unexpected server error              |
| PRISMA_P*               | 400  | Prisma error code (see Prisma docs)  |
