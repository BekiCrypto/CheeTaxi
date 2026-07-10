"""CheeTaxi Python SDK — official client for the CheeTaxi REST API."""
from .client import CheeTaxiClient, AsyncCheeTaxiClient, CheeTaxiError
from .resources import TripsResource, PricingResource, SubscriptionsResource, WalletsResource, WebhooksResource

__all__ = [
    "CheeTaxiClient",
    "AsyncCheeTaxiClient",
    "CheeTaxiError",
    "TripsResource",
    "PricingResource",
    "SubscriptionsResource",
    "WalletsResource",
    "WebhooksResource",
]
__version__ = "1.0.0"
