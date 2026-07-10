// CheeTaxi Dart SDK models

class GeoPoint {
  final double lat;
  final double lng;
  final String? address;
  const GeoPoint({required this.lat, required this.lng, this.address});

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng, if (address != null) 'address': address};
}

class TripRequestInput {
  final GeoPoint pickup;
  final GeoPoint dropoff;
  final List<GeoPoint>? stops;
  final String mode;
  final String vehicleType;
  final String paymentMethod;
  final String? scheduledFor;
  final String? promoCode;
  final String? notes;
  final int? passengerCount;

  const TripRequestInput({
    required this.pickup, required this.dropoff, this.stops,
    required this.mode, required this.vehicleType, required this.paymentMethod,
    this.scheduledFor, this.promoCode, this.notes, this.passengerCount,
  });

  Map<String, dynamic> toJson() => {
    'pickup': pickup.toJson(), 'dropoff': dropoff.toJson(),
    'stops': stops?.map((s) => s.toJson()).toList(),
    'mode': mode, 'vehicleType': vehicleType, 'paymentMethod': paymentMethod,
    if (scheduledFor != null) 'scheduledFor': scheduledFor,
    if (promoCode != null) 'promoCode': promoCode,
    if (notes != null) 'notes': notes,
    if (passengerCount != null) 'passengerCount': passengerCount,
  };
}

class TripRequestResult {
  final String tripId;
  final String publicId;
  final FareQuote estimate;
  final String shareToken;

  TripRequestResult({required this.tripId, required this.publicId, required this.estimate, required this.shareToken});

  factory TripRequestResult.fromJson(Map<String, dynamic> json) => TripRequestResult(
    tripId: json['tripId'] as String,
    publicId: json['publicId'] as String,
    estimate: FareQuote.fromJson(json['estimate']),
    shareToken: json['shareToken'] as String,
  );
}

class Trip {
  final String id;
  final String publicId;
  final String status;
  final String mode;
  final String pickupAddress;
  final String dropoffAddress;
  final double totalFare;
  final String currency;
  final String requestedAt;
  final String? completedAt;

  Trip({
    required this.id, required this.publicId, required this.status, required this.mode,
    required this.pickupAddress, required this.dropoffAddress,
    required this.totalFare, required this.currency, required this.requestedAt, this.completedAt,
  });

  factory Trip.fromJson(Map<String, dynamic> json) => Trip(
    id: json['id'] as String,
    publicId: json['publicId'] as String,
    status: json['status'] as String,
    mode: json['mode'] as String,
    pickupAddress: json['pickupAddress'] as String,
    dropoffAddress: json['dropoffAddress'] as String,
    totalFare: (json['totalFare'] as num).toDouble(),
    currency: json['currency'] as String,
    requestedAt: json['requestedAt'] as String,
    completedAt: json['completedAt'] as String?,
  );
}

class FareQuote {
  final double baseFare;
  final double distanceFare;
  final double timeFare;
  final double surgeMultiplier;
  final double promoDiscount;
  final double taxAmount;
  final double totalFare;
  final String currency;
  final double distanceMeters;
  final int durationSeconds;

  FareQuote({
    required this.baseFare, required this.distanceFare, required this.timeFare,
    required this.surgeMultiplier, required this.promoDiscount, required this.taxAmount,
    required this.totalFare, required this.currency,
    required this.distanceMeters, required this.durationSeconds,
  });

  factory FareQuote.fromJson(Map<String, dynamic> json) => FareQuote(
    baseFare: (json['baseFare'] as num).toDouble(),
    distanceFare: (json['distanceFare'] as num).toDouble(),
    timeFare: (json['timeFare'] as num).toDouble(),
    surgeMultiplier: (json['surgeMultiplier'] as num).toDouble(),
    promoDiscount: (json['promoDiscount'] as num).toDouble(),
    taxAmount: (json['taxAmount'] as num).toDouble(),
    totalFare: (json['totalFare'] as num).toDouble(),
    currency: json['currency'] as String,
    distanceMeters: (json['distanceMeters'] as num).toDouble(),
    durationSeconds: json['durationSeconds'] as int,
  );
}

class Wallet {
  final String id;
  final String balance;
  final String currency;

  Wallet({required this.id, required this.balance, required this.currency});

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
    id: json['id'] as String,
    balance: json['balance'] as String,
    currency: json['currency'] as String,
  );
}
