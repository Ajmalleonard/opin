import OpinKit
import OpinProtocol
import Foundation

// Prefer the OpinKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = OpinKit.AnyCodable
typealias InstanceIdentity = OpinKit.InstanceIdentity

extension AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AnyCodable]? { self.value as? [String: AnyCodable] }
    var arrayValue: [AnyCodable]? { self.value as? [AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}

extension OpinProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: OpinProtocol.AnyCodable]? { self.value as? [String: OpinProtocol.AnyCodable] }
    var arrayValue: [OpinProtocol.AnyCodable]? { self.value as? [OpinProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: OpinProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [OpinProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
