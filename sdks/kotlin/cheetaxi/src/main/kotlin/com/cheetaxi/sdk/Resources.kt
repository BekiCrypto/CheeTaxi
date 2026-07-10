package com.cheetaxi.sdk

import org.json.JSONArray
import org.json.JSONObject
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class GeoPoint(val lat: Double, val lng: Double, val address: String? = null) {
    fun toJson() = JSONObject().apply {
        put("lat", lat); put("lng", lng); address?.let { put("address", it) }
    }
}

class TripsResource(private val config: CheeTaxiConfig) {
    suspend fun request(
        pickup: GeoPoint, dropoff: GeoPoint,
        mode: String, vehicleType: String, paymentMethod: String,
        promoCode: String? = null
    ): JSONObject {
        val body = JSONObject().apply {
            put("pickup", pickup.toJson())
            put("dropoff", dropoff.toJson())
            put("mode", mode)
            put("vehicleType", vehicleType)
            put("paymentMethod", paymentMethod)
            promoCode?.let { put("promoCode", it) }
        }
        return CheeTaxiClient(config).request("POST", "/trips/request", body) as JSONObject
    }

    suspend fun get(tripId: String): JSONObject =
        CheeTaxiClient(config).request("GET", "/trips/$tripId") as JSONObject

    suspend fun cancel(tripId: String, reason: String, by: String = "passenger"): JSONObject {
        val body = JSONObject().apply { put("reason", reason); put("by", by) }
        return CheeTaxiClient(config).request("POST", "/trips/$tripId/cancel", body) as JSONObject
    }

    suspend fun accept(tripId: String): JSONObject =
        CheeTaxiClient(config).request("POST", "/trips/$tripId/accept") as JSONObject

    suspend fun arrive(tripId: String): JSONObject =
        CheeTaxiClient(config).request("POST", "/trips/$tripId/arrive") as JSONObject

    suspend fun start(tripId: String): JSONObject =
        CheeTaxiClient(config).request("POST", "/trips/$tripId/start") as JSONObject

    suspend fun complete(tripId: String, actualDistanceMeters: Double? = null, actualDurationSeconds: Int? = null): JSONObject {
        val body = JSONObject()
        actualDistanceMeters?.let { body.put("actualDistanceMeters", it) }
        actualDurationSeconds?.let { body.put("actualDurationSeconds", it) }
        return CheeTaxiClient(config).request("POST", "/trips/$tripId/complete", body) as JSONObject
    }
}

class PricingResource(private val config: CheeTaxiConfig) {
    suspend fun quote(
        vehicleType: String,
        pickupLat: Double, pickupLng: Double,
        dropoffLat: Double, dropoffLng: Double
    ): JSONObject {
        val path = "/pricing/quote?vehicleType=$vehicleType&pickupLat=$pickupLat&pickupLng=$pickupLng&dropoffLat=$dropoffLat&dropoffLng=$dropoffLng"
        return CheeTaxiClient(config).request("GET", path) as JSONObject
    }

    suspend fun listTiers(): JSONArray =
        CheeTaxiClient(config).request("GET", "/pricing/tiers") as JSONArray
}

class SubscriptionsResource(private val config: CheeTaxiConfig) {
    suspend fun listPlans(): JSONArray =
        CheeTaxiClient(config).request("GET", "/subscriptions/plans") as JSONArray

    suspend fun getMyActive(): JSONObject =
        CheeTaxiClient(config).request("GET", "/subscriptions/me/active") as JSONObject
}

class WalletsResource(private val config: CheeTaxiConfig) {
    suspend fun getMyWallet(): JSONObject =
        CheeTaxiClient(config).request("GET", "/wallets/me") as JSONObject

    suspend fun topUp(amount: Double, currency: String, provider: String) {
        val body = JSONObject().apply {
            put("amount", amount); put("currency", currency); put("provider", provider)
        }
        CheeTaxiClient(config).request("POST", "/wallets/me/topup", body)
    }
}

class WebhooksResource {
    /// Verify a webhook signature using HMAC-SHA256.
    fun verifySignature(body: String, signature: String, secret: String): Boolean {
        val key = SecretKeySpec(secret.toByteArray(), "HmacSHA256")
        val mac = Mac.getInstance("HmacSHA256").apply { init(key) }
        val computed = mac.doFinal(body.toByteArray()).joinToString("") { "%02x".format(it) }
        return computed == signature
    }
}

class HealthResource(private val config: CheeTaxiConfig) {
    suspend fun liveness(): JSONObject =
        CheeTaxiClient(config).request("GET", "/health") as JSONObject

    suspend fun readiness(): JSONObject =
        CheeTaxiClient(config).request("GET", "/health/ready") as JSONObject
}
