package ai.opin.android.ui

import androidx.compose.runtime.Composable
import ai.opin.android.MainViewModel
import ai.opin.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
