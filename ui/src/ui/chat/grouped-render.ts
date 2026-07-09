import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { AssistantIdentity } from "../assistant-identity.ts";
import type { MessageGroup } from "../types/chat-types.ts";
import { icons } from "../icons.ts";
import { toSanitizedMarkdownHtml } from "../markdown.ts";
import { renderCopyAsMarkdownButton } from "./copy-as-markdown.ts";
import {
  extractTextCached,
  extractThinkingCached,
  formatReasoningMarkdown,
} from "./message-extract.ts";
import { isToolResultMessage, normalizeRoleForGrouping } from "./message-normalizer.ts";
import { extractToolCards, renderToolCardSidebar } from "./tool-cards.ts";

type ImageBlock = {
  url: string;
  alt?: string;
};

function extractImages(message: unknown): ImageBlock[] {
  const m = message as Record<string, unknown>;
  const content = m.content;
  const images: ImageBlock[] = [];

  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block !== "object" || block === null) {
        continue;
      }
      const b = block as Record<string, unknown>;

      if (b.type === "image") {
        // Handle source object format (from sendChatMessage)
        const source = b.source as Record<string, unknown> | undefined;
        if (source?.type === "base64" && typeof source.data === "string") {
          const data = source.data;
          const mediaType = (source.media_type as string) || "image/png";
          // If data is already a data URL, use it directly
          const url = data.startsWith("data:") ? data : `data:${mediaType};base64,${data}`;
          images.push({ url });
        } else if (typeof b.url === "string") {
          images.push({ url: b.url });
        }
      } else if (b.type === "image_url") {
        // OpenAI format
        const imageUrl = b.image_url as Record<string, unknown> | undefined;
        if (typeof imageUrl?.url === "string") {
          images.push({ url: imageUrl.url });
        }
      }
    }
  }

  return images;
}

export function renderReadingIndicatorGroup(assistant?: AssistantIdentity) {
  const name = assistant?.name ?? "Assistant";
  return html`
    <div class="chat-group assistant">
      ${renderAvatar("assistant", assistant)}
      <div class="chat-group-messages">
        <div class="chat-typing-indicator" role="status" aria-live="polite" aria-label="${name} is typing">
          <div class="chat-typing-indicator__loader" aria-hidden="true"></div>
          <div class="chat-typing-indicator__meta">${name} is thinking</div>
        </div>
      </div>
    </div>
  `;
}

export function renderStreamingGroup(
  text: string,
  startedAt: number,
  onOpenSidebar?: (content: string) => void,
  assistant?: AssistantIdentity,
) {
  const timestamp = new Date(startedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const name = assistant?.name ?? "Assistant";

  return html`
    <div class="chat-group assistant">
      ${renderAvatar("assistant", assistant)}
      <div class="chat-group-messages">
        <div class="chat-stream-accent" aria-hidden="true"></div>
        ${renderGroupedMessage(
          {
            role: "assistant",
            content: [{ type: "text", text }],
            timestamp: startedAt,
          },
          { isStreaming: true, showReasoning: false },
          onOpenSidebar,
        )}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${name}</span>
          <span class="chat-group-timestamp">${timestamp}</span>
        </div>
      </div>
    </div>
  `;
}

export function renderMessageGroup(
  group: MessageGroup,
  opts: {
    onOpenSidebar?: (content: string) => void;
    showReasoning: boolean;
    assistantName?: string;
    assistantAvatar?: string | null;
  },
) {
  const normalizedRole = normalizeRoleForGrouping(group.role);
  const assistantName = opts.assistantName ?? "Assistant";
  const who =
    normalizedRole === "user"
      ? "You"
      : normalizedRole === "assistant"
        ? assistantName
        : normalizedRole;
  const roleClass =
    normalizedRole === "user" ? "user" : normalizedRole === "assistant" ? "assistant" : "other";
  const timestamp = new Date(group.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return html`
    <div class="chat-group ${roleClass}">
      ${renderAvatar(group.role, {
        name: assistantName,
        avatar: opts.assistantAvatar ?? null,
      })}
      <div class="chat-group-messages">
        ${group.messages.map((item, index) =>
          renderGroupedMessage(
            item.message,
            {
              isStreaming: group.isStreaming && index === group.messages.length - 1,
              showReasoning: opts.showReasoning,
            },
            opts.onOpenSidebar,
          ),
        )}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${who}</span>
          <span class="chat-group-timestamp">${timestamp}</span>
        </div>
      </div>
    </div>
  `;
}

function renderAvatar(role: string, assistant?: Pick<AssistantIdentity, "name" | "avatar">) {
  const normalized = normalizeRoleForGrouping(role);
  const assistantName = assistant?.name?.trim() || "Assistant";
  const assistantAvatar = assistant?.avatar?.trim() || "";
  const initial =
    normalized === "user"
      ? "U"
      : normalized === "assistant"
        ? assistantName.charAt(0).toUpperCase() || "A"
        : normalized === "tool"
          ? "⚙"
          : "?";
  const className =
    normalized === "user"
      ? "user"
      : normalized === "assistant"
        ? "assistant"
        : normalized === "tool"
          ? "tool"
          : "other";

  if (assistantAvatar && normalized === "assistant") {
    if (isAvatarUrl(assistantAvatar)) {
      return html`<img
        class="chat-avatar ${className}"
        src="${assistantAvatar}"
        alt="${assistantName}"
      />`;
    }
    return html`<div class="chat-avatar ${className}">${assistantAvatar}</div>`;
  }

  return html`<div class="chat-avatar ${className}">${initial}</div>`;
}

function isAvatarUrl(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) || /^data:image\//i.test(value) || value.startsWith("/") // Relative paths from avatar endpoint
  );
}

