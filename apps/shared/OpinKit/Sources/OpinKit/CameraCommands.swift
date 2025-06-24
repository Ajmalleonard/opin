import Foundation

public enum OpinCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum OpinCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum OpinCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum OpinCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct OpinCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: OpinCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: OpinCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: OpinCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: OpinCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct OpinCameraClipParams: Codable, Sendable, Equatable {
    public var facing: OpinCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: OpinCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: OpinCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: OpinCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
