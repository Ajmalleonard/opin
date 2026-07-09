import type { MDXComponents } from "mdx/types";
import defaultMdxComponents from "fumadocs-ui/mdx";
import React, { useState, useEffect, type ReactNode } from "react";
import { codeToHtml } from "shiki";
import { useControlUiStore } from "./components/control-ui/control-ui-provider";

function getRawText(node: ReactNode): string {
  if (!node) {
    return "";
  }
  if (typeof node === "string") {
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getRawText).join("");
  }
  if (React.isValidElement(node) && node.props && (node.props as any).children !== undefined) {
    return getRawText((node.props as any).children as ReactNode);
  }
  return "";
}

interface CodeBlockProps {
  children?: ReactNode;
  [key: string]: unknown;
}

function CodeBlock({ children, ...props }: CodeBlockProps) {
  let language = "code";
  let rawCode = "";

  if (React.isValidElement(children)) {
    const codeElement = children as React.ReactElement<{
      className?: string;
      children?: ReactNode;
    }>;
    const className = codeElement.props?.className || "";
    language = className.replace(/language-/, "") || "code";
    rawCode =
      typeof codeElement.props?.children === "string"
        ? codeElement.props.children
        : getRawText(codeElement.props?.children);
  } else {
    rawCode = getRawText(children);
  }

  rawCode = rawCode.replace(/\n$/, "");

  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const store = useControlUiStore();

  useEffect(() => {
    let active = true;
    const lang = language.toLowerCase();
    const resolvedTheme =
      store.settings.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : store.settings.theme;

    const shikiTheme = resolvedTheme === "dark" ? "github-dark" : "github-light";

    codeToHtml(rawCode, {
      lang: lang || "text",
      theme: shikiTheme,
    })
      .then((html) => {
        if (active) {
          setHighlightedHtml(html);
        }
      })
      .catch((err) => {
        console.error("Shiki highlight error:", err);
      });

    return () => {
      active = false;
    };
  }, [rawCode, language, store.settings.theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([rawCode], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const extMap: Record<string, string> = {
        swift: "swift",
        json: "json",
        javascript: "js",
        js: "js",
        typescript: "ts",
        ts: "ts",
        html: "html",
        css: "css",
        python: "py",
        py: "py",
        bash: "sh",
        sh: "sh",
        rust: "rs",
        rs: "rs",
        go: "go",
        cpp: "cpp",
        c: "c",
        sql: "sql",
        yaml: "yaml",
        yml: "yaml",
        markdown: "md",
        md: "md",
        xml: "xml",
      };
      const ext = extMap[language.toLowerCase()] || "txt";
      a.download = `code.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download code: ", err);
    }
  };

  const displayLanguage = (() => {
    const l = language.trim();
    if (!l) {
      return "Code";
    }
    if (l.toLowerCase() === "js") {
      return "JavaScript";
    }
    if (l.toLowerCase() === "ts") {
      return "TypeScript";
    }
    if (l.toLowerCase() === "cpp") {
      return "C++";
    }
    if (l.toLowerCase() === "cs") {
      return "C#";
    }
    if (l.toLowerCase() === "yml") {
      return "YAML";
    }
    return l.charAt(0).toUpperCase() + l.slice(1);
  })();

  return (
    <div className="my-4 rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-neutral-100/50 dark:bg-zinc-900/35">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground uppercase">
          {displayLanguage}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3.5 h-3.5 text-emerald-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-emerald-500 font-semibold text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75a8.965 8.965 0 0 0-3.75-2.25m9 10.125V6.14a3.374 3.374 0 0 0-2.512-3.268M12 5.625c0-1.13-.18-2.22-.508-3.243m0 0a10.53 10.53 0 0 0-2.28 1.17M14.25 18a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
                  />
                </svg>
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            title="Download code file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span className="text-[11px]">Download</span>
          </button>
        </div>
      </div>
      {highlightedHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          className="shiki-container overflow-auto text-[13px] leading-relaxed scrollbar-thin"
        />
      ) : (
        <pre
          {...props}
          className="p-4 m-0 overflow-auto bg-surface border-0 font-mono text-[13px] leading-relaxed text-foreground scrollbar-thin"
        >
          {children}
        </pre>
      )}
    </div>
  );
}

function Table({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table {...props} className="w-full text-left text-sm border-collapse">
        {children}
      </table>
    </div>
  );
}

function Thead({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className="bg-neutral-100/50 dark:bg-zinc-900/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider"
    >
      {children}
    </thead>
  );
}

function Tbody({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...props} className="divide-y divide-border">
      {children}
    </tbody>
  );
}

function Tr({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr {...props} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-900/10 transition-colors">
      {children}
    </tr>
  );
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center" | "justify";
}

function Th({ children, align, ...props }: ThProps) {
  return (
    <th
      {...props}
      style={{ textAlign: align || undefined }}
      className="px-4 py-3 font-semibold text-foreground"
    >
      {children}
    </th>
  );
}

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center" | "justify";
}

function Td({ children, align, ...props }: TdProps) {
  return (
    <td
      {...props}
      style={{ textAlign: align || undefined }}
      className="px-4 py-3 text-muted-foreground"
    >
      {children}
    </td>
  );
}

function Blockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      {...props}
      className="pl-4 my-4 border-l-3 border-zinc-300 dark:border-zinc-700 text-muted-foreground italic"
    >
      {children}
    </blockquote>
  );
}

function Ul({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul {...props} className="list-disc pl-5 my-3 space-y-1.5 text-muted-foreground">
      {children}
    </ul>
  );
}

function Ol({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol {...props} className="list-decimal pl-5 my-3 space-y-1.5 text-muted-foreground">
      {children}
    </ol>
  );
}

function Li({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li {...props} className="text-sm leading-relaxed text-foreground/90">
      {children}
    </li>
  );
}

function P({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className="text-sm leading-relaxed my-3 text-foreground/90">
      {children}
    </p>
  );
}

function Hr({ ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr {...props} className="my-6 border-0 border-t border-border" />;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

function Code({ children, className, ...props }: CodeProps) {
  const isInline = !className || !className.startsWith("language-");
  if (isInline) {
    return (
      <code
        {...props}
        className="px-1.5 py-0.5 rounded font-mono text-[13px] bg-neutral-100 dark:bg-zinc-800/80 text-foreground border border-neutral-200/50 dark:border-zinc-800/50"
      >
        {children}
      </code>
    );
  }
  return (
    <code {...props} className={className}>
      {children}
    </code>
  );
}

export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: CodeBlock as any,
    table: Table as any,
    thead: Thead as any,
    tbody: Tbody as any,
    tr: Tr as any,
    th: Th as any,
    td: Td as any,
    blockquote: Blockquote as any,
    ul: Ul as any,
    ol: Ol as any,
    li: Li as any,
    p: P as any,
    hr: Hr as any,
    code: Code as any,
    ...components,
  } satisfies MDXComponents;
}
