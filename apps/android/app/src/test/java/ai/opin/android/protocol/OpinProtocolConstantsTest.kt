package ai.opin.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class OpinProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", OpinCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", OpinCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", OpinCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", OpinCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", OpinCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", OpinCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", OpinCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", OpinCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", OpinCapability.Canvas.rawValue)
    assertEquals("camera", OpinCapability.Camera.rawValue)
    assertEquals("screen", OpinCapability.Screen.rawValue)
    assertEquals("voiceWake", OpinCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", OpinScreenCommand.Record.rawValue)
  }
}
