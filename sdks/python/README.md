# CheeTaxi Python SDK

Official Python client for the CheeTaxi REST API.

## Install

```bash
pip install cheetaxi
```

## Usage

```python
from cheetaxi import CheeTaxiClient

client = CheeTaxiClient(
    base_url="https://api.cheetaxi.africa",
    access_token="your-jwt-access-token",
)

# Request a trip
trip = client.trips.request(
    pickup={"lat": 9.0195, "lng": 38.7525, "address": "Bole"},
    dropoff={"lat": 9.0112, "lng": 38.7623, "address": "Meskel Square"},
    mode="TAXI",
    vehicle_type="TAXI",
    payment_method="CASH",
)

print(f"Trip {trip['publicId']} — fare {trip['estimate']['totalFare']} ETB")

# Get a fare quote
quote = client.pricing.quote(
    vehicle_type="TAXI",
    pickup_lat=9.0195, pickup_lng=38.7525,
    dropoff_lat=9.0112, dropoff_lng=38.7623,
)
print(f"Estimated fare: {quote['totalFare']} ETB ({quote['distanceMeters']/1000:.1f} km)")

# Verify a webhook signature
import flask
@app.route("/webhook", methods=["POST"])
def webhook():
    sig = request.headers.get("X-CheeTaxi-Signature", "")
    body = request.get_data(as_text=True)
    if not client.webhooks.verify_signature(body, sig, WEBHOOK_SECRET):
        return "invalid signature", 401
    event = request.json
    # handle event
    return "ok", 200
```

## Async support

```python
import asyncio
from cheetaxi import AsyncCheeTaxiClient

async def main():
    client = AsyncCheeTaxiClient(base_url="...", access_token="...")
    trip = await client.trips.request(...)
    print(trip)

asyncio.run(main())
```

## License

Proprietary — see https://cheetaxi.africa/legal
