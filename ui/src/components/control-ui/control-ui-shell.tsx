"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { extractText, extractThinking } from "../../ui/chat/message-extract";
import { normalizeMessage, normalizeRoleForGrouping } from "../../ui/chat/message-normalizer";
import { extractToolCards } from "../../ui/chat/tool-helpers";
import { subtitleForTab, titleForTab, type Tab } from "../../ui/navigation";
import ArenaPage from "../arena/ArenaPage";
import { useControlUiStore } from "./control-ui-provider";
import { Markdown } from "./markdown";
import { ChannelsPanel } from "./panels/ChannelsPanel";
import { ConfigPanel } from "./panels/ConfigPanel";
import { CronPanel } from "./panels/CronPanel";
import { DebugPanel } from "./panels/DebugPanel";
import { InstancesPanel } from "./panels/InstancesPanel";
import { LogsPanel } from "./panels/LogsPanel";
import { NodesPanel } from "./panels/NodesPanel";
// Modular Panel Imports
import { OverviewPanel } from "./panels/OverviewPanel";
import { JsonBlock } from "./panels/PanelHelpers";
import { SessionsPanel } from "./panels/SessionsPanel";
import { SkillsPanel } from "./panels/SkillsPanel";
import { UsagePanel } from "./panels/UsagePanel";
import { RichInputEditor, type PillData } from "./RichInputEditor";
import { ToolCards } from "./ToolCards";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function resolveSessionRows(currentKey: string, sessions: any) {
  const rows = sessions?.sessions ?? [];
  if (rows.some((row: any) => row.key === currentKey)) {
    return rows;
  }
  return [
    {
      key: currentKey,
      kind: "unknown",
      updatedAt: null,
    },
    ...rows,
  ];
}

function resolveSessionDisplayName(key: string, row?: any): string {
  if (!row) {
    return key;
  }
  const label = row.label?.trim();
  const displayName = row.displayName?.trim();
  if (label && label !== key) {
    return label;
  }
  if (displayName && displayName !== key) {
    return displayName;
  }
  return key;
}

