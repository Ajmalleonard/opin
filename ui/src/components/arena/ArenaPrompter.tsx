"use client";

import { useState, type FC } from "react";

interface ArenaPrompterProps {
  open: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  "Research the latest AI safety papers, summarize key findings, and create a report",
  "Search for trending GitHub repos this week, analyze their tech stacks, and email the summary",
  "Monitor stock price for AAPL, if it drops below $200, send a Slack alert, otherwise log the price",
  "Scrape a website, extract key data points, summarize findings, save to a file",
];

const ArenaPrompter: FC<ArenaPrompterProps> = ({ open, isLoading, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState("");

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) {
      return;
    }
    onSubmit(prompt.trim());
    setPrompt("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Prompt to Nodes</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            Describe what you want to automate in plain English. The AI will design a node graph
            with Goals, Skills, Agents, Conditions, and Output nodes.
          </p>

          {/* Examples */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Example prompts
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="text-left text-xs text-muted/80 hover:text-foreground hover:bg-default p-2 rounded-lg transition-colors truncate"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="e.g., Research AI trends, summarize, and email the report..."
            rows={4}
            className="w-full bg-field-background rounded-xl px-4 py-3 text-sm text-field-foreground placeholder:text-muted focus:outline-none focus:border-focus border-0 resize-none"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-secondary">
          <div className="text-[10px] text-muted/70">
            The generated graph can be edited before execution
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-foreground/70 hover:text-foreground rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Graph</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaPrompter;
