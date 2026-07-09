"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState, type FC } from "react";
import type { ControlUiStore } from "../control-ui/control-ui-store";
import type { ArenaPlanningMode } from "./ArenaGatewayClient";
import { RichInputEditor, type PillData } from "../control-ui/RichInputEditor";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface ArenaComposerProps {
  store: ControlUiStore;
  loading: boolean;
  stage: string | null;
  disabled: boolean;
  error?: string | null;
  onSubmit: (instruction: string, mode: ArenaPlanningMode) => void;
}

type ComposerFile = { name: string; size: number };

/** Builds the final instruction sent to arena.graph.generate from the user's
 * text plus any selected skills / attached files, so the generator has the
 * same signal a human would give when briefing an assistant. */
function composeInstruction(text: string, skills: string[], files: ComposerFile[]): string {
  const lines = [text.trim()];
  if (skills.length > 0) {
    lines.push(`\nPrefer these skills where applicable: ${skills.join(", ")}.`);
  }
  if (files.length > 0) {
    lines.push(`\nAttached files for context: ${files.map((f) => f.name).join(", ")}.`);
  }
  return lines.join("\n").trim();
}

const MODE_COPY: Record<ArenaPlanningMode, { label: string; description: string }> = {
  light: { label: "Light", description: "A direct, simple workflow" },
  medium: { label: "Medium", description: "A few focused steps" },
  high: { label: "High", description: "A detailed branching plan" },
  ultra: { label: "Ultra", description: "A large, connected system" },
};

const ArenaComposer: FC<ArenaComposerProps> = ({
  store,
  loading,
  stage,
  disabled,
  error,
  onSubmit,
}) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<ComposerFile[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [mode, setMode] = useState<ArenaPlanningMode>("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  // Autocomplete suggestions states
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
    { name: "clear", description: "Clear current session" },
    { name: "build", description: "Trigger node graph build" },
    { name: "help", description: "Show canvas help instructions" },
  ];
  const availableSnippets = [
    { id: "template", handle: "template", content: "Automation template boilerplate" },
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

  useEffect(() => {
    if (!store.skillsReport && !store.skillsLoading) {
      void store.refreshSkills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skills = store.skillsReport?.skills ?? [];

  const handleSubmit = () => {
    if (!text.trim() || loading || disabled) {
      return;
    }
    onSubmit(composeInstruction(text, selectedSkills, files), mode);
    setText("");
    setFiles([]);
  };

  const toggleSkill = (skillKey: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillKey) ? prev.filter((s) => s !== skillKey) : [...prev, skillKey],
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-10">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        {error && (
          <div className="mb-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 break-words">
            {error}
          </div>
        )}
        {stage && (
          <div className="mb-2 flex items-center gap-2 text-xs text-foreground/75 bg-surface border border-border rounded-lg px-3 py-2">
            {loading && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
            <span>{stage}</span>
          </div>
        )}
        {/* Selected skills / attached files chips */}
        {(selectedSkills.length > 0 || files.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedSkills.map((key) => {
              const skill = skills.find((s) => s.skillKey === key);
              return (
                <span
                  key={key}
                  className="flex items-center gap-1 text-[10px] font-medium bg-accent/10 text-accent px-2 py-1 rounded-full"
                >
                  {skill?.emoji ?? "🧩"} {skill?.name ?? key}
                  <button
                    onClick={() => toggleSkill(key)}
                    className="hover:opacity-70"
                    title="Remove skill"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
            {files.map((file, i) => (
              <span
                key={`${file.name}-${i}`}
                className="flex items-center gap-1 text-[10px] font-medium bg-default text-foreground/70 px-2 py-1 rounded-full"
              >
                📎 {file.name}
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="hover:opacity-70"
                  title="Remove file"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-surface border border-border rounded-lg p-2.5 shadow-xl backdrop-blur-md">
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

          {/* File attach */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).map((f) => ({
                name: f.name,
                size: f.size,
              }));
              setFiles((prev) => [...prev, ...picked]);
              e.target.value = "";
              picked.forEach((f) => {
                editorRef.current?.insertPill({
                  kind: "file",
                  file: { id: f.name, dataUrl: "", mimeType: "" },
                });
              });
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach files"
            className="p-2 text-foreground/60 hover:text-foreground hover:bg-default rounded-lg shrink-0 w-9 h-9 flex items-center justify-center self-center disabled:opacity-40"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.19 9.19a1 1 0 01-1.41-1.41l8.48-8.49"
              />
            </svg>
          </button>

          {/* Skill picker */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSkillPickerOpen((v) => !v)}
              disabled={disabled}
              title="Select skills"
              className={`p-2 hover:bg-default rounded-lg w-9 h-9 flex items-center justify-center self-center disabled:opacity-40 ${
                selectedSkills.length > 0
                  ? "text-accent"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.75-.626 1.223-.626h.001a2.652 2.652 0 001.876-4.526L11.42 2.32a2.652 2.652 0 00-3.75 0L3.32 6.67a2.652 2.652 0 000 3.75l4.658 4.658M11.42 15.17l-4.658-4.658"
                />
              </svg>
            </button>
            {skillPickerOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 w-64 max-h-72 overflow-y-auto rounded-xl bg-surface border border-border shadow-xl p-2 space-y-0.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted px-2 py-1">
                  Skills
                </div>
                {store.skillsLoading ? (
                  <div className="text-xs text-muted px-2 py-2">Loading…</div>
                ) : skills.length === 0 ? (
                  <div className="text-xs text-muted px-2 py-2">No skills configured.</div>
                ) : (
                  skills.map((skill) => {
                    const checked = selectedSkills.includes(skill.skillKey);
                    return (
                      <button
                        key={skill.skillKey}
                        onClick={() => toggleSkill(skill.skillKey)}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          checked
                            ? "bg-accent/10 text-accent"
                            : "hover:bg-default text-foreground/80"
                        }`}
                      >
                        <span className="shrink-0">{skill.emoji ?? "🧩"}</span>
                        <span className="truncate flex-1">{skill.name}</span>
                        {checked && <span className="shrink-0">✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="flex-1 flex flex-col min-w-0">
            <RichInputEditor
              ref={editorRef}
              value={text}
              pills={pills}
              onPillRemove={(p) => setPills((prev) => prev.filter((x) => x !== p))}
              onChange={(newText) => {
                setText(newText);
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
                    handleSubmit();
                  }
                }
              }}
              placeholder="Describe the task to generate a graph for, or refine the current one…"
              className="w-full bg-transparent border-none text-sm text-foreground focus:outline-none resize-none max-h-40 py-2 px-1 scrollbar-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || loading || disabled}
            className="p-3 bg-accent text-accent-foreground rounded-full hover:opacity-90 transition-opacity flex items-center justify-center shrink-0 w-10 h-10 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Generate graph"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 transform rotate-90"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Plan depth
          </span>
          {(Object.keys(MODE_COPY) as ArenaPlanningMode[]).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={mode === option ? "secondary" : "ghost"}
              onPress={() => setMode(option)}
              isDisabled={disabled || loading}
              className="h-7 min-w-0 px-2.5 text-[11px]"
              aria-label={MODE_COPY[option].description}
            >
              {MODE_COPY[option].label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArenaComposer;
