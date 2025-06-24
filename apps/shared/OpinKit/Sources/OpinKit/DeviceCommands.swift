import Foundation

public enum OpinDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum OpinBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum OpinThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum OpinNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum OpinNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct OpinBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: OpinBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: OpinBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct OpinThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: OpinThermalState

    public init(state: OpinThermalState) {
        self.state = state
    }
}

public struct OpinStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct OpinNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: OpinNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [OpinNetworkInterfaceType]

    public init(
        status: OpinNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [OpinNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct OpinDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: OpinBatteryStatusPayload
    public var thermal: OpinThermalStatusPayload
    public var storage: OpinStorageStatusPayload
    public var network: OpinNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: OpinBatteryStatusPayload,
        thermal: OpinThermalStatusPayload,
        storage: OpinStorageStatusPayload,
        network: OpinNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct OpinDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
