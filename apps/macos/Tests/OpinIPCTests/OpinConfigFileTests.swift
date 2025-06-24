import Foundation
import Testing
@testable import Opin

@Suite(.serialized)
struct OpinConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("opin-config-\(UUID().uuidString)")
            .appendingPathComponent("opin.json")
            .path

        await TestIsolation.withEnvValues(["OPIN_CONFIG_PATH": override]) {
            #expect(OpinConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("opin-config-\(UUID().uuidString)")
            .appendingPathComponent("opin.json")
            .path

        await TestIsolation.withEnvValues(["OPIN_CONFIG_PATH": override]) {
            OpinConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(OpinConfigFile.remoteGatewayPort() == 19999)
            #expect(OpinConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(OpinConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(OpinConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("opin-config-\(UUID().uuidString)")
            .appendingPathComponent("opin.json")
            .path

        await TestIsolation.withEnvValues(["OPIN_CONFIG_PATH": override]) {
            OpinConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            OpinConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = OpinConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("opin-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "OPIN_CONFIG_PATH": nil,
            "OPIN_STATE_DIR": dir,
        ]) {
            #expect(OpinConfigFile.stateDirURL().path == dir)
            #expect(OpinConfigFile.url().path == "\(dir)/opin.json")
        }
    }
}
