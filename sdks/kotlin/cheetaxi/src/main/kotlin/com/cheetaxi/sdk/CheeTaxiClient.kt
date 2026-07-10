// CheeTaxi Kotlin SDK — official client for the CheeTaxi REST API.
//
// Usage:
// ```kotlin
// import com.cheetaxi.sdk.CheeTaxiClient
//
// val client = CheeTaxiClient(
//     baseUrl = "https://api.cheetaxi.africa",
//     accessToken = "your-jwt"
// )
//
// // Coroutines
// val trip = client.trips.request(
//     pickup = GeoPoint(9.0195, 38.7525, "Bole"),
//     dropoff = GeoPoint(9.0112, 38.7623, "Meskel"),
//     mode = "TAXI", vehicleType = "TAXI", paymentMethod = "CASH"
// )
// ```

package com.cheetaxi.sdk

import java.net.HttpURLConnection
import java.net.URL
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.json.JSONArray

data class CheeTaxiConfig(
    val baseUrl: String,
    var accessToken: String? = null,
    var apiKey: String? = null,
    val timeoutMs: Int = 30000,
)

class CheeTaxiError(message: String, val statusCode: Int) : Exception(message)

class CheeTaxiClient(val config: CheeTaxiConfig) {
    val trips = TripsResource(config)
    val pricing = PricingResource(config)
    val subscriptions = SubscriptionsResource(config)
    val wallets = WalletsResource(config)
    val webhooks = WebhooksResource()
    val health = HealthResource(config)

    fun setAccessToken(token: String) {
        config.accessToken = token
    }

    internal suspend fun request(method: String, path: String, body: JSONObject? = null): Any = withContext(Dispatchers.IO) {
        val url = URL("${config.baseUrl}$path")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = config.timeoutMs
            readTimeout = config.timeoutMs
            setRequestProperty("Content-Type", "application/json")
            config.accessToken?.let { setRequestProperty("Authorization", "Bearer $it") }
            config.apiKey?.let { setRequestProperty("X-API-Key", it) }
            if (body != null) {
                doOutput = true
                outputStream.write(body.toString().toByteArray())
            }
        }

        try {
            val responseCode = conn.responseCode
            val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
            val responseText = stream?.bufferedReader()?.use { it.readText() } ?: ""
            val json = if (responseText.isNotEmpty()) JSONObject(responseText) else JSONObject()

            if (responseCode !in 200..299 || json.optBoolean("success", false) != true) {
                val errorMsg = json.optJSONObject("error")?.optString("message") ?: "HTTP $responseCode"
                throw CheeTaxiError(errorMsg, responseCode)
            }
            json.opt("data") ?: JSONObject.NULL
        } finally {
            conn.disconnect()
        }
    }
}