function renderMessageImages(images: ImageBlock[]) {
  if (images.length === 0) {
    return nothing;
  }

  return html`
    <div class="chat-message-images">
      ${images.map(
        (img) => html`
          <img
            src=${img.url}
            alt=${img.alt ?? "Attached image"}
            class="chat-message-image"
            @click=${() => window.open(img.url, "_blank")}
          />
        `,
      )}
    </div>
  `;
}

function renderGroupedMessage(
  message: unknown,
  opts: { isStreaming: boolean; showReasoning: boolean },
  onOpenSidebar?: (content: string) => void,
) {
  const m = message as Record<string, unknown>;
  const role = typeof m.role === "string" ? m.role : "unknown";
  const isToolResult =
    isToolResultMessage(message) ||
    role.toLowerCase() === "toolresult" ||
    role.toLowerCase() === "tool_result" ||
    typeof m.toolCallId === "string" ||
    typeof m.tool_call_id === "string";

  const toolCards = extractToolCards(message);
  const hasToolCards = toolCards.length > 0;
  const images = extractImages(message);
  const hasImages = images.length > 0;

  const extractedText = extractTextCached(message);
  const extractedThinking =
    opts.showReasoning && role === "assistant" ? extractThinkingCached(message) : null;
  const markdownBase = extractedText?.trim() ? extractedText : null;
  const reasoningMarkdown = extractedThinking ? formatReasoningMarkdown(extractedThinking) : null;
  const markdown = markdownBase;
  const canCopyMarkdown = role === "assistant" && Boolean(markdown?.trim());

  const bubbleClasses = [
    "chat-bubble",
    canCopyMarkdown ? "has-copy" : "",
    opts.isStreaming ? "streaming" : "",
    "fade-in",
  ]
    .filter(Boolean)
    .join(" ");

  if (!markdown && hasToolCards && isToolResult) {
    return html`${toolCards.map((card) => renderToolCardSidebar(card, onOpenSidebar))}`;
  }

  if (!markdown && !hasToolCards && !hasImages && !reasoningMarkdown) {
    return nothing;
  }

  if (role === "user") {
    const userText = markdownBase || String(m.content || m.text || "");
    return html`
      <div class="chat-bubble-container flex flex-col items-end gap-1.5 max-w-full">
        <div class="${bubbleClasses}">
          <div class="chat-text">${userText}</div>
        </div>
        <div class="chat-bubble-actions flex items-center gap-1 pr-1 text-muted/60 text-xs">
          <!-- Copy button -->
          <button
            class="chat-action-btn hover:text-foreground transition-colors p-1"
            title="Copy message"
            @click=${async (e: Event) => {
              const btn = e.currentTarget as HTMLButtonElement;
              await navigator.clipboard.writeText(userText).catch(() => {});
              const origHtml = btn.innerHTML;
              btn.innerHTML = `<div class="w-3.5 h-3.5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-emerald-500">${icons.check}</div>`;
              setTimeout(() => {
                btn.innerHTML = origHtml;
              }, 1500);
            }}
          >
            <div class="w-3.5 h-3.5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">${icons.copy}</div>
          </button>
          <!-- Edit button -->
          <button
            class="chat-action-btn hover:text-foreground transition-colors p-1"
            title="Edit message"
            @click=${() => {
              const textarea = document.querySelector(
                ".chat-compose__field textarea",
              ) as HTMLTextAreaElement | null;
              if (textarea) {
                textarea.value = userText;
                textarea.focus();
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }}
          >
            <div class="w-3.5 h-3.5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">${icons.edit}</div>
          </button>
        </div>
      </div>
    `;
  }

  return html`
    <div class="${bubbleClasses}">
      ${canCopyMarkdown ? renderCopyAsMarkdownButton(markdown!) : nothing}
      ${renderMessageImages(images)}
      ${
        reasoningMarkdown
          ? (() => {
              // Estimate duration: approx 40 characters per second of thinking,
              // or use the durationMs if provided in the message.
              const durationSeconds = (() => {
                if (typeof m.durationMs === "number") {
                  return Math.round(m.durationMs / 1000);
                }
                if (m.usage && typeof (m.usage as any).durationMs === "number") {
                  return Math.round((m.usage as any).durationMs / 1000);
                }
                return Math.max(1, Math.round(extractedThinking!.length / 40));
              })();

              return html`
                <details class="chat-thinking-details group my-3" ?open=${!opts.isStreaming}>
                  <summary class="chat-thinking-summary flex items-center gap-1.5 cursor-pointer select-none text-muted hover:text-foreground transition-colors font-medium text-[13px] py-1.5 list-none outline-none">
                    <!-- Blue DeepSeek orbit icon -->
                    <div class="w-4 h-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-blue-600 shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(45 12 12)" />
                        <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(-45 12 12)" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      </svg>
                    </div>
                    <span>Thought for ${durationSeconds} seconds</span>
                    <!-- Chevron pointing right (closed) -> down (open) -->
                    <div class="w-3 h-3 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-muted/60 transition-transform duration-200 chevron-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </summary>
                  <div class="chat-thinking-content pl-4 border-l border-separator/40 text-muted/80 my-2 text-[13px] leading-relaxed">
                    ${unsafeHTML(toSanitizedMarkdownHtml(reasoningMarkdown))}
                  </div>
                </details>
              `;
            })()
          : nothing
      }
      ${
        markdown
          ? html`<div class="chat-text">${unsafeHTML(toSanitizedMarkdownHtml(markdown))}</div>`
          : nothing
      }
      ${toolCards.map((card) => renderToolCardSidebar(card, onOpenSidebar))}
    </div>
  `;
}
