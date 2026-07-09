import { PageArticle, PageRoot } from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import ChatFormattingDoc from "../../../../content/docs/chat-formatting.mdx";
import ControlUiDoc from "../../../../content/docs/control-ui.mdx";
import IndexDoc from "../../../../content/docs/index.mdx";

const DOCS = {
  "control-ui": {
    title: "Hosted Control UI",
    description: "How to deploy the browser shell while keeping the engine local.",
    Content: ControlUiDoc,
  },
  "chat-formatting": {
    title: "Chat Formatting",
    description: "Markdown rendering rules for assistant messages and docs.",
    Content: ChatFormattingDoc,
  },
} as const;

export function generateStaticParams() {
  return [{ slug: [] }, ...Object.keys(DOCS).map((slug) => ({ slug: [slug] }))];
}

export default async function DocsPageRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.[0] ?? "";
  if (!slug) {
    return (
      <PageRoot className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageArticle className="gap-6">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-200/70">
              Opin Docs
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Opin Control UI
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-foreground/70 sm:text-base">
              Docs and help for the hosted Next.js control shell.
            </p>
          </header>
          <div className="control-markdown">
            <IndexDoc />
          </div>
        </PageArticle>
      </PageRoot>
    );
  }
  const entry = DOCS[slug as keyof typeof DOCS];
  if (!entry) {
    notFound();
  }
  const Content = entry.Content;
  return (
    <PageRoot className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageArticle className="gap-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-200/70">
            Opin Docs
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {entry.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-foreground/70 sm:text-base">
            {entry.description}
          </p>
        </header>
        <div className="control-markdown">
          <Content />
        </div>
      </PageArticle>
    </PageRoot>
  );
}
