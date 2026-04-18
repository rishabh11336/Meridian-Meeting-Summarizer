import { formatDateTime, formatDuration } from "@/lib/utils";
import type { MeetingDetail } from "@/types/meeting";
import Badge from "@/components/ui/Badge";
import { ClipboardCopy, Clock } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface Props {
  meeting: MeetingDetail;
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-6 font-display text-base font-bold text-text-primary first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 font-display text-sm font-semibold text-text-primary first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-text-secondary first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-text-primary last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 flex flex-col gap-1.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 flex flex-col gap-1.5 pl-4 last:mb-0 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="relative text-sm text-text-primary before:absolute before:-left-3.5 before:top-[0.45em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/60 [ol>&]:before:content-none [ol>&]:list-decimal">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block w-full rounded-md bg-background px-3 py-2 font-mono text-xs leading-relaxed text-text-secondary">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-accent">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-border bg-background p-3 last:mb-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-accent/40 pl-4 text-sm italic text-text-secondary last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-border last:mb-0">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-raised">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-xs text-text-primary">{children}</td>
  ),
};

export default function SummaryViewer({ meeting }: Props) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showCorrected, setShowCorrected] = useState(false);

  function handleCopy() {
    if (meeting.summary) {
      void navigator.clipboard.writeText(meeting.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {meeting.original_filename}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDuration(meeting.duration_seconds)}
            </span>
            <span>·</span>
            <span>{formatDateTime(meeting.uploaded_at)}</span>
            {meeting.has_correction && (
              <>
                <span>·</span>
                <Badge variant="accent">Corrected</Badge>
              </>
            )}
          </div>
        </div>
        {meeting.summary && (
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            <ClipboardCopy size={11} />
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {/* Rendered summary */}
      {meeting.summary ? (
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {meeting.summary}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-muted">No summary yet.</p>
        </div>
      )}

      {/* Transcripts */}
      <div className="flex flex-col gap-2">
        {meeting.has_correction && meeting.transcript_corrected && (
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setShowCorrected((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
            >
              <span>Corrected transcript</span>
              <span className="font-mono">{showCorrected ? "−" : "+"}</span>
            </button>
            {showCorrected && (
              <div className="border-t border-border bg-background px-4 py-3">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
                  {meeting.transcript_corrected}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <span>Raw transcript</span>
            <span className="font-mono">{showRaw ? "−" : "+"}</span>
          </button>
          {showRaw && (
            <div className="border-t border-border bg-background px-4 py-3">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
                {meeting.transcript_raw}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
