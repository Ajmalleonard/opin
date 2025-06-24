import Foundation

public enum OpinChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(OpinChatEventPayload)
    case agent(OpinAgentEventPayload)
    case seqGap
}

public protocol OpinChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> OpinChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [OpinChatAttachmentPayload]) async throws -> OpinChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> OpinChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<OpinChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension OpinChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "OpinChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> OpinChatSessionsListResponse {
        throw NSError(
            domain: "OpinChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
