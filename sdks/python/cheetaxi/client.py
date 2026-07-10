"""Main client class for the CheeTaxi SDK."""
from __future__ import annotations

import hmac
import hashlib
from typing import Any, Optional

import httpx

from .resources import (
    TripsResource,
    PricingResource,
    SubscriptionsResource,
    WalletsResource,
    WebhooksResource,
    HealthResource,
)


class CheeTaxiError(Exception):
    """Raised when the CheeTaxi API returns an error."""

    def __init__(self, message: str, status_code: int, details: Optional[dict] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}


class CheeTaxiClient:
    """Synchronous CheeTaxi API client."""

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.access_token = access_token
        self.timeout = timeout

        # Resources
        self.trips = TripsResource(self)
        self.pricing = PricingResource(self)
        self.subscriptions = SubscriptionsResource(self)
        self.wallets = WalletsResource(self)
        self.webhooks = WebhooksResource(self)
        self.health = HealthResource(self)

    def set_access_token(self, token: str) -> None:
        self.access_token = token

    def request(self, method: str, path: str, body: Optional[dict] = None) -> Any:
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        with httpx.Client(timeout=self.timeout) as client:
            response = client.request(
                method,
                f"{self.base_url}{path}",
                headers=headers,
                json=body,
            )
            data = response.json()
            if not response.is_success or not data.get("success"):
                raise CheeTaxiError(
                    data.get("error", {}).get("message", f"HTTP {response.status_code}"),
                    response.status_code,
                    data.get("error"),
                )
            return data.get("data")


class AsyncCheeTaxiClient:
    """Asynchronous CheeTaxi API client."""

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.access_token = access_token
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

        self.trips = TripsResource(self)
        self.pricing = PricingResource(self)
        self.subscriptions = SubscriptionsResource(self)
        self.wallets = WalletsResource(self)
        self.webhooks = WebhooksResource(self)
        self.health = HealthResource(self)

    def set_access_token(self, token: str) -> None:
        self.access_token = token

    async def request(self, method: str, path: str, body: Optional[dict] = None) -> Any:
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        response = await self._client.request(
            method,
            f"{self.base_url}{path}",
            headers=headers,
            json=body,
        )
        data = response.json()
        if not response.is_success or not data.get("success"):
            raise CheeTaxiError(
                data.get("error", {}).get("message", f"HTTP {response.status_code}"),
                response.status_code,
                data.get("error"),
            )
        return data.get("data")

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()


def verify_webhook_signature(body: str, signature: str, secret: str) -> bool:
    """Verify an HMAC-SHA256 webhook signature in constant time."""
    expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
