import CoreLocation
import Foundation
import OpinKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: OpinCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: OpinCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: OpinLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: OpinLocationGetParams,
        desiredAccuracy: OpinLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> OpinDeviceStatusPayload
    func info() -> OpinDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: OpinPhotosLatestParams) async throws -> OpinPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: OpinContactsSearchParams) async throws -> OpinContactsSearchPayload
    func add(params: OpinContactsAddParams) async throws -> OpinContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: OpinCalendarEventsParams) async throws -> OpinCalendarEventsPayload
    func add(params: OpinCalendarAddParams) async throws -> OpinCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: OpinRemindersListParams) async throws -> OpinRemindersListPayload
    func add(params: OpinRemindersAddParams) async throws -> OpinRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: OpinMotionActivityParams) async throws -> OpinMotionActivityPayload
    func pedometer(params: OpinPedometerParams) async throws -> OpinPedometerPayload
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
