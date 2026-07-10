// CheeTaxi Swift SDK — official client for the CheeTaxi REST API.
//
// Usage:
// ```swift
// import CheeTaxi
//
// let client = CheeTaxiClient(baseUrl: "https://api.cheetaxi.africa", accessToken: "your-jwt")
// let trip = try await client.trips.request(
//     pickup: GeoPoint(lat: 9.0195, lng: 38.7525, address: "Bole"),
//     dropoff: GeoPoint(lat: 9.0112, lng: 38.7623, address: "Meskel"),
//     mode: "TAXI", vehicleType: "TAXI", paymentMethod: "CASH"
// )
// ```

import Foundation

public struct CheeTaxiConfig {
    public let baseUrl: String
    public var accessToken: String?
    public var apiKey: String?
    public var timeout: TimeInterval

    public init(baseUrl: String, accessToken: String? = nil, apiKey: String? = nil, timeout: TimeInterval = 30) {
        self.baseUrl = baseUrl
        self.accessToken = accessToken
        self.apiKey = apiKey
        self.timeout = timeout
    }
}

public actor CheeTaxiClient {
    public let config: CheeTaxiConfig
    public let trips: TripsResource
    public let pricing: PricingResource
    public let subscriptions: SubscriptionsResource
    public let wallets: WalletsResource
    public let webhooks: WebhooksResource
    public let health: HealthResource

    public init(config: CheeTaxiConfig) {
        self.config = config
        self.trips = TripsResource(config: config)
        self.pricing = PricingResource(config: config)
        self.subscriptions = SubscriptionsResource(config: config)
        self.wallets = WalletsResource(config: config)
        self.webhooks = WebhooksResource()
        self.health = HealthResource(config: config)
    }

    public func setAccessToken(_ token: String) {
        config.accessToken = token
    }
}

public struct CheeTaxiError: Error {
    public let message: String
    public let statusCode: Int
    public init(_ message: String, _ statusCode: Int) {
        self.message = message
        self.statusCode = statusCode
    }
}

// MARK: - Shared request helper

func cheetaxiRequest(_ config: CheeTaxiConfig, method: String, path: String, body: [String: Any]? = nil) async throws -> Any {
    guard let url = URL(string: "\(config.baseUrl)\(path)") else {
        throw CheeTaxiError("Invalid URL", 0)
    }
    var request = URLRequest(url: url, timeoutInterval: config.timeout)
    request.httpMethod = method
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    if let token = config.accessToken {
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    if let apiKey = config.apiKey {
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
    }
    if let body = body {
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
    }

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse else {
        throw CheeTaxiError("Invalid response", 0)
    }
    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    if http.statusCode < 200 || http.statusCode >= 300 || json["success"] as? Bool != true {
        let errorMsg = (json["error"] as? [String: Any])?["message"] as? String ?? "HTTP \(http.statusCode)"
        throw CheeTaxiError(errorMsg, http.statusCode)
    }
    return json["data"] as Any
}