export function ControlUiShell({ activeTab }: { activeTab: Tab }) {
  const store = useControlUiStore();
  const router = useRouter();
  const isChat = activeTab === "chat";
  const isArena = activeTab === "arena";

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  // Autocomplete dropdown states
  const [activeTrigger, setActiveTrigger] = useState<{
    trigger: string;
    query: string;
    start: number;
    end: number;
  } | null>(null);
  const [pills, setPills] = useState<PillData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Helper options lists
  const availableSkills = store.skillsReport?.skills ?? [];
  const availableCommands = [
    { name: "clear", description: "Clear current chat history" },
    { name: "sync", description: "Sync changes and files" },
    { name: "status", description: "Show channels connection status" },
    { name: "doctor", description: "Run health & configuration diagnosis" },
    { name: "new", description: "Start a fresh chat session" },
    { name: "help", description: "Show help and documentation" },
  ];
  const availableSnippets = [
    { id: "instructions", handle: "instructions", content: "General instructions for Opin bot" },
    { id: "rules", handle: "rules", content: "Project guidelines and style rules" },
    { id: "config", handle: "config", content: "Current active configuration settings" },
  ];

  const getFilteredOptions = () => {
    if (!activeTrigger) {
      return [];
    }
    const q = activeTrigger.query.toLowerCase();

    if (activeTrigger.trigger === "@" || activeTrigger.trigger === "$") {
      return availableSkills
        .filter((s: any) => s.name.toLowerCase().includes(q))
        .map((s: any) => ({
          kind: "skill" as const,
          skill: s,
          name: s.name,
          description: s.description,
        }));
    }
    if (activeTrigger.trigger === "/") {
      return availableCommands
        .filter((c) => c.name.toLowerCase().includes(q))
        .map((c) => ({
          kind: "command" as const,
          command: c,
          name: c.name,
          description: c.description,
        }));
    }
    if (activeTrigger.trigger === "#") {
      return availableSnippets
        .filter((s) => s.handle.toLowerCase().includes(q))
        .map((s) => ({
          kind: "snippet" as const,
          snippet: s,
          name: s.handle,
          description: s.content,
        }));
    }
    return [];
  };

  const filteredOptions = getFilteredOptions();

  const handleSelectOption = (opt: any) => {
    if (!activeTrigger) {
      return;
    }

    const pill: PillData =
      opt.kind === "skill"
        ? { kind: "skill", skill: opt.skill }
        : opt.kind === "command"
          ? { kind: "command", command: opt.command }
          : { kind: "snippet", snippet: opt.snippet };

    editorRef.current?.insertPill(pill, activeTrigger);
    setActiveTrigger(null);
    setSelectedIndex(0);
  };

  const handleCaretChange = (text: string, caretOffset: number) => {
    const leftText = text.slice(0, caretOffset);
    const match = leftText.match(/(?:^|\s)([@$/#])([a-zA-Z0-9_-]*)$/);
    if (match) {
      setActiveTrigger({
        trigger: match[1],
        query: match[2],
        start: caretOffset - match[1].length - match[2].length,
        end: caretOffset,
      });
      setSelectedIndex(0);
    } else {
      setActiveTrigger(null);
    }
  };

  // Close suggestions menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const el = editorRef.current?.el;
      if (el && !el.contains(e.target as Node)) {
        setActiveTrigger(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-scroll chat history
  useEffect(() => {
    if (isChat) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [store.chatMessages, store.chatStream, isChat]);

  // Attachment local handlers
  const handleAttachFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const newAttachment = {
          id: Math.random().toString(36).substring(7),
          dataUrl,
          mimeType: file.type,
        };
        store.chatAttachments = [...(store.chatAttachments ?? []), newAttachment];
        store.touch();

        // Insert pill inside the text input editor
        editorRef.current?.insertPill({
          kind: "file",
          file: newAttachment,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearAttachment = () => {
    store.chatAttachments = [];
    store.touch();
  };

  return isChat ? (
    <div className="flex flex-1 h-full overflow-hidden min-w-0 bg-background text-foreground">
      {/* Chat Session List (Column 2) */}
      <aside className="w-[260px] border-r border-border flex flex-col h-full bg-surface shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
              Start chat
            </div>
            <div className="text-sm font-semibold text-foreground truncate max-w-[170px]">
              {store.settings.sessionKey || "main"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onPress={() => store.sendChat("/new")}
              className="bg-accent text-accent-foreground text-xs font-semibold px-3 min-w-0 h-7"
            >
              New
            </Button>
          </div>
        </div>

        {/* Sessions list rows */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none bg-surface-secondary">
          {resolveSessionRows(store.settings.sessionKey || "main", store.sessionsResult).map(
            (row: any) => {
              const isActive = row.key === store.settings.sessionKey;
              const displayName = resolveSessionDisplayName(row.key, row) ?? row.key;
              const updated = row.updatedAt ? new Date(row.updatedAt).toLocaleTimeString() : null;
              return (
                <button
                  key={row.key}
                  onClick={() => store.updateSetting("sessionKey", row.key)}
                  className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground border border-border"
                      : "hover:bg-default border border-transparent text-foreground/75"
                  }`}
                >
                  <span className={`text-sm truncate w-full font-medium`}>{displayName}</span>
                  {updated && <span className="text-[10px] opacity-60">{updated}</span>}
                </button>
              );
            },
          )}
        </div>
      </aside>

      {/* Chat Conversation & Composer Workspace (Column 3) */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-background">
        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-28 scrollbar-none ">
          {store.chatLoading ? (
            <div className="text-center py-10 text-muted text-sm">Loading history…</div>
          ) : store.chatMessages.length === 0 ? (
            <div className="text-center py-20 text-muted text-sm">
              No messages yet. Send a message to start a session.
            </div>
          ) : (
            (() => {
              const groups: { role: string; timestamp: number; messages: unknown[] }[] = [];
              let currentGroup: { role: string; timestamp: number; messages: unknown[] } | null =
                null;

              for (const message of store.chatMessages) {
                const normalized = normalizeMessage(message);
                const role = normalizeRoleForGrouping(normalized.role);
                const timestamp = normalized.timestamp;

                if (
                  currentGroup &&
                  currentGroup.role === role &&
                  timestamp - currentGroup.timestamp < 5 * 60 * 1000
                ) {
                  currentGroup.messages.push(message);
                } else {
                  currentGroup = {
                    role,
                    timestamp,
                    messages: [message],
                  };
                  groups.push(currentGroup);
                }
              }

              return groups.map((group, groupIdx) => {
                const isUser = group.role === "user";
                const formattedTime = new Date(group.timestamp).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={groupIdx}
                    className={`flex gap-3 max-w-4xl mx-auto items-start w-full ${
                      isUser ? "flex-row-reverse justify-start" : "flex-row justify-start"
                    }`}
                  >
                    {/* Messages list */}
                    <div
                      className={`flex flex-col  gap-2 max-w-[75%] ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {group.messages.map((message, msgIdx) => {
                        const normalized = normalizeMessage(message);
                        const text = extractText(message);
                        const thinking = extractThinking(message);
                        const content = text?.trim();

                        if (isUser) {
                          const userText = content || String(normalized.content || message);
                          return (
                            <div
                              key={msgIdx}
                              className="flex flex-col items-end gap-1 group w-full"
                            >
                              {/* Bubble */}
                              <div className="w-fit max-w-lg rounded-2xl px-[18px] py-[10px] text-[14px] leading-[18px] bg-surface-secondary text-foreground backdrop-blur-md">
                                {userText}
                              </div>
                              {/* Actions below bubble */}
                              <div className="flex items-center gap-1.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                                {/* Copy */}
                                <button
                                  className="hover:text-foreground p-1 transition-colors rounded hover:bg-surface-secondary flex items-center justify-center"
                                  title="Copy message"
                                  onClick={async (e) => {
                                    await navigator.clipboard.writeText(userText).catch(() => {});
                                    const btn = e.currentTarget as HTMLButtonElement;
                                    const orig = btn.innerHTML;
                                    btn.innerHTML = `<span class="text-emerald-500 font-bold">✓</span>`;
                                    setTimeout(() => {
                                      btn.innerHTML = orig;
                                    }, 1500);
                                  }}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                </button>
                                {/* Edit */}
                                <button
                                  className="hover:text-foreground p-1 transition-colors rounded hover:bg-surface-secondary flex items-center justify-center"
                                  title="Edit message"
                                  onClick={() => {
                                    if (editorRef.current) {
                                      store.chatMessage = userText;
                                      store.touch();
                                      editorRef.current.focus();
                                    }
                                  }}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Assistant message
                        const durationSeconds = (() => {
                          const mRecord = message as Record<string, unknown>;
                          if (typeof mRecord.durationMs === "number") {
                            return Math.round(mRecord.durationMs / 1000);
                          }
                          const usage = mRecord.usage as Record<string, unknown> | undefined;
                          if (usage && typeof usage.durationMs === "number") {
                            return Math.round(usage.durationMs / 1000);
                          }
                          return Math.max(1, Math.round((thinking || "").length / 40));
                        })();

                        return (
                          <div key={msgIdx} className="w-full text-foreground space-y-2 ">
                            {thinking && (
                              <details className="group my-2 select-none " open={!store.chatStream}>
                                <summary className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-foreground transition-colors font-medium text-[13px] py-1.5 outline-none list-none [&::-webkit-details-marker]:hidden">
                                  {/* Orbit Icon */}

                                  <span>Thought for {durationSeconds} seconds</span>
                                  {/* Chevron */}
                                  <div className="w-3 h-3 text-muted/60 transition-transform duration-200 group-open:rotate-90">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2.5"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  </div>
                                </summary>
                                <div className="pl-4 border-l border-border text-muted/80 my-2 text-[13px] leading-relaxed select-text">
                                  <Markdown
                                    content={thinking.trim()}
                                    className="prose prose-invert max-w-none break-words"
                                  />
                                </div>
                              </details>
                            )}

                            {content && (
                              <div className="text-[14px] leading-relaxed break-words relative group/assistant-msg">
                                <Markdown
                                  content={content}
                                  className="prose prose-invert max-w-none"
                                />
                                {/* Copy Markdown button floating overlay */}
                                <div className="absolute top-0 right-0 opacity-0 group-hover/assistant-msg:opacity-100 transition-opacity">
                                  <button
                                    className="min-w-0 w-7 h-7 rounded-lg hover:bg-default p-1 text-muted hover:text-foreground flex items-center justify-center bg-background/50 backdrop-blur cursor-pointer"
                                    title="Copy markdown"
                                    onClick={async (e) => {
                                      await navigator.clipboard.writeText(content).catch(() => {});
                                      const btn = e.currentTarget as HTMLButtonElement;
                                      const orig = btn.innerHTML;
                                      btn.innerHTML = `<span class="text-emerald-500 font-bold text-xs">✓</span>`;
                                      setTimeout(() => {
                                        btn.innerHTML = orig;
                                      }, 1500);
                                    }}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2.2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}

                            <ToolCards cards={extractToolCards(message)} />

                            {!content && !thinking && extractToolCards(message).length === 0 && (
                              <JsonBlock value={normalized.content} />
                            )}
                          </div>
                        );
                      })}

                      {/* Group Footer */}
                      <div className="flex items-center gap-2 text-[10px] text-muted opacity-80 mt-1 select-none">
                        <span className="font-semibold uppercase tracking-wider">
                          {isUser ? "You" : store.assistantName || "Assistant"}
                        </span>
                        <span>·</span>
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Absolute floating composer pill dock */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="flex items-end gap-2 bg-surface border border-border rounded-lg p-2.5 shadow-xl backdrop-blur-md relative">
              {/* Autocomplete Suggestions Menu */}
              {activeTrigger && filteredOptions.length > 0 && (
                <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-w-3xl mx-auto bg-surface border border-border rounded-xl shadow-2xl p-1.5 max-h-64 overflow-y-auto z-50 flex flex-col gap-0.5 pointer-events-auto">
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider select-none border-b border-border mb-1">
                    Suggestions for {activeTrigger.trigger}
                  </div>
                  {filteredOptions.map((opt, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(opt)}
                        className={cn(
                          "w-full flex items-center justify-between text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                          isSelected
                            ? "bg-accent text-accent-foreground font-medium"
                            : "hover:bg-default/60 text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="opacity-80">
                            {opt.kind === "skill" && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3.5 h-3.5"
                              >
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912-1.275-1.275L12 3Z" />
                              </svg>
                            )}
                            {opt.kind === "command" && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3.5 h-3.5"
                              >
                                <line x1="4" y1="20" x2="20" y2="4" />
                                <line x1="9" y1="4" x2="20" y2="4" />
                                <line x1="20" y1="4" x2="20" y2="15" />
                              </svg>
                            )}
                            {opt.kind === "snippet" && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3.5 h-3.5"
                              >
                                <line x1="4" y1="9" x2="20" y2="9" />
                                <line x1="4" y1="15" x2="20" y2="15" />
                                <line x1="10" y1="3" x2="8" y2="21" />
                                <line x1="16" y1="3" x2="14" y2="21" />
                              </svg>
                            )}
                          </div>
                          <span className="font-semibold truncate">
                            {opt.kind === "skill"
                              ? opt.name
                              : opt.kind === "snippet"
                                ? `#${opt.name}`
                                : `/${opt.name}`}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] truncate max-w-[200px] opacity-70",
                            isSelected ? "text-accent-foreground/90" : "text-muted",
                          )}
                        >
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* File Attachment Input / Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAttachFile(file);
                  }
                }}
                className="hidden"
                accept="image/*"
              />
              <Button
                isIconOnly
                onPress={() => fileInputRef.current?.click()}
                className="p-2 text-foreground/60 hover:text-foreground hover:bg-default shrink-0 min-w-0 w-9 h-9 flex items-center justify-center self-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Button>

              {/* Text Input Block */}
              <div className="flex-1 flex flex-col min-w-0">
                <RichInputEditor
                  ref={editorRef}
                  value={store.chatMessage}
                  pills={pills}
                  onPillRemove={(p) => setPills((prev) => prev.filter((x) => x !== p))}
                  onChange={(text) => {
                    store.chatMessage = text;
                    store.touch();
                  }}
                  onCaretChange={handleCaretChange}
                  onKeyDown={(e) => {
                    if (activeTrigger && filteredOptions.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedIndex(
                          (prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length,
                        );
                      } else if (e.key === "Enter" || e.key === "Tab") {
                        e.preventDefault();
                        if (filteredOptions[selectedIndex]) {
                          handleSelectOption(filteredOptions[selectedIndex]);
                        }
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setActiveTrigger(null);
                      }
                    } else {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void store.sendChat();
                      }
                    }
                  }}
                  placeholder="Ask Opin."
                  className="w-full bg-transparent border-none text-sm text-foreground focus:outline-none resize-none max-h-48 py-2 px-1 scrollbar-none"
                />
              </div>

              {/* Action/Submit Button */}
              <Button
                isIconOnly
                onPress={() => void store.sendChat()}
                className="p-3 bg-accent text-accent-foreground rounded-full hover:opacity-90 transition-opacity flex items-center justify-center shrink-0 min-w-0 w-10 h-10"
              >
                <svg
                  className="w-4 h-4 transform rotate-90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19V5m0 0l-7 7m7-7l7 7"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : isArena ? (
    // Arena is a full-bleed canvas app (toolbar + graph + composer), not a
    // padded content page — it manages its own layout end to end.
    <ArenaPage store={store} />
  ) : (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-8 py-8 gap-6 scrollbar-none bg-background">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {titleForTab(activeTab)}
        </h1>
        <p className="text-sm text-muted">{subtitleForTab(activeTab)}</p>
      </div>
      <div className="h-px bg-border w-full" />
      <div className="flex-1">
        {activeTab === "overview" ? (
          <OverviewPanel store={store} router={router} />
        ) : activeTab === "channels" ? (
          <ChannelsPanel store={store} />
        ) : activeTab === "instances" ? (
          <InstancesPanel store={store} />
        ) : activeTab === "sessions" ? (
          <SessionsPanel store={store} />
        ) : activeTab === "usage" ? (
          <UsagePanel store={store} />
        ) : activeTab === "cron" ? (
          <CronPanel store={store} />
        ) : activeTab === "skills" ? (
          <SkillsPanel store={store} />
        ) : activeTab === "nodes" ? (
          <NodesPanel store={store} />
        ) : activeTab === "config" ? (
          <ConfigPanel store={store} />
        ) : activeTab === "debug" ? (
          <DebugPanel store={store} />
        ) : (
          <LogsPanel store={store} />
        )}
      </div>
    </div>
  );
}
