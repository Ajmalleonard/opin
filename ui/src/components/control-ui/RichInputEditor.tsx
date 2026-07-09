/**
 * RichInputEditor - A contenteditable-based input that renders pills
 * (skills, files, code snippets) inline with text, exactly like the
 * screenshot reference (Notion-style @mentions).
 *
 * Architecture:
 * - The component maintains a flat list of "segments": either {type:"text"}
 *   or {type:"pill"} entries.
 * - We serialize that into DOM: text nodes + non-editable <span> pills.
 * - On every input/mutation we parse the DOM back into segments and push
 *   the plain-text representation up via onChange.
 * - Pills are rendered as contenteditable="false" spans so the browser
 *   treats them as atomic units for cursor movement and deletion.
 */

import { CloseCircle } from "iconsax-react";
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import type { SkillStatusEntry } from "../../ui/types";
import type { ChatAttachment } from "../../ui/ui-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PillKind = "skill" | "file" | "snippet" | "command";

export type PillData =
  | { kind: "skill"; skill: SkillStatusEntry }
  | { kind: "file"; file: ChatAttachment }
  | { kind: "snippet"; snippet: { id: string; handle: string; content: string } }
  | { kind: "command"; command: { name: string; description?: string } };

// ── Utility class merger ───────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Pill rendering helpers ─────────────────────────────────────────────────

function pillId(pill: PillData): string {
  switch (pill.kind) {
    case "skill":
      return `pill-skill-${pill.skill.name}`;
    case "file":
      return `pill-file-${pill.file.id}`;
    case "snippet":
      return `pill-snippet-${pill.snippet.id}`;
    case "command":
      return `pill-cmd-${pill.command.name}`;
  }
}

function pillLabel(pill: PillData): string {
  switch (pill.kind) {
    case "skill":
      return pill.skill.name;
    case "file":
      return `file:${pill.file.id.substring(0, 5)}`;
    case "snippet":
      return `#${pill.snippet.handle}`;
    case "command":
      return `/${pill.command.name}`;
  }
}

function pillClasses(kind: PillKind): string {
  if (kind === "skill") {
    return "text-blue-600 dark:text-blue-400 capitalize bg-blue-500/10 dark:bg-blue-400/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 dark:border-blue-400/20";
  }
  if (kind === "command") {
    return "text-purple-600 dark:text-purple-400 font-mono bg-purple-500/10 dark:bg-purple-400/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 dark:border-purple-400/20";
  }
  if (kind === "file") {
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 dark:border-emerald-400/20";
  }
  return "text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 dark:border-blue-400/20";
}

function PillIcon({ pill }: { pill: PillData }) {
  if (pill.kind === "skill") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 shrink-0 opacity-80"
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912-1.275-1.275L12 3Z" />
      </svg>
    );
  }
  if (pill.kind === "file") {
    if (pill.file.mimeType && pill.file.mimeType.startsWith("image/") && pill.file.dataUrl) {
      return (
        <img src={pill.file.dataUrl} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
      );
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 shrink-0 opacity-80"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  if (pill.kind === "snippet") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 shrink-0 opacity-80"
      >
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
    );
  }
  // command
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 shrink-0 opacity-80"
    >
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="9" y1="4" x2="20" y2="4" />
      <line x1="20" y1="4" x2="20" y2="15" />
    </svg>
  );
}

// ── RichInputEditor API ────────────────────────────────────────────────────

export type RichInputEditorHandle = {
  /** Insert a pill at the current caret position. */
  insertPill(pill: PillData, replaceRange?: { start: number; end: number }): void;
  /** Focus the editor. */
  focus(): void;
  /** Return the current plain-text content. */
  getText(): string;
  /** Clear all content. */
  clear(): void;
  /** The underlying contenteditable div. */
  el: HTMLDivElement | null;
};

