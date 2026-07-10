// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "CheeTaxi",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .library(name: "CheeTaxi", targets: ["CheeTaxi"]),
    ],
    targets: [
        .target(name: "CheeTaxi", path: "Sources/CheeTaxi"),
    ]
)
