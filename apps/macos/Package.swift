// swift-tools-version: 6.2
// Package manifest for the Opin macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Opin",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "OpinIPC", targets: ["OpinIPC"]),
        .library(name: "OpinDiscovery", targets: ["OpinDiscovery"]),
        .executable(name: "Opin", targets: ["Opin"]),
        .executable(name: "opin-mac", targets: ["OpinMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/OpinKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "OpinIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OpinDiscovery",
            dependencies: [
                .product(name: "OpinKit", package: "OpinKit"),
            ],
            path: "Sources/OpinDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Opin",
            dependencies: [
                "OpinIPC",
                "OpinDiscovery",
                .product(name: "OpinKit", package: "OpinKit"),
                .product(name: "OpinChatUI", package: "OpinKit"),
                .product(name: "OpinProtocol", package: "OpinKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/Opin.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OpinMacCLI",
            dependencies: [
                "OpinDiscovery",
                .product(name: "OpinKit", package: "OpinKit"),
                .product(name: "OpinProtocol", package: "OpinKit"),
            ],
            path: "Sources/OpinMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OpinIPCTests",
            dependencies: [
                "OpinIPC",
                "Opin",
                "OpinDiscovery",
                .product(name: "OpinProtocol", package: "OpinKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
