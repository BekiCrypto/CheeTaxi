"""Resource classes for the CheeTaxi SDK."""
from __future__ import annotations

from typing import Any, Optional


class _Resource:
    def __init__(self, client: Any):
        self._client = client


class TripsResource(_Resource):
    """Trip lifecycle endpoints."""

    def request(
        self,
        pickup: dict,
        dropoff: dict,
        mode: str,
        vehicle_type: str,
        payment_method: str,
        stops: Optional[list] = None,
        scheduled_for: Optional[str] = None,
        promo_code: Optional[str] = None,
        notes: Optional[str] = None,
        passenger_count: Optional[int] = None,
    ) -> dict:
        return self._client.request(
            "POST",
            "/trips/request",
            {
                "pickup": pickup,
                "dropoff": dropoff,
                "stops": stops,
                "mode": mode,
                "vehicleType": vehicle_type,
                "paymentMethod": payment_method,
                "scheduledFor": scheduled_for,
                "promoCode": promo_code,
                "notes": notes,
                "passengerCount": passenger_count,
            },
        )

    def get(self, trip_id: str) -> dict:
        return self._client.request("GET", f"/trips/{trip_id}")

    def cancel(self, trip_id: str, reason: str, by: str = "passenger") -> dict:
        return self._client.request("POST", f"/trips/{trip_id}/cancel", {"reason": reason, "by": by})

    def accept(self, trip_id: str) -> dict:
        return self._client.request("POST", f"/trips/{trip_id}/accept")

    def arrive(self, trip_id: str) -> dict:
        return self._client.request("POST", f"/trips/{trip_id}/arrive")

    def start(self, trip_id: str) -> dict:
        return self._client.request("POST", f"/trips/{trip_id}/start")

    def complete(
        self,
        trip_id: str,
        actual_distance_meters: Optional[float] = None,
        actual_duration_seconds: Optional[int] = None,
    ) -> dict:
        body: dict = {}
        if actual_distance_meters is not None:
            body["actualDistanceMeters"] = actual_distance_meters
        if actual_duration_seconds is not None:
            body["actualDurationSeconds"] = actual_duration_seconds
        return self._client.request("POST", f"/trips/{trip_id}/complete", body)

    def list_my_passenger_trips(self, page: int = 1, limit: int = 20) -> dict:
        return self._client.request("GET", f"/trips/me/passenger?page={page}&limit={limit}")

    def share(self, token: str) -> dict:
        return self._client.request("GET", f"/trips/share/{token}")


class PricingResource(_Resource):
    """Fare quotes and pricing tiers."""

    def quote(
        self,
        vehicle_type: str,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_lat: float,
        dropoff_lng: float,
        pickup_address: Optional[str] = None,
        dropoff_address: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        promo_code: Optional[str] = None,
    ) -> dict:
        params = {
            "vehicleType": vehicle_type,
            "pickupLat": pickup_lat,
            "pickupLng": pickup_lng,
            "dropoffLat": dropoff_lat,
            "dropoffLng": dropoff_lng,
        }
        if pickup_address: params["pickupAddress"] = pickup_address
        if dropoff_address: params["dropoffAddress"] = dropoff_address
        if city: params["city"] = city
        if country: params["country"] = country
        if promo_code: params["promoCode"] = promo_code

        from urllib.parse import urlencode
        return self._client.request("GET", f"/pricing/quote?{urlencode(params)}")

    def list_tiers(self) -> list:
        return self._client.request("GET", "/pricing/tiers")


class SubscriptionsResource(_Resource):
    """Driver subscription plans."""

    def list_plans(self) -> list:
        return self._client.request("GET", "/subscriptions/plans")

    def get_my_active(self) -> dict:
        return self._client.request("GET", "/subscriptions/me/active")

    def purchase(
        self,
        plan_code: str,
        payment_method: str,
        auto_renew: bool = False,
        driver_ids: Optional[list] = None,
    ) -> dict:
        return self._client.request(
            "POST",
            "/subscriptions/purchase",
            {
                "planCode": plan_code,
                "paymentMethod": payment_method,
                "autoRenew": auto_renew,
                "driverIds": driver_ids,
            },
        )


class WalletsResource(_Resource):
    """Wallet balance and transactions."""

    def get_my_wallet(self) -> dict:
        return self._client.request("GET", "/wallets/me")

    def top_up(self, amount: float, currency: str, provider: str) -> None:
        return self._client.request(
            "POST",
            "/wallets/me/topup",
            {"amount": amount, "currency": currency, "provider": provider},
        )

    def list_transactions(self, page: int = 1, limit: int = 20) -> dict:
        return self._client.request("GET", f"/wallets/me/transactions?page={page}&limit={limit}")


class WebhooksResource(_Resource):
    """Webhook endpoint management + signature verification."""

    def create_endpoint(self, url: str, events: list, description: Optional[str] = None) -> dict:
        return self._client.request(
            "POST",
            "/webhooks/endpoints",
            {"url": url, "events": events, "description": description},
        )

    def list_endpoints(self) -> list:
        return self._client.request("GET", "/webhooks/endpoints")

    def delete_endpoint(self, endpoint_id: str) -> None:
        return self._client.request("DELETE", f"/webhooks/endpoints/{endpoint_id}")

    @staticmethod
    def verify_signature(body: str, signature: str, secret: str) -> bool:
        """Verify an HMAC-SHA256 webhook signature in constant time."""
        import hmac
        import hashlib
        expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)


class HealthResource(_Resource):
    """Service health checks."""

    def liveness(self) -> dict:
        return self._client.request("GET", "/health")

    def readiness(self) -> dict:
        return self._client.request("GET", "/health/ready")