export type RichInputEditorProps = {
  value?: string;
  placeholder?: string;
  pills: PillData[];
  onPillRemove: (pill: PillData) => void;
  onChange: (text: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onCaretChange?: (text: string, caretOffset: number) => void;
  className?: string;
  minRows?: number;
};

// ── Data-serialised pill node ──────────────────────────────────────────────

function createPillNode(pill: PillData): HTMLSpanElement {
  const id = pillId(pill);
  const label = pillLabel(pill);
  const kind = pill.kind;

  const outer = document.createElement("span");
  outer.contentEditable = "false";
  outer.dataset.pillId = id;
  outer.dataset.pillKind = kind;
  outer.dataset.pillLabel = label;
  outer.dataset.pillJson = JSON.stringify(pill);
  outer.className = `inline-flex items-center gap-1.5 text-[12px] font-medium select-none mx-0.5 align-baseline ${pillClasses(kind as PillKind)}`;

  const iconSpan = document.createElement("span");
  iconSpan.className = "flex h-3.5 shrink-0 items-center justify-center select-none";

  if (kind === "skill") {
    iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912-1.275-1.275L12 3Z"/></svg>`;
  } else if (kind === "file") {
    const f = pill.file;
    if (f && f.mimeType && f.mimeType.startsWith("image/") && f.dataUrl) {
      iconSpan.innerHTML = `<img src="${f.dataUrl}" alt="" class="w-3.5 h-3.5 rounded object-cover shrink-0" />`;
    } else {
      iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }
  } else if (kind === "snippet") {
    iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`;
  } else if (kind === "command") {
    iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><line x1="4" y1="20" x2="20" y2="4"/><line x1="9" y1="4" x2="20" y2="4"/><line x1="20" y1="4" x2="20" y2="15"/></svg>`;
  }

  outer.appendChild(iconSpan);

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;
  outer.appendChild(labelSpan);

  return outer;
}

// ── Main component ──────────────────────────────────────────────────────────

export const RichInputEditor = forwardRef<RichInputEditorHandle, RichInputEditorProps>(
  function RichInputEditor(
    { value, placeholder, pills, onPillRemove, onChange, onKeyDown, onCaretChange, className },
    ref,
  ) {
    const divRef = useRef<HTMLDivElement>(null);
    const composing = useRef(false);

    // ── Expose handle ────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      insertPill(pill, replaceRange) {
        const el = divRef.current;
        if (!el) {
          return;
        }
        el.focus();

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return;
        }

        if (replaceRange) {
          const textNodes = getTextNodes(el);
          let offset = 0;
          for (const tn of textNodes) {
            const len = tn.textContent?.length ?? 0;
            if (offset + len >= replaceRange.start) {
              const localStart = replaceRange.start - offset;
              const localEnd = Math.min(replaceRange.end - offset, len);
              const deleteRange = document.createRange();
              deleteRange.setStart(tn, localStart);
              deleteRange.setEnd(tn, localEnd);
              sel.removeAllRanges();
              sel.addRange(deleteRange);
              break;
            }
            offset += len;
          }
        }

        sel.getRangeAt(0).deleteContents();

        const pillNode = createPillNode(pill);
        sel.getRangeAt(0).insertNode(pillNode);

        const parent = pillNode.parentNode;
        if (parent) {
          const textNode = document.createTextNode(" ");
          parent.insertBefore(textNode, pillNode.nextSibling);

          requestAnimationFrame(() => {
            el.focus();
            const newSel = window.getSelection();
            if (newSel) {
              const after = document.createRange();
              after.setStart(textNode, 1);
              after.collapse(true);
              newSel.removeAllRanges();
              newSel.addRange(after);
            }
            notifyChange();
          });
        } else {
          requestAnimationFrame(() => {
            el.focus();
            const newSel = window.getSelection();
            if (newSel) {
              const after = document.createRange();
              after.setStartAfter(pillNode);
              after.collapse(true);
              newSel.removeAllRanges();
              newSel.addRange(after);
            }
            notifyChange();
          });
        }
      },
      focus() {
        divRef.current?.focus();
      },
      getText() {
        return extractText(divRef.current);
      },
      clear() {
        if (divRef.current) {
          divRef.current.innerHTML = "";
          notifyChange();
        }
      },
      get el() {
        return divRef.current;
      },
    }));

    // ── Extract plain text ───────────────────────────────────────────────────
    function extractText(el: HTMLDivElement | null): string {
      if (!el) {
        return "";
      }
      let result = "";
      function walk(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent ?? "";
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.dataset.pillId) {
            result += el.dataset.pillLabel ?? "";
          } else if (el.tagName === "BR") {
            result += "\n";
          } else if (el.tagName === "DIV") {
            if (result && !result.endsWith("\n")) {
              result += "\n";
            }
            for (const child of Array.from(el.childNodes)) {
              walk(child);
            }
          } else {
            for (const child of Array.from(el.childNodes)) {
              walk(child);
            }
          }
        }
      }
      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
      return result;
    }

    // ── Get caret offset in plain text ───────────────────────────────────────
    function getCaretOffset(el: HTMLDivElement): number {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        return 0;
      }
      const range = sel.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(el);
      preRange.setEnd(range.endContainer, range.endOffset);
      return preRange.toString().length;
    }

    const updateEmptyAttribute = useCallback(() => {
      const el = divRef.current;
      if (!el) {
        return;
      }
      const isEmpty = el.textContent === "" && el.querySelectorAll("[data-pill-id]").length === 0;
      if (isEmpty) {
        el.setAttribute("data-empty", "true");
      } else {
        el.removeAttribute("data-empty");
      }
    }, []);

    const notifyChange = useCallback(() => {
      const el = divRef.current;
      if (!el) {
        return;
      }

      updateEmptyAttribute();

      const text = extractText(el);
      onChange(text);

      const pillSpans = el.querySelectorAll("[data-pill-id]");
      const currentPillIds = new Set(
        Array.from(pillSpans).map((span) => (span as HTMLElement).dataset.pillId),
      );

      for (const p of pills || []) {
        const id = pillId(p);
        if (!currentPillIds.has(id)) {
          onPillRemove?.(p);
        }
      }

      const caret = getCaretOffset(el);
      onCaretChange?.(text, caret);
    }, [onChange, onCaretChange, pills, onPillRemove, updateEmptyAttribute]);

    // External value change support (resets, templates, edits)
    useEffect(() => {
      if (!divRef.current) {
        return;
      }
      const currentText = extractText(divRef.current);
      if (value !== currentText) {
        if (value === "" || value === undefined || value === null) {
          divRef.current.innerHTML = "";
        } else {
          divRef.current.textContent = value;
        }
        updateEmptyAttribute();
      }
    }, [value, updateEmptyAttribute]);

    const handleInput = useCallback(() => {
      if (composing.current) {
        return;
      }
      notifyChange();
    }, [notifyChange]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        requestAnimationFrame(() => {
          const el = divRef.current;
          if (!el) {
            return;
          }
          const text = extractText(el);
          const caret = getCaretOffset(el);
          onCaretChange?.(text, caret);
        });

        onKeyDown?.(e);
      },
      [onKeyDown, onCaretChange],
    );

    const handleSelectionChange = useCallback(() => {
      const el = divRef.current;
      if (!el || (!el.contains(document.activeElement) && el !== document.activeElement)) {
        return;
      }
      const text = extractText(el);
      const caret = getCaretOffset(el);
      onCaretChange?.(text, caret);
    }, [onCaretChange]);

    useEffect(() => {
      document.addEventListener("selectionchange", handleSelectionChange);
      return () => document.removeEventListener("selectionchange", handleSelectionChange);
    }, [handleSelectionChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        document.execCommand("insertText", false, text);
      }
    }, []);

    useEffect(() => {
      updateEmptyAttribute();
    }, [updateEmptyAttribute]);

    const handleCompositionStart = useCallback(() => {
      composing.current = true;
    }, []);
    const handleCompositionEnd = useCallback(() => {
      composing.current = false;
      notifyChange();
    }, [notifyChange]);

    return (
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        data-rich-input
        data-empty="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        spellCheck={false}
        className={cn(
          "min-h-[44px] max-h-40 overflow-y-auto flex-1 outline-none text-[13px] leading-relaxed whitespace-pre-wrap break-words relative py-2.5 px-1 scrollbar-none text-foreground placeholder:text-muted",
          className,
        )}
      />
    );
  },
);

// ── InlinePill component ───────────────────────────────────────────────────

export function InlinePill({ pill, onRemove }: { pill: PillData; onRemove: () => void }) {
  const label = pillLabel(pill);
  const classes = pillClasses(pill.kind as PillKind);
  return (
    <span
      contentEditable={false}
      className={cn(
        "group inline-flex items-center gap-1.5 text-[12px] font-medium select-none mx-0.5 align-baseline",
        classes,
      )}
    >
      <PillIcon pill={pill} />
      <span>{label}</span>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 text-foreground/40 hover:text-foreground/80 hover:bg-neutral-200 dark:hover:bg-zinc-800 p-0.5 rounded-full transition-colors cursor-pointer"
        aria-label={`Remove ${label}`}
      >
        <CloseCircle size={10} color="currentColor" />
      </button>
    </span>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

function getTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    let parent = node.parentElement;
    let inPill = false;
    while (parent && parent !== root) {
      if (parent.dataset.pillId) {
        inPill = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (!inPill) {
      nodes.push(node as Text);
    }
  }
  return nodes;
}
