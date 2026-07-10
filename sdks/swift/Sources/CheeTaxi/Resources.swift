import Foundation
import Crypto

// MARK: - Models

public struct GeoPoint: Codable {
    public let lat: Double
    public let lng: Double
    public let address: String?
    public init(lat: Double, lng: Double, address: String? = nil) {
        self.lat = lat; self.lng = lng; self.address = address
    }
}

public struct Trip: Codable {
    public let id: String
    public let publicId: String
    public let status: String
    public let mode: String
    public let totalFare: Double
    public let currency: String
}

public struct FareQuote: Codable {
    public let baseFare: Double
    public let distanceFare: Double
    public let totalFare: Double
    public let currency: String
    public let distanceMeters: Double
    public let durationSeconds: Int
}

// MARK: - Resources

public struct TripsResource {
    let config: CheeTaxiConfig

    public func request(
        pickup: GeoPoint, dropoff: GeoPoint,
        mode: String, vehicleType: String, paymentMethod: String,
        promoCode: String? = nil
    ) async throws -> [String: Any] {
        let body: [String: Any] = [
            "pickup": ["lat": pickup.lat, "lng": pickup.lng, "address": pickup.address as Any],
            "dropoff": ["lat": dropoff.lat, "lng": dropoff.lng, "address": dropoff.address as Any],
            "mode": mode, "vehicleType": vehicleType, "paymentMethod": paymentMethod,
        ]
        return try await cheetaxiRequest(config, method: "POST", path: "/trips/request", body: body) as? [String: Any] ?? [:]
    }

    public func get(_ tripId: String) async throws -> [String: Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/trips/\(tripId)") as? [String: Any] ?? [:]
    }

    public func cancel(_ tripId: String, reason: String) async throws -> [String: Any] {
        return try await cheetaxiRequest(config, method: "POST", path: "/trips/\(tripId)/cancel", body: ["reason": reason]) as? [String: Any] ?? [:]
    }
}

public struct PricingResource {
    let config: CheeTaxiConfig

    public func quote(
        vehicleType: String,
        pickupLat: Double, pickupLng: Double,
        dropoffLat: Double, dropoffLng: Double
    ) async throws -> [String: Any] {
        let qs = "vehicleType=\(vehicleType)&pickupLat=\(pickupLat)&pickupLng=\(pickupLng)&dropoffLat=\(dropoffLat)&dropoffLng=\(dropoffLng)"
        return try await cheetaxiRequest(config, method: "GET", path: "/pricing/quote?\(qs)") as? [String: Any] ?? [:]
    }

    public func listTiers() async throws -> [Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/pricing/tiers") as? [Any] ?? []
    }
}

public struct SubscriptionsResource {
    let config: CheeTaxiConfig
    public func listPlans() async throws -> [Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/subscriptions/plans") as? [Any] ?? []
    }
    public func getMyActive() async throws -> [String: Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/subscriptions/me/active") as? [String: Any] ?? [:]
    }
}

public struct WalletsResource {
    let config: CheeTaxiConfig
    public func getMyWallet() async throws -> [String: Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/wallets/me") as? [String: Any] ?? [:]
    }
}

public struct WebhooksResource {
    public init() {}

    /// Verify a webhook signature using HMAC-SHA256.
    public func verifySignature(body: String, signature: String, secret: String) -> Bool {
        let key = SymmetricKey(data: Data(secret.utf8))
        let hmac = HMAC<SHA256>.authenticationCode(for: Data(body.utf8), using: key)
        let computed = Data(hmac).map { String(format: "%02x", $0) }.joined()
        return computed == signature
    }
}

public struct HealthResource {
    let config: CheeTaxiConfig
    public func liveness() async throws -> [String: Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/health") as? [String: Any] ?? [:]
    }
    public func readiness() async throws -> [String: Any] {
        return try await cheetaxiRequest(config, method: "GET", path: "/health/ready") as? [String: Any] ?? [:]
    }
}
